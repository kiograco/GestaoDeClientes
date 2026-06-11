import request from 'src/service/request'

export const ObterPropostaPortal = token => request({ url: `/portal/proposals/${token}`, method: 'get' })
export const AprovarPropostaPortal = token => request({ url: `/portal/proposals/${token}/approve`, method: 'post' })
export const DocumentoPropostaPortal = token => request({ url: `/portal/proposals/${token}/document`, method: 'get', responseType: 'blob' })
export const ObterOrdemServicoPortal = token => request({ url: `/portal/proposals/${token}/service-order`, method: 'get' })
