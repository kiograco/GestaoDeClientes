import Vue from 'vue'
import VueRouter from 'vue-router'
import axios from 'axios'
import { Notify } from 'quasar'
import { getAccessToken, setAccessToken } from 'src/utils/authToken'
import { persistSessionData } from 'src/utils/session'

import routes from './routes'

Vue.use(VueRouter)

const Router = new VueRouter({
  scrollBehavior: () => ({ x: 0, y: 0 }),
  routes,
  mode: process.env.VUE_ROUTER_MODE,
  base: process.env.VUE_ROUTER_BASE
})

const whiteListName = [
  'login'
]

const tryRefreshToken = async () => {
  try {
    const { data } = await axios.post(
      `${process.env.VUE_URL_API}/auth/refresh_token`,
      {},
      { withCredentials: true }
    )
    if (data?.token) {
      setAccessToken(data.token)
      persistSessionData(data)
      return true
    }
  } catch (err) {
    return false
  }
  return false
}

Router.beforeEach(async (to, from, next) => {
  const token = getAccessToken()

  if (token || whiteListName.indexOf(to.name) !== -1) {
    next()
    return
  }

  const refreshed = await tryRefreshToken()
  if (refreshed || to.fullPath === '/login' || to.query.tokenSetup) {
    next()
    return
  }

  Notify.create({ message: 'Necessario realizar login', position: 'top' })
  next({ name: 'login' })
})

Router.afterEach(to => {
  window.scrollTo(0, 0)
})

export default Router
