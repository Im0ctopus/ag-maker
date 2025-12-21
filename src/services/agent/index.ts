import type { MessagesType } from '../../types/messages'
import type { LlmType, ProjectSettingsType } from '../../types/settings'
import { apiCall } from '../api'
import { callLlm } from '../llm'

type ResType = {
  success: boolean
  message: string
  totalDuration: number
  detailedDurations: DurationsType
}

type DurationsType = {
  [key: string]: number[]
}

export const processAgentRequest = async (
  projectSettings: ProjectSettingsType,
  messages: MessagesType
) => {
  const res: ResType = {
    success: true,
    message: '',
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

    const entryRes = await callLlm(entryLlm, messages)

    durations[entryLlmKey] = [entryRes.duration]
    res.message = await processLlmResponse(
      entryRes.message,
      projectSettings,
      messages,
      { id: entryLlmKey, llm: entryLlm },
      durations
    )
    res.detailedDurations = durations
  } catch (e) {
    res.success = false
    res.message = `${e}`
  }

  return res
}

const processLlmResponse = async (
  res: string,
  projectSettings: ProjectSettingsType,
  messages: MessagesType,
  caller: { id: string; llm: LlmType },
  durations: DurationsType
): Promise<string> => {
  try {
    if (res.includes('$$llm-')) {
      const llmId = res.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
      const llm = projectSettings.llms[llmId]
      if (!llm)
        throw new Error(`LLM with id ${llmId} not found in project settings`)

      const llmRes = await callLlm(llm, messages)

      durations[llmId] = [...(durations[llmId] || []), llmRes.duration]
      return processLlmResponse(
        llmRes.message,
        projectSettings,
        messages,
        { id: llmId, llm },
        durations
      )
    }
    if (res.includes('$$api-')) {
      const apiId = res.split('$$')[1] || ''
      const api = projectSettings.apis[apiId]
      if (!api)
        throw new Error(`API with id ${apiId} not found in project settings`)

      const apiRes = await apiCall(api, res, caller.llm, messages)

      durations[caller.id] = [
        ...(durations[caller.id] || []),
        apiRes.llmRes.duration,
      ]
      durations[apiId] = [...(durations[apiId] || []), apiRes.duration]
      return apiRes.llmRes.message
    }

    return res
  } catch (e) {
    return `${e}`
  }
}
