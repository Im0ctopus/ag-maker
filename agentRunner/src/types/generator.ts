import type { Usage } from './usage'

export type GeneratorType = {
  message: string
  finishReason?: 'ERROR' | 'STOP'
  duration?: number
  usage?: Usage
}
