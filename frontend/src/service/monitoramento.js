import request from 'src/service/request'

export const ListarTiposArmadilha = () => request({ url: '/monitoring/trap-types', method: 'get' })
export const CriarTipoArmadilha = data => request({ url: '/monitoring/trap-types', method: 'post', data })
export const AlterarTipoArmadilha = data => request({ url: `/monitoring/trap-types/${data.id}`, method: 'put', data })
export const ExcluirTipoArmadilha = id => request({ url: `/monitoring/trap-types/${id}`, method: 'delete' })

export const ListarPontosMonitoramento = params => request({ url: '/monitoring/points', method: 'get', params })
export const CriarPontosMonitoramento = data => request({ url: '/monitoring/points', method: 'post', data })
export const AlterarPontoMonitoramento = data => request({ url: `/monitoring/points/${data.id}`, method: 'put', data })
export const ExcluirPontoMonitoramento = id => request({ url: `/monitoring/points/${id}`, method: 'delete' })
export const ListarPlantasCliente = params => request({ url: '/monitoring/floor-plans', method: 'get', params })
export const CriarPlantaCliente = data => request({ url: '/monitoring/floor-plans', method: 'post', data })
export const AlterarPlantaCliente = data => request({ url: `/monitoring/floor-plans/${data.id}`, method: 'put', data })
export const ExcluirPlantaCliente = id => request({ url: `/monitoring/floor-plans/${id}`, method: 'delete' })
export const PosicionarPontoMonitoramento = (id, data) => request({ url: `/monitoring/points/${id}/position`, method: 'put', data })
