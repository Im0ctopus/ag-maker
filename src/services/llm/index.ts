import type { MessagesType } from '../../types/messages'
import type { LlmType } from '../../types/settings'
import { models as openRouterModels, ask as askOpenRouter } from './openRouter'

const models: { [key: string]: string[] } = {}

export const loadModels = async () => {
  models.openRouter = openRouterModels

  return models
}

export const callLlm = async (llm: LlmType, messages: MessagesType) => {
  const model = llm.model

  if (models.openRouter?.includes(model))
    return await askOpenRouter(llm, messages)

  throw Error(`LLM model ${model} not supported`)
}
