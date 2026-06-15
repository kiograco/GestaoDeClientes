import request from 'src/service/request'

export const ListarClientes = params => request({ url: '/clients', method: 'get', params })
export const ObterCliente = clientId => request({ url: `/clients/${clientId}`, method: 'get' })
export const CriarCliente = data => request({ url: '/clients', method: 'post', data })
export const AlterarCliente = data => request({ url: `/clients/${data.id}`, method: 'put', data })
export const ExcluirCliente = clientId => request({ url: `/clients/${clientId}`, method: 'delete' })
export const ConsultarCep = zipCode => request({ url: `/sales/address/cep/${zipCode}`, method: 'get' })
export const ConsultarCnpj = cnpj => request({ url: `/clients/cnpj/${cnpj}`, method: 'get' })
