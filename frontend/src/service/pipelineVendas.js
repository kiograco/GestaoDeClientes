import request from 'src/service/request'

export const ListarOportunidades = params => request({ url: '/sales/pipeline', method: 'get', params })
export const DashboardPipeline = () => request({ url: '/sales/pipeline-dashboard', method: 'get' })
export const ObterOportunidade = id => request({ url: `/sales/pipeline/${id}`, method: 'get' })
export const CriarOportunidade = data => request({ url: '/sales/pipeline', method: 'post', data })
export const AlterarOportunidade = data => request({ url: `/sales/pipeline/${data.id}`, method: 'put', data })
export const ConverterOportunidadeOrdemServico = (id, data) => request({ url: `/sales/pipeline/${id}/convert-service-order`, method: 'post', data })
