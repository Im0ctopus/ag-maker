import type { MessagesType } from '../../../types/messages'
import type { LlmType } from '../../../types/settings'

export const models = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-3-27b-it',
]

export const ask = async (llm: LlmType, userMessages: MessagesType) => {
  try {
    const startDate = Date.now()

    const key = process.env.GOOGLE_KEY
    const url = `${process.env.GOOGLE_ENDPOINT || ''}${
      llm.model
    }:generateContent`

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: llm.prompt,
          },
        ],
      },
      ...userMessages.map(({ content, role }) => ({
        role: role === 'assistant' ? 'model' : role,
        parts: [
          {
            text: content,
          },
        ],
      })),
    ]

    const body = JSON.stringify({
      contents,
    })

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'x-goog-api-key': `${key}`,
        'Content-Type': 'application/json',
      },
      body,
    }

    const res = await fetch(url, options)
    const data = (await res.json()) as any

    if (data.error) {
      console.error(`EG- Google LLM error: ${data.error.message}`)
      throw new Error(data.error.status)
    }

    const duration = Date.now() - startDate
    console.info(`-L- Google's ${llm.model} response time: ${duration} ms`)

    const message = data.candidates[0].content.parts[0].text

    return { message, duration }
  } catch (e: any) {
    throw new Error(`Google LLM request failed - ${e.message}`)
  }
}
