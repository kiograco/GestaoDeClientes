import request from 'src/service/request'

export function RealizarLogin (user) {
  return request({
    url: '/auth/login/',
    method: 'post',
    data: user
  })
}

export function RealizarLogout (user) {
  return request({
    url: '/auth/logout/',
    method: 'post',
    data: user
  })
}

export function RefreshToken () {
  return request({
    url: '/auth/refresh_token',
    method: 'post'
  })
}

export function SolicitarRedefinicaoSenha (email) {
  return request({
    url: '/auth/password-reset/request',
    method: 'post',
    data: { email }
  })
}

export function RedefinirSenha (token, password) {
  return request({
    url: '/auth/password-reset/confirm',
    method: 'post',
    data: { token, password }
  })
}
