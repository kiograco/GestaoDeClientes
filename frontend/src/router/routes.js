
import { defaultRouteByProfile } from './access'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    redirect: () => defaultRouteByProfile(localStorage.getItem('profile')),
    children: [
      { path: '', component: () => import('pages/contatos/Index.vue') },
      { path: '/home', name: 'home-dashboard', component: () => import('pages/dashboard/Index.vue') },
      { path: '/painel-atendimentos', name: 'painel-atendimentos', component: () => import('pages/dashboard/DashTicketsFilas.vue') },
      // { path: '/ConsultarTicketsQueuesService', name: 'dashboard', component: () => import('pages/dashboard/Index.vue') },
      { path: '/sessoes', name: 'sessoes', component: () => import('pages/sessaoWhatsapp/Index.vue') },
      { path: '/contatos', name: 'contatos', component: () => import('pages/contatos/Index.vue') },
      { path: '/clientes', name: 'clientes', component: () => import('pages/clientes/Index.vue') },
      { path: '/pipeline-vendas', name: 'pipeline-vendas', component: () => import('pages/pipelineVendas/Index.vue') },
      { path: '/ordens-servico', name: 'ordens-servico', component: () => import('pages/ordensServico/Index.vue') },
      { path: '/monitoramento', name: 'monitoramento', component: () => import('pages/monitoramento/Index.vue') },
      { path: '/usuarios', name: 'usuarios', component: () => import('pages/usuarios/Index.vue') },
      { path: '/auto-resposta', name: 'auto-resposta', component: () => import('pages/fluxoAutoResposta/Index.vue') },
      { path: '/mensagens-rapidas', name: 'mensagens-rapidas', component: () => import('pages/mensagensRapidas/Index.vue') },
      { path: '/filas', name: 'filas', component: () => import('pages/filas/Index.vue') },
      { path: '/configuracoes', name: 'configuracoes', component: () => import('pages/configuracoes/Index.vue') },
      { path: '/etiquetas', name: 'etiquetas', component: () => import('pages/etiquetas/Index.vue') },
      { path: '/delivery/catalogo', name: 'delivery-catalogo', component: () => import('pages/delivery/Catalogo.vue') },
      { path: '/delivery/areas-entrega', name: 'delivery-zonas', component: () => import('pages/delivery/ZonasEntrega.vue') },
      { path: '/delivery/pedidos', name: 'delivery-pedidos', component: () => import('pages/delivery/Pedidos.vue') },
      { path: '/campanhas', name: 'campanhas', component: () => import('pages/campanhas/Index.vue') },
      { path: '/campanhas/:campanhaId', name: 'contatos-campanha', component: () => import('pages/campanhas/ContatosCampanha.vue') },
      { path: '/horario-atendimento', name: 'horarioAtendimento', component: () => import('pages/horarioAtendimento/Index.vue') },
      { path: '/api-service', name: 'api-service', component: () => import('pages/api/Index.vue') },
      {
        path: '/chat-flow',
        component: () => import('pages/chatFlow/Index.vue'),
        redirect: 'chat-flow',
        children: [
          { path: '', name: 'chat-flow', component: () => import('pages/chatFlow/ListaChatFlow.vue') },
          { path: 'builder', name: 'chat-flow-builder', component: () => import('components/ccFlowBuilder/panel.vue') }
        ]
      }
    ]
  },
  {
    path: '/relatorios',
    redirect: 'relatorios',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'relatorios',
        component: () => import('pages/relatorios/ccListaRelatorios')
      },
      {
        path: 'estatisticas-atendimentos-usuarios',
        name: 'estatisticas-atendimentos-usuarios',
        component: () => import('pages/relatorios/RelatorioResumoAtendimentosUsuarios')
      },
      {
        path: 'lista-contatos',
        name: 'lista-contatos',
        component: () => import('pages/relatorios/RelatorioContatosGeral')
      },
      {
        path: 'contatos-por-etiquetas',
        name: 'contatos-por-etiquetas',
        component: () => import('pages/relatorios/RelatorioContatosEtiquetas')
      },
      {
        path: 'contatos-por-estado',
        name: 'contatos-por-estado',
        component: () => import('pages/relatorios/RelatorioContatosEstado')
      }
    ]
  },
  {
    path: '/atendimento',
    name: 'atendimento',
    // redirect: { name: 'chat-empty' },
    component: () => import('pages/atendimento/Index.vue'),
    children: [
      {
        path: '/chats/',
        name: 'chat-empty',
        component: () => import('pages/atendimento/Chat.vue')
      },
      {
        path: ':ticketId',
        name: 'chat',
        component: () => import('pages/atendimento/Chat.vue')
        // beforeEnter (to, from, next) {
        //   if (!from.params.ticketId) {
        //     next({ name: 'chat-empty' })
        //   }
        //   next()
        // }
      },
      {
        path: 'contatos',
        name: 'chat-contatos',
        component: () => import('pages/contatos/Index.vue'),
        props: { isChatContact: true }
      }

    ]
  },
  {
    path: '/superadmin/empresas',
    name: 'superadmin-empresas',
    component: () => import('pages/superadmin/Empresas.vue')
  },
  {
    path: '/superadmin/planos',
    name: 'superadmin-planos',
    component: () => import('pages/superadmin/Planos.vue')
  },
  {
    path: '/assinatura',
    name: 'minha-assinatura',
    component: () => import('pages/assinatura/MinhaAssinatura.vue')
  },
  {
    path: '/portal/proposta/:token',
    name: 'portal-cliente-proposta',
    component: () => import('pages/portalCliente/Proposta.vue')
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/Login.vue')
  }
]

export default routes
