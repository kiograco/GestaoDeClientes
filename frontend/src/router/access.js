const ADMIN_ROLES = ['admin']
const OPERATION_ROLES = ['admin', 'superadmin', 'supervisor', 'atendente', 'tecnico', 'user']

export const routeAccessRules = {
  login: { public: true },
  'portal-cliente-proposta': { public: true },
  'superadmin-empresas': { roles: ['superadmin'] },
  'superadmin-planos': { roles: ['superadmin'] },
  'home-dashboard': { roles: ADMIN_ROLES },
  'painel-atendimentos': { roles: ADMIN_ROLES },
  sessoes: { roles: ADMIN_ROLES },
  usuarios: { roles: ADMIN_ROLES },
  'auto-resposta': { roles: ADMIN_ROLES },
  'mensagens-rapidas': { roles: ADMIN_ROLES },
  filas: { roles: ADMIN_ROLES },
  configuracoes: { roles: ADMIN_ROLES },
  etiquetas: { roles: ADMIN_ROLES },
  campanhas: { roles: ADMIN_ROLES },
  'contatos-campanha': { roles: ADMIN_ROLES },
  horarioAtendimento: { roles: ADMIN_ROLES },
  'api-service': { roles: ADMIN_ROLES },
  'chat-flow': { roles: ADMIN_ROLES },
  'chat-flow-builder': { roles: ADMIN_ROLES },
  relatorios: { roles: ADMIN_ROLES },
  'estatisticas-atendimentos-usuarios': { roles: ADMIN_ROLES },
  'lista-contatos': { roles: ADMIN_ROLES },
  'contatos-por-etiquetas': { roles: ADMIN_ROLES },
  'contatos-por-estado': { roles: ADMIN_ROLES },
  'delivery-catalogo': { roles: ADMIN_ROLES, module: 'delivery' },
  'delivery-zonas': { roles: ADMIN_ROLES, module: 'delivery' },
  'delivery-pedidos': { roles: ADMIN_ROLES, module: 'delivery' },
  clientes: { roles: OPERATION_ROLES },
  'cadastros-operacionais': { roles: ['admin', 'supervisor'] },
  'cadastros-base': { roles: ['admin', 'supervisor'] },
  contatos: { roles: OPERATION_ROLES },
  'pipeline-vendas': { roles: OPERATION_ROLES },
  'ordens-servico': { roles: OPERATION_ROLES },
  monitoramento: { roles: OPERATION_ROLES },
  atendimento: { roles: OPERATION_ROLES },
  'chat-empty': { roles: OPERATION_ROLES },
  chat: { roles: OPERATION_ROLES },
  'chat-contatos': { roles: OPERATION_ROLES },
  'minha-assinatura': { roles: ['admin', 'supervisor', 'atendente', 'tecnico', 'user'] }
}

export const routeDisplayNames = {
  login: 'Login',
  'portal-cliente-proposta': 'Proposta',
  'superadmin-empresas': 'Empresas',
  'superadmin-planos': 'Planos',
  'home-dashboard': 'Dashboard',
  'painel-atendimentos': 'Painel de Atendimentos',
  sessoes: 'Canais',
  usuarios: 'Usuários',
  'auto-resposta': 'Auto Resposta',
  'mensagens-rapidas': 'Mensagens Rápidas',
  filas: 'Filas',
  configuracoes: 'Configurações',
  etiquetas: 'Etiquetas',
  campanhas: 'Campanhas',
  'contatos-campanha': 'Contatos da Campanha',
  horarioAtendimento: 'Horário de Atendimento',
  'api-service': 'API / Webhooks',
  'chat-flow': 'Chatbot',
  'chat-flow-builder': 'Editor do Chatbot',
  relatorios: 'Relatórios',
  'estatisticas-atendimentos-usuarios': 'Resumo de Atendimentos',
  'lista-contatos': 'Relatório de Contatos',
  'contatos-por-etiquetas': 'Contatos por Etiquetas',
  'contatos-por-estado': 'Contatos por Estado',
  'delivery-catalogo': 'Cardápio',
  'delivery-zonas': 'Áreas de Entrega',
  'delivery-pedidos': 'Pedidos',
  clientes: 'Clientes',
  'cadastros-operacionais': 'Cadastros Operacionais',
  'cadastros-base': 'Cadastros Base',
  contatos: 'Contatos',
  'pipeline-vendas': 'Pipeline de Vendas',
  'ordens-servico': 'Ordens de Serviço',
  monitoramento: 'Monitoramento',
  atendimento: 'Atendimentos',
  'chat-empty': 'Atendimentos',
  chat: 'Conversa',
  'chat-contatos': 'Contatos',
  'minha-assinatura': 'Minha Assinatura'
}

export const defaultRouteByProfile = profile => {
  if (profile === 'superadmin') return { name: 'superadmin-empresas' }
  if (profile === 'admin') return { name: 'home-dashboard' }
  return { name: 'atendimento' }
}

export const canAccessRoute = (routeName, profile, enabledModules = {}) => {
  if (!routeName) return true
  const rule = routeAccessRules[routeName]
  if (!rule) return true
  if (rule.public) return true
  if (!profile) return false
  if (rule.module && !enabledModules?.[rule.module]) return false
  if (rule.roles && !rule.roles.includes(profile)) return false
  return true
}
