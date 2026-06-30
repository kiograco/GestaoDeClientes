import { io } from 'socket.io-client'
import { getAccessToken } from 'src/utils/authToken'

export const socketIO = () => {
  const socket = io(process.env.VUE_URL_API, {
    reconnection: true,
    autoConnect: !!getAccessToken(),
    transports: ['polling', 'websocket'],
    auth: (cb) => {
      const token = getAccessToken()
      // eslint-disable-next-line standard/no-callback-literal
      cb({ token })
    }
  })

  if (typeof window !== 'undefined') {
    window.addEventListener('access-token-updated', event => {
      const hasToken = !!event.detail?.hasToken
      if (hasToken && !socket.connected) {
        socket.connect()
      } else if (!hasToken && socket.connected) {
        socket.disconnect()
      }
    })
  }

  return socket
}

const socket = socketIO()

socket.io.on('error', (error) => {
  // ...
  console.error('socket error', error)
})

socket.on('disconnect', (reason) => {
  console.info('socket disconnect', reason)

  // if (reason === "io server disconnect") {
  //   // the disconnection was initiated by the server, you need to reconnect manually
  //   socket.connect();
  // }
  // else the socket will automatically try to reconnect
})
