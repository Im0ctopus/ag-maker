import { type Request, type Response } from 'express'
import { getSettings } from '../utils/getSettings'
import { loadModels } from '../services/llm'
import { processAgentRequest } from '../services/agent'

// Load settings at module level to avoid reloading on each request
const settings = await getSettings()
if (!settings) {
  throw new Error('Failed to load settings')
}

export const getModels = async (req: Request, res: Response) => {
  const models = await loadModels()
  res.json(models)
}

export const ask = async (req: Request, res: Response) => {
  try {
    const startDate = Date.now()

    const { projectId, messages: messagesString } = req.body

    const messages = JSON.parse(messagesString)
    const projectSettings = settings[projectId]
    if (!projectSettings)
      throw new Error(`No settings found for project ID ${projectId}`)

    const agentRes = await processAgentRequest(projectSettings, messages)

    agentRes.totalDuration = Date.now() - startDate

    return res.json(agentRes)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ success: false, message: `${e}` })
  }
}
