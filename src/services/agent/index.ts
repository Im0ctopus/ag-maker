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
    duration: '',
  }

  const startTime = Date.now()

  try {
    const entryLlmKey = Object.keys(projectSettings.llms).find(
      (key) => projectSettings.llms[key]?.entry
    )
    const entryLlm = projectSettings.llms[entryLlmKey || '']

    if (!entryLlm) throw new Error('No entry LLM configured for this project')

    const entryRes = await callLlm(entryLlm, messages)

    // TODO: Process the response from the LLM and take actions accordingly

    res.message = entryRes
  } catch (e) {
    res.success = false
    res.message = `${e}`
  }

  res.duration = `${Date.now() - startTime}ms`

  return res
}
