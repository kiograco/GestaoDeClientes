let accessToken = null

const notifyTokenChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('access-token-updated', {
      detail: { hasToken: !!accessToken }
    }))
  }
}

export const setAccessToken = token => {
  accessToken = token || null
  notifyTokenChange()
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
  notifyTokenChange()
}
