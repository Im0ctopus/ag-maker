export type GeneratorType = {
  message: string
  finishReason?: 'ERROR' | 'STOP'
  duration?: number
}
