import request from 'src/service/request'

export const ListarCategoriasDelivery = () => request({ url: '/delivery/categories', method: 'get' })
export const CriarCategoriaDelivery = data => request({ url: '/delivery/categories', method: 'post', data })
export const AlterarCategoriaDelivery = data => request({ url: `/delivery/categories/${data.id}`, method: 'put', data })
export const ExcluirCategoriaDelivery = id => request({ url: `/delivery/categories/${id}`, method: 'delete' })
export const ListarProdutosDelivery = () => request({ url: '/delivery/products', method: 'get' })
export const CriarProdutoDelivery = data => request({ url: '/delivery/products', method: 'post', data })
export const AlterarProdutoDelivery = data => request({ url: `/delivery/products/${data.id}`, method: 'put', data })
export const ExcluirProdutoDelivery = id => request({ url: `/delivery/products/${id}`, method: 'delete' })
export const ListarZonasDelivery = () => request({ url: '/delivery/zones', method: 'get' })
export const CriarZonaDelivery = data => request({ url: '/delivery/zones', method: 'post', data })
export const AlterarZonaDelivery = data => request({ url: `/delivery/zones/${data.id}`, method: 'put', data })
export const ExcluirZonaDelivery = id => request({ url: `/delivery/zones/${id}`, method: 'delete' })
export const ListarPedidosDelivery = params => request({ url: '/delivery/orders', method: 'get', params })
export const AlterarStatusPedidoDelivery = (id, status) => request({
  url: `/delivery/orders/${id}/status`,
  method: 'put',
  data: { status }
})
export const CriarPedidoDelivery = data => request({ url: '/delivery/orders', method: 'post', data })
export const ListarEnderecosDelivery = contactId => request({
  url: `/delivery/contacts/${contactId}/addresses`,
  method: 'get'
})
export const CriarEnderecoDelivery = data => request({ url: '/delivery/addresses', method: 'post', data })
export const AlterarEnderecoDelivery = data => request({ url: `/delivery/addresses/${data.id}`, method: 'put', data })
export const ExcluirEnderecoDelivery = id => request({ url: `/delivery/addresses/${id}`, method: 'delete' })
export const ResolverZonaDelivery = params => request({ url: '/delivery/zones/resolve', method: 'get', params })
export const CriarPagamentoPedidoDelivery = (orderId, data) => request({
  url: `/delivery/orders/${orderId}/payments`,
  method: 'post',
  data
})
export const AlterarStatusPagamentoPedidoDelivery = (paymentId, status) => request({
  url: `/delivery/order-payments/${paymentId}/status`,
  method: 'put',
  data: { status }
})
