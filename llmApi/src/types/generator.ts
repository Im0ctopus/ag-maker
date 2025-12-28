import type { Usage } from './usage'

export type GeneratorType = {
  model: string
  message: string
  finishReason?: 'ERROR' | 'STOP'
  duration?: number
  usage?: Usage
}
