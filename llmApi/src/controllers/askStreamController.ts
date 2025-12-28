import { type Request, type Response } from 'express'
import {
  models as googleModels,
  askStream as askGoogleStream,
} from '../services/llm/google'
import type { GeneratorType } from '../types/generator'
import { streamIt } from '../../utils/streamIt'
import { isLlmType, isMessageType } from '../../utils/typeVerifications'

const models: { [key: string]: string[] } = {}

export const loadModels = async () => {
  models.google = googleModels
  return models
}

export const getModels = async (req: Request, res: Response) => {
  await loadModels()

  res.json(models)
}

export const askStream = async (req: Request, res: Response) => {
  try {
    const { llm: llmAny, messages: messagesAny } = req.body
    const llm = isLlmType(llmAny)
    const messages = isMessageType(messagesAny)

    let stream: AsyncGenerator<GeneratorType>

    if (models.google?.includes(llm.model))
      stream = askGoogleStream(llm, messages)
    else throw Error(`LLM model ${llm.model} not supported`)

    for await (const chunk of stream) {
      res.write(streamIt(chunk))
    }
  } catch (e) {
    console.error(e)
    res.write(streamIt({ finishReason: 'ERROR', message: e }))
  }
  res.end()
}
