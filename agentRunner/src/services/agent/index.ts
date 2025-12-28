import type { MessagesType } from '../../types/messages'
import type { LlmType, ProjectSettingsType } from '../../types/settings'
import { type Usage } from '../../types/usage'
import { apiCall } from '../api'
import { callLlm } from '../llm'

type DurationsType = {
  [key: string]: number[]
}

type AgentUsage = {
  [key: string]: Usage[]
}

type ResType = {
  success: boolean
  message: string
  totalDuration: number
  detailedDurations: DurationsType
  usage: AgentUsage
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

    const entryRes = await callLlm(entryLlm, messages)

    durations[entryLlmKey] = [entryRes.duration]
    if (entryRes.usage) usage[entryLlmKey] = [entryRes.usage]
    res.message = await processLlmResponse(
      entryRes.message,
      projectSettings,
      messages,
      { id: entryLlmKey, llm: entryLlm },
      durations,
      usage
    )
    res.detailedDurations = durations
    res.usage = usage
  } catch (e: any) {
    res.success = false
    res.message = `${e.message}`
  }

  return res
}

const processLlmResponse = async (
  res: string,
  projectSettings: ProjectSettingsType,
  messages: MessagesType,
  caller: { id: string; llm: LlmType },
  durations: DurationsType,
  usage: AgentUsage
): Promise<string> => {
  if (res.includes('$$llm-')) {
    const llmId = res.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
    const llm = projectSettings.llms[llmId]
    if (!llm)
      throw new Error(`LLM with id ${llmId} not found in project settings`)

    const llmRes = await callLlm(llm, messages)

    durations[llmId] = [...(durations[llmId] || []), llmRes.duration]
    if (llmRes.usage) usage[llmId] = [...(usage[llmId] || []), llmRes.usage]
    return processLlmResponse(
      llmRes.message,
      projectSettings,
      messages,
      { id: llmId, llm },
      durations,
      usage
    )
  }
  if (res.includes('$$api-')) {
    const apiId = res.split('$$')[1] || ''
    const api = projectSettings.apis[apiId]
    if (!api)
      throw new Error(`API with id ${apiId} not found in project settings`)

    const apiRes = await apiCall(api, res, messages)
    const llmRes = await callLlm(caller.llm, apiRes.newMessages)

    durations[caller.id] = [...(durations[caller.id] || []), llmRes.duration]
    if (llmRes.usage)
      usage[caller.id] = [...(usage[caller.id] || []), llmRes.usage]
    durations[apiId] = [...(durations[apiId] || []), apiRes.duration]
    return llmRes.message
  }

  return res
}
