import request from 'src/service/request'

export const ListarClientes = params => request({ url: '/sales/customers', method: 'get', params })
export const ObterCliente = contactId => request({ url: `/sales/customers/${contactId}`, method: 'get' })
export const CriarCliente = data => request({ url: '/sales/customers', method: 'post', data })
export const AlterarCliente = data => request({ url: `/sales/customers/${data.id}`, method: 'put', data })
export const ConsultarCep = zipCode => request({ url: `/sales/address/cep/${zipCode}`, method: 'get' })
