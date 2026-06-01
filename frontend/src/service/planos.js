import request from 'src/service/request'

export function ListarPlanos () {
  return request({
    url: '/admin/plans',
    method: 'get'
  })
}

export function CriarPlano (data) {
  return request({
    url: '/admin/plans',
    method: 'post',
    data
  })
}

export function AtualizarPlano (planId, data) {
  return request({
    url: `/admin/plans/${planId}`,
    method: 'put',
    data
  })
}
