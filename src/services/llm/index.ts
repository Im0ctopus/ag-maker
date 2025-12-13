import type { MessagesType } from '../../types/messages'
import type { LlmType } from '../../types/settings'
import { models as openRouterModels } from './openRouter'

const models: { [key: string]: string[] } = {}

export const loadModels = async () => {
  models.openRouter = openRouterModels

  return models
}

export const callLlm = async (llm: LlmType, messages: MessagesType) => {}
