import type { MessagesType } from '../../types/messages'
import type { LlmType, ProjectSettingsType } from '../../types/settings'
import { apiCall } from '../api'
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
    // FIXME: remove this. using for api implementation
    // res.message = await apiCall(
    //   projectSettings.apis['api-1'],
    //   '$$api-1$$-##{"path":"/posts/100","method":"GET"}##',
    //   'llm-4'
    // )

    const entryLlmKey = Object.keys(projectSettings.llms).find(
      (key) => projectSettings.llms[key]?.entry
    )
    const entryLlm = projectSettings.llms[entryLlmKey || '']
    if (!entryLlm) throw new Error('No entry LLM configured for this project')

    const entryRes = await callLlm(entryLlm, messages)
    res.message = await processLlmResponse(
      entryRes,
      projectSettings,
      messages,
      entryLlm
    )
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
  caller: LlmType
): Promise<string> => {
  try {
    if (res.includes('$$llm-')) {
      const llmId = res.match(/\$\$(.*?)\$\$/)?.[1]?.trim() || ''
      const llm = projectSettings.llms[llmId]
      if (!llm)
        throw new Error(`LLM with id ${llmId} not found in project settings`)

      const llmRes = await callLlm(llm, messages)
      return processLlmResponse(llmRes, projectSettings, messages, llm)
    }
    if (res.startsWith('$$api-')) {
      const apiId = res.split('$$')[1] || ''
      const api = projectSettings.apis[apiId]
      if (!api)
        throw new Error(`API with id ${apiId} not found in project settings`)

      const apiRes = await apiCall(api, res, caller, messages)

      return apiRes
    }

    return res
  } catch (e) {
    return `Error processing LLM response: ${e}`
  }
}
