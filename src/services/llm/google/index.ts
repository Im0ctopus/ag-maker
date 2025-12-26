import type { GeneratorType } from '../../../types/generator'
import type { MessagesType } from '../../../types/messages'
import type { LlmType } from '../../../types/settings'
import { streamIt } from '../../../utils/streamIt'

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

export async function* askStream(
  llm: LlmType,
  userMessages: MessagesType
): AsyncGenerator<GeneratorType> {
  try {
    const startDate = Date.now()

    const key = process.env.GOOGLE_KEY
    const url = `${process.env.GOOGLE_ENDPOINT || ''}${
      llm.model
    }:streamGenerateContent?alt=sse`

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
    if (!res.ok || !res.body) {
      console.error(`EG- Google LLM stream error: ${res.statusText}`)
      throw new Error(
        `Google LLM stream request failed with status ${res.status}`
      )
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finish: 'STOP' | 'ERROR' = 'STOP'

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const res = line.slice(6)

          try {
            const data = JSON.parse(res)
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            const finishReason = data.candidates?.[0]?.content?.finishReason

            if (text)
              yield {
                message: text as string,
              }
            if (finishReason)
              finish = finishReason === 'STOP' ? 'STOP' : 'ERROR'
          } catch (e) {
            // This empty catch is intentional to avoid breaking the stream on JSON parse errors
          }
        }
      }
    }

    const duration = Date.now() - startDate
    console.info(`-L- Google's ${llm.model} response time: ${duration} ms`)
    yield {
      message: '',
      finishReason: finish,
      duration,
    }
  } catch (e: any) {
    yield {
      finishReason: 'ERROR',
      message: `Google LLM request failed - ${e.message}`,
    }
  }
}
