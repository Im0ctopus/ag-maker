import type { MessagesType } from '../../../types/messages'
import type { LlmType } from '../../../types/settings'

export const models = ['google/gemma-3-27b-it:free']

export const ask = async (
  llm: LlmType,
  userMessages: MessagesType
): Promise<string> => {
  try {
    const key = process.env.OPEN_ROUTER_KEY
    const url = process.env.OPEN_ROUTER_ENDPOINT || ''

    const messages: MessagesType = [
      {
        role: 'user',
        content: llm.prompt,
      },
      ...userMessages,
    ]

    const options: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llm.model,
        messages,
        stream: false,
      }),
    }

    const res = await fetch(url, options)
    const data = (await res.json()) as any
    const message = data.choices[0].message.content
    if (!message) throw new Error('No message returned from OpenRouter LLM')

    return message
  } catch (e) {
    throw new Error(`OpenRouter LLM request failed: ${e}`)
  }
}
