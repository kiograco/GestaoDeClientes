import axios from 'axios'
import Router from '../router/index'

import loading from 'src/utils/loading'
import { Notify } from 'quasar'

import backendErrors from './erros'
import { RefreshToken } from './login'
import { clearAccessToken, getAccessToken, setAccessToken } from 'src/utils/authToken'
import { persistSessionData } from 'src/utils/session'

const service = axios.create({
  baseURL: process.env.VUE_URL_API,
  timeout: 20000,
  withCredentials: true
})

const handlerError = err => {
  const errorMsg = err?.response?.data?.error
  let error = 'Ocorreu um erro não identificado.'
  if (errorMsg) {
    if (backendErrors[errorMsg]) {
      error = backendErrors[errorMsg]
    } else {
      error = err.response.data.error
    }
  }
  Notify.create({
    position: 'top',
    type: 'negative',
    progress: true,
    message: `${JSON.stringify(error)}`
  })
}

// const tokenInicial = url => {
//   const paths = [
//     '/login/'
//   ]
//   let is_init = false
//   paths.forEach(path => {
//     url.indexOf(path) !== -1 ? is_init = true : is_init = false
//   })
//   return is_init
// }

service.interceptors.request.use(
  config => {
    try {
      if (config.loading) {
        loading.show(config.loading)
      }
    } catch (error) {

    }

    // let url = config.url
    // const r = new RegExp('id_conta_cliente', 'g')
    // url = url.replace(r, id_conta_cliente)
    // const u = new RegExp('id_unidade_negocio', 'g')
    // config.url = url.replace(u, id_unidade_negocio)
    const tokenAuth = getAccessToken()
    if (tokenAuth) {
      // config.headers['Authorization'] = 'Bearer ' + token
      config.headers.Authorization = 'Bearer ' + tokenAuth
    }
    return config
  },
  error => {
    // handlerError(error)
    Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    loading.hide(response.config)
    const res = response
    const status = res.status
    if (status.toString().substr(0, 1) !== '2') {
      // handlerError(res)
      return Promise.reject('error')
    } else {
      return response
    }
  },
  error => {
    loading.hide(error.config)
    const requestUrl = error?.config?.url || ''
    const isAuthRequest = requestUrl.indexOf('/auth/') !== -1
    const errorCode = error?.response?.data?.error
    const tenantAccessErrors = ['ERR_TENANT_INACTIVE', 'ERR_TENANT_ACCESS_EXPIRED']
    if (tenantAccessErrors.includes(errorCode)) {
      handlerError(error)
      if (errorCode === 'ERR_TENANT_ACCESS_EXPIRED' && Router.currentRoute.name !== 'minha-assinatura') {
        Router.push({ name: 'minha-assinatura' })
      }
    } else if ([401, 403].includes(error?.response?.status) && !isAuthRequest && !error.config._retry) {
      error.config._retry = true
      return RefreshToken().then(res => {
        if (res.data) {
          setAccessToken(res.data.token)
          persistSessionData(res.data)
          error.config.headers.Authorization = 'Bearer ' + res.data.token
          return service(error.config)
        }
      }).catch(refreshError => {
        return Promise.reject(refreshError)
      })
    }
    if (error.response && error.response.status === 401) {
      clearAccessToken()
      localStorage.removeItem('username')
      localStorage.removeItem('profile')
      localStorage.removeItem('userId')
      if (error.config.url.indexOf('logout') === -1) {
        handlerError(error)
        setTimeout(() => {
          Router.push({
            name: 'login'
          })
        }, 2000)
      }
    } else if (error.response && error.response.status === 500) {
      handlerError(error)
    } else if (error.message.indexOf('timeout') > -1) {
      Notify.create({
        message: 'Processando informações de estatisticas',
        position: 'top',
        type: 'positive',
        progress: true
      })
    } else {
      // handlerError(error)
    }
    return Promise.reject(error.response)
  }
)

export default service
