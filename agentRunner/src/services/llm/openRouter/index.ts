import type { MessagesType } from '../../../types/messages'
import type { LlmType } from '../../../types/settings'

export const models = ['google/gemma-3-27b-it:free', 'openai/gpt-oss-20b:free']

export const ask = async (llm: LlmType, userMessages: MessagesType) => {
  try {
    const startDate = Date.now()

    const key = process.env.OPEN_ROUTER_KEY
    const url = process.env.OPEN_ROUTER_ENDPOINT || ''

    const messages: MessagesType = [
      {
        role: 'system',
        content: llm.prompt,
      },
      ...userMessages,
    ]

    const body = JSON.stringify({
      model: llm.model,
      messages,
      stream: false,
    })

    const options: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body,
    }

    const res = await fetch(url, options)
    const data = (await res.json()) as any

    if (data.error) {
      console.error(`Error calling ${llm.model} - ${data.error.message}`)
      throw new Error(`Error calling ${llm.model} - ${data.error.message}`)
    }

    const duration = Date.now() - startDate
    console.info(`-L- OpenRouter's ${llm.model} response time: ${duration} ms`)

    const message = data.choices[0].message.content
    if (!message) throw new Error('No message returned from OpenRouter LLM')

    return { message, duration }
  } catch (e: any) {
    throw new Error(`${e.message}`)
  }
}
