import { type Request, type Response } from 'express'
import {
  models as openRouterModels,
  ask as askOpenRouter,
} from '../services/llm/openRouter'
import {
  models as googleModels,
  ask as askGoogle,
} from '../services/llm/google'
import { isLlmType, isMessageType } from '../../utils/typeVerifications'

const models: { [key: string]: string[] } = {}

export const loadModels = async () => {
  models.openRouter = openRouterModels
  models.google = googleModels
  return models
}

export const getModels = async (req: Request, res: Response) => {
  await loadModels()

  res.json(models)
}

export const ask = async (req: Request, res: Response) => {
  try {
    if (!req.body) throw Error('Request body is empty')

    const { llm: llmAny, messages: messagesAny } = req.body
    const llm = isLlmType(llmAny)
    const messages = isMessageType(messagesAny)

    let llmRes: {
      message: any
      duration: number
    }

    if (models.openRouter?.includes(llm.model))
      llmRes = await askOpenRouter(llm, messages)
    else if (models.google?.includes(llm.model))
      llmRes = await askGoogle(llm, messages)
    else throw Error(`LLM model ${llm.model} not supported`)

    res.json(llmRes)
  } catch (e: any) {
    console.error(e)
    res
      .status(500)
      .json({ success: false, message: `Error on llmApi: ${e.message}` })
  }
}
