import request from 'src/service/request'

export function ListarPlanosDisponiveis () {
  return request({
    url: '/billing/plans',
    method: 'get'
  })
}

export function ConsultarAssinatura () {
  return request({
    url: '/billing/subscription',
    method: 'get'
  })
}

export function CriarPagamento (data) {
  return request({
    url: '/billing/payments',
    method: 'post',
    data
  })
}
