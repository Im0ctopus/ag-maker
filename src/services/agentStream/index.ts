import type { GeneratorType } from '../../types/generator'
import type { MessagesType } from '../../types/messages'
import type { LlmType, ProjectSettingsType } from '../../types/settings'
import { streamIt } from '../../utils/streamIt'
import { apiCall } from '../api'
import { callLlmStream } from '../llm'
import { type Response } from 'express'

type ResType = {
  finishReason: 'STOP' | 'ERROR'
  message?: string
  totalDuration: number
  detailedDurations: DurationsType
}

type DurationsType = {
  [key: string]: number[]
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
  }

  try {
    const durations: DurationsType = {}

    const entryLlmKey = Object.keys(projectSettings.llms).find(
      (key) => projectSettings.llms[key]?.entry
    )
    const entryLlm = projectSettings.llms[entryLlmKey || '']
    if (!entryLlm || !entryLlmKey)
      throw new Error('No entry LLM configured for this project')

    // We need to define "stream" first since callLlmStream is a function that returns an async generator aka middle man
    const stream = await callLlmStream(entryLlm, messages)

    const llmRes = await processStreamLlmResponse(
      stream,
      projectSettings,
      messages,
      {
        id: entryLlmKey,
        llm: entryLlm,
      },
      durations,
      response
    )

    res.detailedDurations = durations
    res.finishReason = llmRes.finishReason
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
  response: Response
): Promise<{ finishReason: 'ERROR' | 'STOP' }> => {
  try {
    let value: string | undefined | null = undefined
    let finishReason: 'ERROR' | 'STOP' = 'STOP'

    for await (const chunk of stream) {
      if (chunk.duration)
        durations[caller.id] = [...(durations[caller.id] || []), chunk.duration]

      if (value || (value === undefined && chunk.message.includes('$'))) {
        value = value + chunk.message
        if (chunk.finishReason) finishReason = chunk.finishReason
        continue
      } else if (value !== '') value = null

      if (chunk.finishReason) finishReason = chunk.finishReason

      response.write(streamIt(chunk))
    }

    if (value && value.includes('$$llm-')) {
      const llmId = value.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
      const llm = projectSettings.llms[llmId]
      if (!llm)
        throw new Error(`LLM with id ${llmId} not found in project settings`)
      response.write(streamIt({ action: `Calling ${llmId}...` }))
      const llmRes = await callLlmStream(llm, messages)
      return await processStreamLlmResponse(
        llmRes,
        projectSettings,
        messages,
        { id: llmId, llm },
        durations,
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
      durations[caller.id] = [...(durations[caller.id] || [])]
      durations[apiId] = [...(durations[apiId] || []), apiRes.duration]
      response.write(streamIt({ action: `Calling ${caller.id}...` }))
      const llmRes = await callLlmStream(caller.llm, apiRes.newMessages)
      return await processStreamLlmResponse(
        llmRes,
        projectSettings,
        messages,
        caller,
        durations,
        response
      )
    }

    return { finishReason }
  } catch (e) {
    throw new Error(`Agent stream processing failed - ${e}`)
  }
}
