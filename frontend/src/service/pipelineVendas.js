import request from 'src/service/request'

export const ListarOportunidades = params => request({ url: '/sales/pipeline', method: 'get', params })
export const DashboardPipeline = () => request({ url: '/sales/pipeline-dashboard', method: 'get' })
export const ObterOportunidade = id => request({ url: `/sales/pipeline/${id}`, method: 'get' })
export const CriarOportunidade = data => request({ url: '/sales/pipeline', method: 'post', data })
export const AlterarOportunidade = data => request({ url: `/sales/pipeline/${data.id}`, method: 'put', data })
export const ConverterOportunidadeOrdemServico = (id, data) => request({ url: `/sales/pipeline/${id}/convert-service-order`, method: 'post', data })
export const ListarPropostas = opportunityId => request({ url: `/sales/pipeline/${opportunityId}/proposals`, method: 'get' })
export const CriarProposta = (opportunityId, data) => request({ url: `/sales/pipeline/${opportunityId}/proposals`, method: 'post', data })
export const AlterarProposta = data => request({ url: `/sales/proposals/${data.id}`, method: 'put', data })
export const DocumentoProposta = id => request({ url: `/sales/proposals/${id}/document`, method: 'get', responseType: 'blob' })
export const ConverterPropostaOrdemServico = (id, data) => request({ url: `/sales/proposals/${id}/convert-service-order`, method: 'post', data })
