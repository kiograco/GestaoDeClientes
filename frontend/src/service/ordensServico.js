import request from 'src/service/request'

export const ListarAtendentesServico = () => request({ url: '/service/attendants', method: 'get' })
export const CriarAtendenteServico = data => request({ url: '/service/attendants', method: 'post', data })
export const AlterarAtendenteServico = data => request({ url: `/service/attendants/${data.id}`, method: 'put', data })

export const ListarEstoqueServico = () => request({ url: '/service/inventory', method: 'get' })
export const ListarMovimentacoesEstoqueServico = () => request({ url: '/service/inventory-movements', method: 'get' })
export const CriarItemEstoqueServico = data => request({ url: '/service/inventory', method: 'post', data })
export const AlterarItemEstoqueServico = data => request({ url: `/service/inventory/${data.id}`, method: 'put', data })
export const ExcluirItemEstoqueServico = id => request({ url: `/service/inventory/${id}`, method: 'delete' })

export const ListarTiposServico = () => request({ url: '/service/types', method: 'get' })
export const CriarTipoServico = data => request({ url: '/service/types', method: 'post', data })
export const AlterarTipoServico = data => request({ url: `/service/types/${data.id}`, method: 'put', data })
export const ExcluirTipoServico = id => request({ url: `/service/types/${id}`, method: 'delete' })

export const ListarOrdensServico = params => request({ url: '/service/orders', method: 'get', params })
export const DashboardOrdensServico = params => request({ url: '/service/orders-dashboard', method: 'get', params })
export const ObterOrdemServico = id => request({ url: `/service/orders/${id}`, method: 'get' })
export const CriarOrdemServico = data => request({ url: '/service/orders', method: 'post', data })
export const AlterarOrdemServico = data => request({ url: `/service/orders/${data.id}`, method: 'put', data })
export const DocumentoOrdemServico = id => request({ url: `/service/orders/${id}/document`, method: 'get', responseType: 'blob' })
export const DocumentoInternoOrdemServico = id => request({ url: `/service/orders/${id}/document/internal`, method: 'get', responseType: 'blob' })
export const NotificarOrdemServico = (id, data) => request({ url: `/service/orders/${id}/notify`, method: 'post', data })
