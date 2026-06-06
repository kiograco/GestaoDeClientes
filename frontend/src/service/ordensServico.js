import request from 'src/service/request'

export const ListarAtendentesServico = () => request({ url: '/service/attendants', method: 'get' })
export const CriarAtendenteServico = data => request({ url: '/service/attendants', method: 'post', data })
export const AlterarAtendenteServico = data => request({ url: `/service/attendants/${data.id}`, method: 'put', data })

export const ListarOrdensServico = params => request({ url: '/service/orders', method: 'get', params })
export const DashboardOrdensServico = params => request({ url: '/service/orders-dashboard', method: 'get', params })
export const ObterOrdemServico = id => request({ url: `/service/orders/${id}`, method: 'get' })
export const CriarOrdemServico = data => request({ url: '/service/orders', method: 'post', data })
export const AlterarOrdemServico = data => request({ url: `/service/orders/${data.id}`, method: 'put', data })
export const DocumentoOrdemServico = id => request({ url: `/service/orders/${id}/document`, method: 'get', responseType: 'blob' })
export const DocumentoInternoOrdemServico = id => request({ url: `/service/orders/${id}/document/internal`, method: 'get', responseType: 'blob' })
export const NotificarOrdemServico = (id, data) => request({ url: `/service/orders/${id}/notify`, method: 'post', data })
