import request from 'src/service/request'

export function MostrarHorariosAtendiemento () {
  return request({
    url: '/tenants/business-hours/',
    method: 'get'
  })
}

export function AtualizarHorariosAtendiemento (data) {
  return request({
    url: '/tenants/business-hours/',
    method: 'put',
    data
  })
}

export function AtualizarMensagemHorariosAtendiemento (data) {
  return request({
    url: '/tenants/message-business-hours/',
    method: 'put',
    data
  })
}

export function AtualizarLogoEmpresa (data) {
  return request({
    url: '/tenants/logo',
    method: 'put',
    data
  })
}

export function ListarEmpresas () {
  return request({
    url: '/admin/tenants',
    method: 'get'
  })
}

export function CriarEmpresa (data) {
  return request({
    url: '/admin/tenants',
    method: 'post',
    data
  })
}

export function AtualizarStatusEmpresa (tenantId, status) {
  return request({
    url: `/admin/tenants/${tenantId}`,
    method: 'put',
    data: { status }
  })
}

export function RenovarAcessoEmpresa (tenantId, paidDays) {
  return request({
    url: `/admin/tenants/${tenantId}`,
    method: 'put',
    data: { paidDays }
  })
}
