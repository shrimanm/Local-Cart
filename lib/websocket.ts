// Simple WebSocket notification system
const connections = new Map<string, Set<(data: any) => void>>()

export function subscribeToShop(shopId: string, callback: (data: any) => void) {
  if (!connections.has(shopId)) {
    connections.set(shopId, new Set())
  }
  connections.get(shopId)!.add(callback)
  
  return () => {
    connections.get(shopId)?.delete(callback)
  }
}

export function notifyShop(shopId: string, data: any) {
  const callbacks = connections.get(shopId)
  if (callbacks) {
    callbacks.forEach(callback => callback(data))
  }
}