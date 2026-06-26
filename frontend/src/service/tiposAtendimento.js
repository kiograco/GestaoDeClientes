import request from 'src/service/request'

export const ListarTiposAtendimento = params => request({ url: '/attendance-types', method: 'get', params })
export const ObterTipoAtendimento = id => request({ url: `/attendance-types/${id}`, method: 'get' })
export const CriarTipoAtendimento = data => request({ url: '/attendance-types', method: 'post', data })
export const AlterarTipoAtendimento = data => request({ url: `/attendance-types/${data.id}`, method: 'put', data })
export const AtivarTipoAtendimento = (id, isActive) => request({ url: `/attendance-types/${id}/active`, method: 'patch', data: { isActive } })
export const ExcluirTipoAtendimento = id => request({ url: `/attendance-types/${id}`, method: 'delete' })
export const ExportarTiposAtendimento = params => request({ url: '/attendance-types/export', method: 'get', params, responseType: 'blob' })
