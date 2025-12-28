import type { MessagesType } from '../src/types/messages'
import type { LlmType } from '../src/types/settings'

export const isLlmType = (obj: any): LlmType => {
  const typedObj: LlmType = obj as LlmType

  if (
    typeof typedObj !== 'object' ||
    typeof typedObj.entry !== 'boolean' ||
    typeof typedObj.model !== 'string' ||
    typeof typedObj.prompt !== 'string'
  )
    throw new Error('Wrong llm input')

  return typedObj
}

export const isMessageType = (obj: any): MessagesType => {
  const messages = obj as MessagesType

  if (
    !Array.isArray(messages) ||
    !messages.every(
      (message) =>
        typeof message === 'object' &&
        typeof message.role === 'string' &&
        typeof message.content === 'string'
    )
  )
    throw new Error('Wrong messages input')

  return messages
}
