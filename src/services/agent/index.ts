import type { MessagesType } from '../../types/messages'
import type { ProjectSettingsType } from '../../types/settings'
import { callLlm } from '../llm'

export const processAgentRequest = async (
  projectSettings: ProjectSettingsType,
  messages: MessagesType
) => {
  const res = {
    success: true,
    message: '',
    duration: 0,
  }

  try {
    const entryLlmKey = Object.keys(projectSettings.llms).find(
      (key) => projectSettings.llms[key]?.entry
    )
    const entryLlm = projectSettings.llms[entryLlmKey || '']
    if (!entryLlm) throw new Error('No entry LLM configured for this project')

    const entryRes = await callLlm(entryLlm, messages)
    res.message = await processLlmResponse(entryRes, projectSettings, messages)
  } catch (e) {
    res.success = false
    res.message = `${e}`
  }

  return res
}

const processLlmResponse = async (
  res: string,
  projectSettings: ProjectSettingsType,
  messages: MessagesType
): Promise<string> => {
  try {
    if (res.includes('$$llm-')) {
      const llmId = res.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
      const llm = projectSettings.llms[llmId]
      if (!llm)
        throw new Error(`LLM with id ${llmId} not found in project settings`)

      const llmRes = await callLlm(llm, messages)
      return processLlmResponse(llmRes, projectSettings, messages)
    }
    if (res.startsWith('$$api-')) return 'Api not implemented yet'

    return res
  } catch (e) {
    return `Error processing LLM response: ${e}`
  }
}
