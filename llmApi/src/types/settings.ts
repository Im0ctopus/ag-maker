export type SettingsType = {
  [projectId: string]: ProjectSettingsType
}

export type ProjectSettingsType = {
  llms: {
    [llmName: string]: LlmType
  }
  apis: {
    [apiName: string]: ApiType
  }
}

export type LlmType = {
  entry: boolean
  model: string
  prompt: string
}

export type ApiType = {
  endpointUrl: string
  description: string
  endpoints: {
    [endpointName: string]: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE'
      path: string
      description: string
      body?: { [key: string]: string }
    }
  }
}
