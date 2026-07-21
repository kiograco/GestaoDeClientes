const listeners = new Map()

export default {
  on (event, handler) {
    if (!listeners.has(event)) listeners.set(event, [])
    listeners.get(event).push(handler)
  },
  off (event, handler) {
    if (!listeners.has(event)) return
    if (!handler) {
      listeners.delete(event)
      return
    }
    listeners.set(event, listeners.get(event).filter(h => h !== handler))
  },
  emit (event, ...args) {
    if (!listeners.has(event)) return
    listeners.get(event).slice().forEach(handler => handler(...args))
  }
}
