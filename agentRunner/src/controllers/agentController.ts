import { type Request, type Response } from 'express'
import { settings } from '../utils/getSettings'
import { processAgentRequest } from '../services/agent'
import { streamIt } from '../utils/streamIt'
import { processAgentStreamRequest } from '../services/agentStream'

export const ask = async (req: Request, res: Response) => {
  try {
    const startDate = Date.now()

    const { projectId, messages } = req.body

    const projectSettings = settings[projectId]
    if (!projectSettings)
      throw new Error(`No settings found for project ID ${projectId}`)

    const agentRes = await processAgentRequest(projectSettings, messages)

    agentRes.totalDuration = Date.now() - startDate

    let finalRes = {
      success: agentRes.success,
      message: agentRes.message,
    }

    if (process.env.DEV_MODE === 'true') finalRes = agentRes

    res.json(finalRes)
  } catch (e) {
    console.error(e)
    res.status(500).json({ success: false, message: `${e}` })
  }
}

export const askStream = async (req: Request, res: Response) => {
  try {
    const startDate = Date.now()

    const { projectId, messages } = req.body

    const projectSettings = settings[projectId]
    if (!projectSettings)
      throw new Error(`No settings found for project ID ${projectId}`)

    const agentRes = await processAgentStreamRequest(
      projectSettings,
      messages,
      res,
    )

    agentRes.totalDuration = Date.now() - startDate

    let finalRes = {
      finishReason: agentRes.finishReason,
      message: agentRes.message,
    }

    if (process.env.DEV_MODE === 'true')
      finalRes = { ...agentRes, message: agentRes.message }

    res.write(streamIt(finalRes))
  } catch (e) {
    console.error(e)
    res.write(streamIt({ finishReason: 'ERROR', message: e }))
  }
  res.end()
}
