import type { MessagesType } from '../../types/messages'
import type { ApiType } from '../../types/settings'

type ApiDataType = {
  path: string
  method: string
  body: string
}

export const apiCall = async (
  apiData: ApiType,
  requestData: string,
  messages: MessagesType
) => {
  const startDate = Date.now()

  const dataString = requestData.split('##')[1] || ''
  const data = JSON.parse(dataString) as ApiDataType

  const options: RequestInit = {
    method: data.method,
    // TODO: Headers should be configurable per API
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (
    data.method !== 'GET' &&
    data.method !== 'HEAD' &&
    data.method !== 'OPTIONS'
  )
    options.body = data.body

  const res = await fetch(`${apiData.endpointUrl}${data.path}`, options)
  const resData = JSON.stringify(await res.json())

  const duration = Date.now() - startDate
  console.info(
    `-A- API ${requestData.split('$$')[1]} response time: ${duration} ms`
  )

  const newMessages: MessagesType = [
    ...messages,
    {
      role: 'user',
      content: `This is the api answer: ${resData}. RESPOND TO THE PREVIOUS MESSAGE USING THIS INFORMATION IF IT IS RELEVANT. THE RESPONSE MUST BE SHORT, CONCISE AND WELL FORMED LIKE A NORMAL CONVERSATION. DO NOT USE ANY TECHNICAL TERMS OR JSON FORMATTING.`,
    },
  ]

  return { newMessages, duration }
}
