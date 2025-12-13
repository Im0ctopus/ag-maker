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

  const entryLlmKey = Object.keys(projectSettings.llms).find(
    (key) => projectSettings.llms[key]?.entry
  )
  const entryLlm = projectSettings.llms[entryLlmKey || '']

  if (!entryLlm) throw new Error('No entry LLM configured for this project')

  await callLlm(entryLlm, messages)

  res.duration = `${Date.now() - startTime}ms`

  return res
}
