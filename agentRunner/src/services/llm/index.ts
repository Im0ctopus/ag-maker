import type { GeneratorType } from '../../types/generator'
import type { MessagesType } from '../../types/messages'
import type { LlmType } from '../../types/settings'
import type { Usage } from '../../types/usage'

export const callLlm = async (llm: LlmType, messages: MessagesType) => {
  const startDate = Date.now()

  if (!process.env.LLM_API_URL) throw new Error('LLM_API_URL not defined')
  const url = `${process.env.LLM_API_URL}/ask`

  const token = process.env.LLM_TOKEN
  if (!token) throw new Error('LLM_TOKEN not defined')

  const body = JSON.stringify({
    llm,
    messages,
  })

  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body,
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    const data = (await res.json()) as { success: boolean; message: string }
    throw new Error(`${data.message}`)
  }

  const data = (await res.json()) as GeneratorType
  const message = data.message
  const usage = data.usage
  const duration = Date.now() - startDate
  console.info(`-L- ${llm.model} response time: ${duration} ms`)

  return {
    message,
    duration,
    usage,
  }
}

export async function* callLlmStream(
  llm: LlmType,
  messages: MessagesType
): AsyncGenerator<GeneratorType> {
  const startDate = Date.now()

  if (!process.env.LLM_API_URL) throw new Error('LLM_API_URL not defined')
  const url = `${process.env.LLM_API_URL}/ask-stream`

  const token = process.env.LLM_TOKEN
  if (!token) throw new Error('LLM_TOKEN not defined')

  const body = JSON.stringify({
    llm,
    messages,
  })

  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body,
  }

  const res = await fetch(url, options)
  if (!res.ok || !res.body) {
    console.error(`EL- llmApi stream error: ${res.statusText}`)
    throw new Error(`Stream request failed with status ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let model: string = llm.model
  let finish: 'STOP' | 'ERROR' = 'STOP'
  let usage: Usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }

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
          const message = data.message as string
          const llmUsage = data.usage
          model = data.model
          const finishReason = data.finishReason

          yield {
            message,
          }
          if (finishReason) finish = finishReason === 'STOP' ? 'STOP' : 'ERROR'
          if (llmUsage) usage = llmUsage
        } catch (e) {
          // This empty catch is intentional to avoid breaking the stream on JSON parse errors
        }
      }
    }
  }

  const duration = Date.now() - startDate
  console.info(`-L- ${llm.model} response time: ${duration} ms`)
  yield {
    message: '',
    finishReason: finish,
    duration,
    usage,
  }
}
