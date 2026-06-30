import Vue from 'vue'
import VueRouter from 'vue-router'
import axios from 'axios'
import { Notify } from 'quasar'
import { getAccessToken, setAccessToken } from 'src/utils/authToken'
import { persistSessionData } from 'src/utils/session'
import { canAccessRoute, defaultRouteByProfile, routeAccessRules, routeDisplayNames } from './access'

import routes from './routes'

Vue.use(VueRouter)

const Router = new VueRouter({
  scrollBehavior: () => ({ x: 0, y: 0 }),
  routes,
  mode: process.env.VUE_ROUTER_MODE,
  base: process.env.VUE_ROUTER_BASE
})

const publicRouteNames = Object.keys(routeAccessRules).filter(name => routeAccessRules[name].public)

const getEnabledModules = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario') || '{}').enabledModules || {}
  } catch (error) {
    return {}
  }
}

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

  if (publicRouteNames.includes(to.name)) {
    next()
    return
  }

  const refreshed = token ? true : await tryRefreshToken()
  if (!token && !refreshed && !to.query.tokenSetup) {
    Notify.create({ message: 'Necessario realizar login', position: 'top' })
    next({ name: 'login' })
    return
  }

  const profile = localStorage.getItem('profile')
  if (!canAccessRoute(to.name, profile, getEnabledModules())) {
    Notify.create({ type: 'warning', message: 'Voce nao tem permissao para acessar esta pagina.', position: 'top' })
    next(defaultRouteByProfile(profile))
    return
  }

  next()
})

Router.afterEach(to => {
  document.title = `${routeDisplayNames[to.name] || 'CRM'} | NCProgrammers CRM`
  window.scrollTo(0, 0)
})

export default Router
