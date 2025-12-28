import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null

export function connectWebSocket(onMessage, onError) {
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
  
  // Disconnect existing client if any
  if (client) {
    try {
      client.deactivate()
    } catch (e) {
      // Ignore
    }
  }
  
  client = new Client({
    webSocketFactory: () => {
      try {
        return new SockJS(wsUrl)
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        if (onError) onError(error)
        throw error
      }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket connected')
      try {
        client.subscribe('/topic/incidents', (message) => {
          try {
            const incident = JSON.parse(message.body)
            onMessage(incident)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        })
      } catch (error) {
        console.error('Failed to subscribe to WebSocket topic:', error)
        if (onError) onError(error)
      }
    },
    onStompError: (frame) => {
      console.error('WebSocket STOMP error:', frame)
      if (onError) onError(new Error(frame.headers?.message || 'WebSocket error'))
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
    },
    onWebSocketError: (error) => {
      console.error('WebSocket connection error:', error)
      if (onError) onError(error)
    },
  })

  try {
    client.activate()
  } catch (error) {
    console.error('Failed to activate WebSocket client:', error)
    if (onError) onError(error)
  }
  
  return client
}

export function disconnectWebSocket() {
  if (client) {
    client.deactivate()
    client = null
  }
}

