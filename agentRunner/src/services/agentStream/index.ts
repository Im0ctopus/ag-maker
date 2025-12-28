import type { GeneratorType } from '../../types/generator'
import type { MessagesType } from '../../types/messages'
import type { LlmType, ProjectSettingsType } from '../../types/settings'
import type { Usage } from '../../types/usage'
import { streamIt } from '../../utils/streamIt'
import { apiCall } from '../api'
import { callLlmStream } from '../llm'
import { type Response } from 'express'

type DurationsType = {
  [key: string]: number[]
}

type AgentUsage = {
  [key: string]: Usage[]
}

type ResType = {
  finishReason: 'STOP' | 'ERROR'
  message?: string
  totalDuration: number
  detailedDurations: DurationsType
  usage: AgentUsage
}

export const processAgentStreamRequest = async (
  projectSettings: ProjectSettingsType,
  messages: MessagesType,
  response: Response
) => {
  const res: ResType = {
    finishReason: 'STOP',
    totalDuration: 0,
    detailedDurations: {},
    usage: {},
  }

  try {
    const durations: DurationsType = {}
    const usage: AgentUsage = {}

    const entryLlmKey = Object.keys(projectSettings.llms).find(
      (key) => projectSettings.llms[key]?.entry
    )
    const entryLlm = projectSettings.llms[entryLlmKey || '']
    if (!entryLlm || !entryLlmKey)
      throw new Error('No entry LLM configured for this project')

    response.write(streamIt({ action: `Calling entry ${entryLlmKey}...` }))
    const stream = callLlmStream(entryLlm, messages)
    const llmRes = await processStreamLlmResponse(
      stream,
      projectSettings,
      messages,
      {
        id: entryLlmKey,
        llm: entryLlm,
      },
      durations,
      usage,
      response
    )

    res.detailedDurations = durations
    res.finishReason = llmRes.finishReason
    res.usage = usage
  } catch (e) {
    res.finishReason = 'ERROR'
    res.message = `${e}`
  }
  return res
}

const processStreamLlmResponse = async (
  stream: AsyncGenerator<GeneratorType>,
  projectSettings: ProjectSettingsType,
  messages: MessagesType,
  caller: { id: string; llm: LlmType },
  durations: DurationsType,
  usage: AgentUsage,
  response: Response
): Promise<{ finishReason: 'ERROR' | 'STOP' }> => {
  try {
    let value: string | undefined | null = undefined
    let finishReason: 'ERROR' | 'STOP' = 'STOP'

    for await (const chunk of stream) {
      if (chunk.duration)
        durations[caller.id] = [...(durations[caller.id] || []), chunk.duration]
      if (chunk.usage)
        usage[caller.id] = [...(usage[caller.id] || []), chunk.usage]

      if (value || (value === undefined && chunk.message.includes('$'))) {
        value = value + chunk.message
        if (chunk.finishReason) finishReason = chunk.finishReason
        continue
      } else if (value !== '') value = null

      if (chunk.finishReason) {
        finishReason = chunk.finishReason
        continue
      }

      response.write(streamIt(chunk))
    }

    if (value && value.includes('$$llm-')) {
      const llmId = value.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
      const llm = projectSettings.llms[llmId]
      if (!llm)
        throw new Error(`LLM with id ${llmId} not found in project settings`)
      response.write(streamIt({ action: `Calling ${llmId}...` }))
      const llmRes = callLlmStream(llm, messages)
      return await processStreamLlmResponse(
        llmRes,
        projectSettings,
        messages,
        { id: llmId, llm },
        durations,
        usage,
        response
      )
    }

    if (value && value.includes('$$api-')) {
      const apiId = value.split('$$')[1] || ''
      const api = projectSettings.apis[apiId]
      if (!api)
        throw new Error(`API with id ${apiId} not found in project settings`)
      response.write(streamIt({ action: `Calling ${apiId}...` }))
      const apiRes = await apiCall(api, value, messages)
      durations[apiId] = [...(durations[apiId] || []), apiRes.duration]
      response.write(streamIt({ action: `Calling ${caller.id}...` }))
      const llmRes = callLlmStream(caller.llm, apiRes.newMessages)
      return await processStreamLlmResponse(
        llmRes,
        projectSettings,
        messages,
        caller,
        durations,
        usage,
        response
      )
    }

    return { finishReason }
  } catch (e) {
    throw new Error(`Agent stream processing failed - ${e}`)
  }
}
