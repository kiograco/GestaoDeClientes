import request from 'src/service/request'

export const ListarCadastroBase = (module, params) => request({ url: `/base-registers/${module}`, method: 'get', params })
export const ExportarCadastroBase = (module, params) => request({ url: `/base-registers/${module}/export`, method: 'get', params, responseType: 'blob' })
export const CriarCadastroBase = (module, data) => request({ url: `/base-registers/${module}`, method: 'post', data })
export const AlterarCadastroBase = (module, data) => request({ url: `/base-registers/${module}/${data.id}`, method: 'put', data })
export const ExcluirCadastroBase = (module, id) => request({ url: `/base-registers/${module}/${id}`, method: 'delete' })

export const ListarUnidadesCliente = params => request({ url: '/base-registers/client-units', method: 'get', params })
export const ExportarUnidadesCliente = params => request({ url: '/base-registers/client-units/export', method: 'get', params, responseType: 'blob' })
export const CriarUnidadeCliente = data => request({ url: '/base-registers/client-units', method: 'post', data })
export const AlterarUnidadeCliente = data => request({ url: `/base-registers/client-units/${data.id}`, method: 'put', data })
export const ExcluirUnidadeCliente = id => request({ url: `/base-registers/client-units/${id}`, method: 'delete' })
export const ListarAuditoriaCadastrosBase = params => request({ url: '/base-registers/audit', method: 'get', params })
