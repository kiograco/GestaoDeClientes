<template>
  <q-layout view="hHh Lpr lFf">

    <q-header
      class="app-shell-header q-py-sm"
      height-hint="58"
      bordered
    >
      <q-toolbar class="q-px-md">
        <q-btn
          flat
          dense
          unelevated
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
          class="app-icon-btn"
        >
          <q-tooltip>Menu</q-tooltip>
        </q-btn>

        <q-btn
          flat
          no-caps
          no-wrap
          dense
          class="q-ml-sm"
          v-if="$q.screen.gt.xs"
        >
          <q-img
            :src="tenantLogoUrl"
            spinner-color="primary"
            contain
            style="height: 40px; width: 172px"
          />
        </q-btn>

        <q-breadcrumbs
          v-if="$q.screen.gt.sm"
          class="app-breadcrumbs q-ml-md"
          active-color="primary"
        >
          <q-breadcrumbs-el
            icon="mdi-home-outline"
            :to="{ name: userProfile === 'superadmin' ? 'superadmin-empresas' : userProfile === 'admin' ? 'home-dashboard' : 'atendimento' }"
          />
          <q-breadcrumbs-el :label="currentRouteTitle" />
        </q-breadcrumbs>

        <q-input
          v-if="$q.screen.gt.sm"
          v-model="globalSearch"
          dense
          outlined
          borderless
          clearable
          class="app-search q-ml-lg"
          placeholder="Buscar contatos, tickets, campanhas..."
          @focus="commandPaletteOpen = true"
          @keyup.enter="executarBuscaGlobal"
        >
          <template v-slot:prepend>
            <q-icon name="mdi-magnify" />
          </template>
          <template v-slot:append>
            <span class="text-caption text-grey-6">Enter</span>
          </template>
        </q-input>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn-dropdown
            v-if="$q.screen.gt.xs"
            unelevated
            no-caps
            color="primary"
            icon="mdi-plus"
            label="Criar"
          >
            <q-list style="min-width: 220px">
              <q-item clickable v-close-popup @click="$router.push({ name: 'atendimento' })">
                <q-item-section avatar><q-icon name="mdi-forum-plus-outline" /></q-item-section>
                <q-item-section>Novo atendimento</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="$router.push({ name: 'contatos' })">
                <q-item-section avatar><q-icon name="mdi-account-plus-outline" /></q-item-section>
                <q-item-section>Novo contato</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="$router.push({ name: 'campanhas' })">
                <q-item-section avatar><q-icon name="mdi-message-bookmark-outline" /></q-item-section>
                <q-item-section>Nova campanha</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="$router.push({ name: 'pipeline-vendas' })">
                <q-item-section avatar><q-icon name="mdi-chart-timeline-variant" /></q-item-section>
                <q-item-section>Nova oportunidade</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            v-if="userProfile === 'admin'"
            dense
            flat
            unelevated
            class="app-icon-btn"
            icon="mdi-clipboard-check-outline"
            @click="onboardingOpen = true"
          >
            <q-tooltip>Configuração inicial</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            unelevated
            class="app-icon-btn"
            :icon="$q.dark.isActive ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
            @click="$setConfigsUsuario({ isDark: !$q.dark.isActive })"
          >
            <q-tooltip>
              {{ $q.dark.isActive ? 'Desativar' : 'Ativar' }} modo escuro
            </q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            unelevated
            class="app-icon-btn"
            icon="notifications"
          >
            <q-badge
              color="red"
              text-color="white"
              floating
              v-if="(parseInt(notifications.count) + parseInt(notifications_p.count)) > 0"
            >
              {{ parseInt(notifications.count) + parseInt(notifications_p.count) }}
            </q-badge>
            <q-menu>
              <q-list style="min-width: 300px">
                <q-item v-if="notificationPermission !== 'granted'">
                  <q-item-section>
                    <q-item-label>Notificações do navegador desativadas</q-item-label>
                    <q-item-label caption>Ative para receber alertas de novas mensagens.</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      dense
                      flat
                      no-caps
                      color="primary"
                      label="Ativar"
                      @click="notificationPromptOpen = true"
                    />
                  </q-item-section>
                </q-item>
                <q-separator v-if="notificationPermission !== 'granted'" />
                <q-item v-if="(parseInt(notifications.count) + parseInt(notifications_p.count)) == 0">
                  <q-item-section style="cursor: pointer;">
                    Nada de novo por aqui!
                  </q-item-section>
                </q-item>
                <q-item v-if="parseInt(notifications_p.count) > 0">
                  <q-item-section
                    avatar
                    @click="() => $router.push({ name: 'atendimento' })"
                    style="cursor: pointer;"
                  >
                    <q-avatar
                      style="width: 60px; height: 60px"
                      color="blue"
                      text-color="white"
                    >
                      {{ notifications_p.count }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section
                    @click="() => $router.push({ name: 'atendimento' })"
                    style="cursor: pointer;"
                  >
                    Clientes pendentes na fila
                  </q-item-section>
                </q-item>
                <q-item
                  v-for="ticket in notifications.tickets"
                  :key="ticket.id"
                  style="border-bottom: 1px solid #ddd; margin: 5px;"
                >
                  <q-item-section
                    avatar
                    @click="abrirAtendimentoExistente(ticket.name, ticket)"
                    style="cursor: pointer;"
                  >
                    <q-avatar style="width: 60px; height: 60px">
                      <img :src="ticket.profilePicUrl">
                    </q-avatar>
                  </q-item-section>
                  <q-item-section
                    @click="abrirAtendimentoExistente(ticket.name, ticket)"
                    style="cursor: pointer;"
                  >
                    <q-list>
                      <q-item style="text-align:center; font-size: 17px; font-weight: bold; min-height: 0">{{ ticket.name
                      }}</q-item>
                      <q-item style="min-height: 0; padding-top: 0"><b>Mensagem: </b> {{ ticket.lastMessage }}</q-item>
                    </q-list>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <q-tooltip>Notificações</q-tooltip>
          </q-btn>
          <q-avatar
            :color="usuario.status === 'offline' ? 'negative' : 'positive'"
            text-color="white"
            size="28px"
            :icon="usuario.status === 'offline' ? 'mdi-account-off' : 'mdi-account-check'"
            rounded
            class="q-ml-lg"
          >
            <q-tooltip>
              {{ usuario.status === 'offline' ? 'Usuário Offiline' : 'Usuário Online' }}
            </q-tooltip>
          </q-avatar>
          <q-btn
            flat
            no-caps
            class="app-user-button q-ml-sm q-px-sm"
          >
            <span
              v-if="$q.screen.gt.sm"
            >
              {{ username }}
            </span>
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item-label header> Olá! <b> {{ username }} </b> </q-item-label>

                <cStatusUsuario
                  @update:usuario="atualizarUsuario"
                  :usuario="usuario"
                />
                <q-item
                  clickable
                  v-close-popup
                  @click="abrirModalUsuario"
                >
                  <q-item-section>Perfil</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="efetuarLogout"
                >
                  <q-item-section>Sair</q-item-section>
                </q-item>
                <q-separator />
                <q-item>
                  <q-item-section>
                    <cSystemVersion />
                  </q-item-section>
                </q-item>

              </q-list>
            </q-menu>

            <q-tooltip>Usuário</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
      <q-banner
        v-if="accessDaysRemaining !== null && userProfile !== 'superadmin'"
        dense
        :class="accessDaysRemaining <= 5 ? 'bg-orange-2 text-orange-10' : 'bg-blue-1 text-blue-10'"
      >
        Sua empresa possui {{ accessDaysRemaining }}
        {{ accessDaysRemaining === 1 ? 'dia' : 'dias' }} de acesso liberado.
      </q-banner>
    </q-header>

    <q-drawer
      ref="sidebarDrawer"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :mini="sidebarCollapsed"
      :width="292"
      :mini-width="72"
      mini-to-overlay
      content-class="app-sidebar"
      @mouseenter="sidebarCollapsed = false"
    >
      <SidebarMenu
        :menu="menuData"
        :profile="userProfile"
        :collapsed.sync="sidebarCollapsed"
      />
    </q-drawer>

    <q-page-container>
      <q-page>
        <router-view />
      </q-page>
    </q-page-container>
    <audio ref="audioNotification">
      <source
        :src="alertSound"
        type="audio/mp3"
      >
    </audio>
    <ModalUsuario
      :isProfile="true"
      :modalUsuario.sync="modalUsuario"
      :usuarioEdicao.sync="usuario"
    />
    <OnboardingAdmin
      v-if="userProfile === 'admin'"
      v-model="onboardingOpen"
      :usuario="usuario"
    />
    <q-dialog v-model="notificationPromptOpen">
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Receba avisos de novas mensagens</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            Ative as notificações para receber alertas no navegador quando houver um novo atendimento ou mensagem.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Agora não"
            color="grey-7"
            @click="dispensarAtivacaoNotificacoes"
          />
          <q-btn
            unelevated
            label="Ativar notificações"
            color="primary"
            @click="ativarNotificacoes"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="commandPaletteOpen">
      <q-card class="command-palette app-card">
        <q-card-section class="q-pb-sm">
          <q-input
            v-model="globalSearch"
            autofocus
            borderless
            placeholder="Buscar ou executar uma acao..."
            @keyup.enter="executarBuscaGlobal"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-magnify" />
            </template>
          </q-input>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-sm">
          <q-list>
            <q-item-label header>Acoes rapidas</q-item-label>
            <q-item clickable v-close-popup @click="$router.push({ name: 'atendimento' })">
              <q-item-section avatar><q-icon name="mdi-forum-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>Abrir atendimentos</q-item-label>
                <q-item-label caption>Conversas, tickets e filas</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$router.push({ name: 'contatos' })">
              <q-item-section avatar><q-icon name="mdi-account-multiple-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>Buscar contatos</q-item-label>
                <q-item-label caption>Clientes, telefones e canais</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$router.push({ name: 'clientes' })">
              <q-item-section avatar><q-icon name="mdi-account-cash-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>Central de clientes</q-item-label>
                <q-item-label caption>Dados comerciais e endereco</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$router.push({ name: 'pipeline-vendas' })">
              <q-item-section avatar><q-icon name="mdi-chart-timeline-variant" /></q-item-section>
              <q-item-section>
                <q-item-label>Pipeline de vendas</q-item-label>
                <q-item-label caption>Funil, oportunidades e conversao em OS</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$router.push({ name: 'campanhas' })">
              <q-item-section avatar><q-icon name="mdi-message-bookmark-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>Campanhas</q-item-label>
                <q-item-label caption>Disparos, contatos e performance</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="executarBuscaGlobal">
              <q-item-section avatar><q-icon name="mdi-text-search" /></q-item-section>
              <q-item-section>
                <q-item-label>Pesquisar "{{ globalSearch || 'termo' }}"</q-item-label>
                <q-item-label caption>Envia a busca para contatos</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import cSystemVersion from '../components/cSystemVersion.vue'
import { ListarWhatsapps } from 'src/service/sessoesWhatsapp'
import SidebarMenu from 'components/sidebar/SidebarMenu.vue'
import socketInitial from './socketInitial'
import alertSound from 'src/assets/sound.mp3'
import { format } from 'date-fns'
const username = localStorage.getItem('username')
import ModalUsuario from 'src/pages/usuarios/ModalUsuario'
import { mapGetters } from 'vuex'
import { ListarConfiguracoes } from 'src/service/configuracoes'
import { RealizarLogout } from 'src/service/login'
import cStatusUsuario from '../components/cStatusUsuario.vue'
import { socketIO } from 'src/utils/socket'
import { ConsultarTickets } from 'src/service/tickets'
import OnboardingAdmin from 'src/components/OnboardingAdmin'
import { resolveTenantLogoUrl } from 'src/utils/tenantLogo'
import { clearAccessToken } from 'src/utils/authToken'
import { canAccessRoute, routeDisplayNames } from 'src/router/access'

const socket = socketIO()

const objMenu = [
  {
    title: 'Minha assinatura',
    caption: 'Plano e pagamentos',
    icon: 'mdi-credit-card-outline',
    routeName: 'minha-assinatura'
  },
  {
    title: 'Dashboard',
    caption: '',
    icon: 'mdi-home',
    routeName: 'home-dashboard'
  },

  {
    title: 'Atendimentos',
    caption: 'Lista de atendimentos',
    icon: 'mdi-forum-outline',
    routeName: 'atendimento'
  },
  {
    title: 'Contatos',
    caption: 'Lista de contatos',
    icon: 'mdi-card-account-mail',
    routeName: 'contatos'
  },
  {
    title: 'Clientes',
    caption: 'Cadastro comercial',
    icon: 'mdi-account-cash-outline',
    routeName: 'clientes'
  },
  {
    title: 'Pipeline',
    caption: 'Funil comercial',
    icon: 'mdi-chart-timeline-variant',
    routeName: 'pipeline-vendas'
  },
  {
    title: 'Ordens de Serviço',
    caption: 'Agenda e técnicos',
    icon: 'mdi-calendar-check-outline',
    routeName: 'ordens-servico'
  },
  {
    title: 'Monitoramento',
    caption: 'Armadilhas e pontos',
    icon: 'mdi-map-marker-radius-outline',
    routeName: 'monitoramento'
  }
]

const objMenuGroups = [
  {
    title: 'Conta',
    routes: ['minha-assinatura']
  },
  {
    title: 'CRM',
    routes: ['home-dashboard', 'clientes', 'contatos', 'pipeline-vendas']
  },
  {
    title: 'Atendimento',
    routes: ['atendimento', 'ordens-servico', 'monitoramento']
  }
].map(group => ({
  title: group.title,
  items: group.routes.map(routeName => objMenu.find(item => item.routeName === routeName)).filter(Boolean)
}))

const objMenuAdmin = [
  {
    title: 'Canais',
    caption: 'Canais de Comunicação',
    icon: 'mdi-cellphone-wireless',
    routeName: 'sessoes'
  },
  {
    title: 'Painel Atendimentos',
    caption: 'Visão geral dos atendimentos',
    icon: 'mdi-view-dashboard-variant',
    routeName: 'painel-atendimentos'
  },
  {
    title: 'Relatórios',
    caption: 'Relatórios gerais',
    icon: 'mdi-file-chart',
    routeName: 'relatorios'
  },
  {
    title: 'Usuários',
    caption: 'Admin de usuários',
    icon: 'mdi-account-group',
    routeName: 'usuarios'
  },
  {
    title: 'Filas',
    caption: 'Cadastro de Filas',
    icon: 'mdi-arrow-decision-outline',
    routeName: 'filas'
  },
  {
    title: 'Mensagens Rápidas',
    caption: 'Mensagens pré-definidas',
    icon: 'mdi-reply-all-outline',
    routeName: 'mensagens-rapidas'
  },
  {
    title: 'Chatbot',
    caption: 'Robô de atendimento',
    icon: 'mdi-robot',
    routeName: 'chat-flow'
  },
  {
    title: 'Etiquetas',
    caption: 'Cadastro de etiquetas',
    icon: 'mdi-tag-text',
    routeName: 'etiquetas'
  },
  {
    title: 'Cardápio',
    caption: 'Produtos e categorias',
    icon: 'mdi-silverware-fork-knife',
    routeName: 'delivery-catalogo',
    requiredModule: 'delivery'
  },
  {
    title: 'Pedidos',
    caption: 'Painel operacional',
    icon: 'mdi-clipboard-list-outline',
    routeName: 'delivery-pedidos',
    requiredModule: 'delivery'
  },
  {
    title: 'Áreas de entrega',
    caption: 'Taxas e prazos',
    icon: 'mdi-map-marker-radius',
    routeName: 'delivery-zonas',
    requiredModule: 'delivery'
  },
  {
    title: 'Horário de Atendimento',
    caption: 'Horário de funcionamento',
    icon: 'mdi-calendar-clock',
    routeName: 'horarioAtendimento'
  },
  {
    title: 'Configurações',
    caption: 'Configurações gerais',
    icon: 'mdi-cog',
    routeName: 'configuracoes'
  },
  {
    title: 'Campanha',
    caption: 'Campanhas de envio',
    icon: 'mdi-message-bookmark-outline',
    routeName: 'campanhas'
  },
  {
    title: 'API',
    caption: 'Integração sistemas externos',
    icon: 'mdi-call-split',
    routeName: 'api-service'
  }
]

const objMenuAdminGroups = [
  {
    title: 'Atendimento',
    routes: ['sessoes', 'painel-atendimentos', 'filas', 'horarioAtendimento']
  },
  {
    title: 'Marketing',
    routes: ['mensagens-rapidas', 'chat-flow', 'campanhas']
  },
  {
    title: 'Delivery',
    routes: ['delivery-catalogo', 'delivery-pedidos', 'delivery-zonas']
  },
  {
    title: 'Relatórios',
    routes: ['relatorios']
  },
  {
    title: 'Configurações',
    routes: ['usuarios', 'etiquetas', 'configuracoes', 'api-service']
  }
].map(group => ({
  title: group.title,
  items: group.routes.map(routeName => objMenuAdmin.find(item => item.routeName === routeName)).filter(Boolean)
}))

const menuCatalog = [
  { group: 'Visao Geral', title: 'Dashboard', icon: 'mdi-home', routeName: 'home-dashboard', roles: ['admin'] },
  { group: 'Visao Geral', title: 'Painel de Atendimentos', icon: 'mdi-view-dashboard-variant', routeName: 'painel-atendimentos', roles: ['admin'] },
  { group: 'Visao Geral', title: 'Relatórios', icon: 'mdi-file-chart', routeName: 'relatorios', roles: ['admin'] },
  { group: 'Atendimento', title: 'Atendimentos', icon: 'mdi-forum-outline', routeName: 'atendimento' },
  { group: 'Atendimento', title: 'Canais', icon: 'mdi-cellphone-wireless', routeName: 'sessoes', roles: ['admin'] },
  { group: 'Atendimento', title: 'Filas', icon: 'mdi-arrow-decision-outline', routeName: 'filas', roles: ['admin'] },
  { group: 'Atendimento', title: 'Horario de Atendimento', icon: 'mdi-calendar-clock', routeName: 'horarioAtendimento', roles: ['admin'] },
  { group: 'Atendimento', title: 'Mensagens Rapidas', icon: 'mdi-reply-all-outline', routeName: 'mensagens-rapidas', roles: ['admin'] },
  { group: 'CRM e Vendas', title: 'Clientes', icon: 'mdi-account-cash-outline', routeName: 'clientes' },
  { group: 'CRM e Vendas', title: 'Contatos', icon: 'mdi-card-account-mail', routeName: 'contatos' },
  { group: 'CRM e Vendas', title: 'Pipeline', icon: 'mdi-chart-timeline-variant', routeName: 'pipeline-vendas' },
  { group: 'CRM e Vendas', title: 'Propostas', icon: 'mdi-file-sign', routeName: 'pipeline-vendas', query: { view: 'propostas' }, disabled: true },
  { group: 'CRM e Vendas', title: 'Contratos', icon: 'mdi-file-document-edit-outline', routeName: 'pipeline-vendas', query: { view: 'contratos' }, disabled: true },
  { group: 'Serviços Técnicos', title: 'Ordens de Serviço', icon: 'mdi-calendar-check-outline', routeName: 'ordens-servico', query: { aba: 'agenda' } },
  { group: 'Serviços Técnicos', title: 'Serviços', icon: 'mdi-format-list-bulleted-type', routeName: 'ordens-servico', query: { aba: 'tipos' }, roles: ['admin', 'supervisor'] },
  { group: 'Serviços Técnicos', title: 'Produtos', icon: 'mdi-package-variant-closed', routeName: 'ordens-servico', query: { aba: 'estoque' }, roles: ['admin', 'supervisor'] },
  { group: 'Serviços Técnicos', title: 'Estoque', icon: 'mdi-warehouse', routeName: 'ordens-servico', query: { aba: 'estoque' }, roles: ['admin', 'supervisor'] },
  { group: 'Serviços Técnicos', title: 'Pragas', icon: 'mdi-bug-outline', routeName: 'ordens-servico', query: { aba: 'pragas' } },
  { group: 'Serviços Técnicos', title: 'Monitoramento', icon: 'mdi-map-marker-radius-outline', routeName: 'monitoramento' },
  { group: 'Serviços Técnicos', title: 'Armadilhas', icon: 'mdi-crosshairs-gps', routeName: 'monitoramento', query: { aba: 'armadilhas' } },
  { group: 'Serviços Técnicos', title: 'Auditoria Técnica', icon: 'mdi-shield-search', routeName: 'ordens-servico', query: { aba: 'auditoria' }, roles: ['admin', 'supervisor'] },
  { group: 'Financeiro', title: 'Visao Financeira', icon: 'mdi-chart-box-outline', routeName: 'ordens-servico', query: { aba: 'financeiro' }, roles: ['admin', 'supervisor'] },
  { group: 'Financeiro', title: 'Contas a Receber', icon: 'mdi-cash-plus', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'receber' }, disabled: true },
  { group: 'Financeiro', title: 'Contas a Pagar', icon: 'mdi-cash-minus', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'pagar' }, disabled: true },
  { group: 'Financeiro', title: 'Cobrancas', icon: 'mdi-bell-ring-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'cobrancas' }, disabled: true },
  { group: 'Financeiro', title: 'Faturas', icon: 'mdi-file-document-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'faturas' }, disabled: true },
  { group: 'Financeiro', title: 'Pagamentos', icon: 'mdi-credit-card-check-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'pagamentos' }, disabled: true },
  { group: 'Financeiro', title: 'Inadimplencia', icon: 'mdi-alert-circle-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'inadimplencia' }, disabled: true },
  { group: 'Financeiro', title: 'Fluxo de Caixa', icon: 'mdi-swap-horizontal', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'fluxo-caixa' }, disabled: true },
  { group: 'Financeiro', title: 'Comissoes', icon: 'mdi-account-cash-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'comissoes' }, disabled: true },
  { group: 'Financeiro', title: 'Centros de Custo', icon: 'mdi-sitemap-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'centros-custo' }, disabled: true },
  { group: 'Financeiro', title: 'Formas de Pagamento', icon: 'mdi-credit-card-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'formas-pagamento' }, disabled: true },
  { group: 'Financeiro', title: 'Relatórios Financeiros', icon: 'mdi-file-chart-outline', routeName: 'ordens-servico', query: { aba: 'financeiro', view: 'relatorios' }, disabled: true },
  { group: 'Marketing e Automacao', title: 'Campanhas', icon: 'mdi-message-bookmark-outline', routeName: 'campanhas', roles: ['admin'] },
  { group: 'Marketing e Automacao', title: 'Chatbot', icon: 'mdi-robot', routeName: 'chat-flow', roles: ['admin'] },
  { group: 'Marketing e Automacao', title: 'Etiquetas', icon: 'mdi-tag-text', routeName: 'etiquetas', roles: ['admin'] },
  { group: 'Marketing e Automacao', title: 'Automacoes', icon: 'mdi-lightning-bolt-outline', routeName: 'auto-resposta', roles: ['admin'], disabled: true },
  { group: 'Delivery', title: 'Pedidos', icon: 'mdi-clipboard-list-outline', routeName: 'delivery-pedidos', requiredModule: 'delivery', roles: ['admin'] },
  { group: 'Delivery', title: 'Cardápio', icon: 'mdi-silverware-fork-knife', routeName: 'delivery-catalogo', requiredModule: 'delivery', roles: ['admin'] },
  { group: 'Delivery', title: 'Áreas de Entrega', icon: 'mdi-map-marker-radius', routeName: 'delivery-zonas', requiredModule: 'delivery', roles: ['admin'] },
  { group: 'Administracao', title: 'Usuários', icon: 'mdi-account-group', routeName: 'usuarios', roles: ['admin'] },
  { group: 'Administracao', title: 'Permissões', icon: 'mdi-account-key-outline', routeName: 'usuarios', query: { view: 'permissoes' }, disabled: true },
  { group: 'Administracao', title: 'Configurações', icon: 'mdi-cog', routeName: 'configuracoes', roles: ['admin'] },
  { group: 'Administracao', title: 'API', icon: 'mdi-call-split', routeName: 'api-service', roles: ['admin'] },
  { group: 'Administracao', title: 'Auditoria', icon: 'mdi-shield-account-outline', routeName: 'configuracoes', query: { view: 'auditoria' }, disabled: true },
  { group: 'Conta', title: 'Minha Assinatura', icon: 'mdi-credit-card-outline', routeName: 'minha-assinatura' }
]

const menuGroupOrder = [
  'Visao Geral',
  'Atendimento',
  'CRM e Vendas',
  'Serviços Técnicos',
  'Financeiro',
  'Marketing e Automacao',
  'Delivery',
  'Administração',
  'Conta'
]

const buildMenuGroups = items => menuGroupOrder
  .map(title => ({
    title,
    items: items.filter(item => item.group === title)
  }))
  .filter(group => group.items.length)

const devItem = (title, slug, icon = 'mdi-progress-wrench', extra = {}) => ({
  key: `dev:${slug}`,
  title,
  icon,
  available: false,
  ...extra
})

const menuTreeCatalog = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'mdi-view-dashboard-outline',
    roles: ['admin'],
    children: [
      { key: 'dashboard-geral', title: 'Dashboard Geral', icon: 'mdi-home', routeName: 'home-dashboard' },
      { key: 'indicadores', title: 'Indicadores', icon: 'mdi-chart-box-outline', routeName: 'painel-atendimentos' },
      devItem('Agenda do Dia', 'agenda-do-dia', 'mdi-calendar-today'),
      devItem('Atividades Recentes', 'atividades-recentes', 'mdi-history')
    ]
  },
  {
    key: 'clientes',
    title: 'Clientes',
    icon: 'mdi-account-group-outline',
    children: [
      { key: 'clientes-consultar', title: 'Consultar Clientes', icon: 'mdi-account-search-outline', routeName: 'clientes' },
      { key: 'clientes-novo', title: 'Novo Cliente', icon: 'mdi-account-plus-outline', routeName: 'clientes', query: { acao: 'novo' } },
      { key: 'clientes-relatorios', title: 'Relatórios', icon: 'mdi-file-chart-outline', routeName: 'relatorios', roles: ['admin'] }
    ]
  },
  {
    key: 'orcamentos',
    title: 'Orçamentos',
    icon: 'mdi-file-document-edit-outline',
    children: [
      { key: 'orcamentos-novo', title: 'Novo Orçamento', icon: 'mdi-file-plus-outline', routeName: 'pipeline-vendas', query: { view: 'propostas' } },
      { key: 'orcamentos-consultar', title: 'Consultar Orçamentos', icon: 'mdi-file-search-outline', routeName: 'pipeline-vendas', query: { view: 'propostas' } },
      devItem('Informações para Orçamento', 'informacoes-para-orcamento', 'mdi-information-outline', { roles: ['admin'] }),
      { key: 'orcamentos-relatorios', title: 'Relatórios', icon: 'mdi-file-chart-outline', routeName: 'relatorios', roles: ['admin'] }
    ]
  },
  {
    key: 'vendas',
    title: 'Vendas',
    icon: 'mdi-cash-register',
    children: [
      { key: 'vendas-nova', title: 'Nova Venda', icon: 'mdi-cart-plus', routeName: 'pipeline-vendas' },
      { key: 'vendas-consultar', title: 'Consultar Vendas', icon: 'mdi-text-search', routeName: 'pipeline-vendas' },
      { key: 'vendas-relatorios', title: 'Relatórios', icon: 'mdi-file-chart-outline', routeName: 'relatorios', roles: ['admin'] }
    ]
  },
  {
    key: 'programacao',
    title: 'Programação',
    icon: 'mdi-calendar-month-outline',
    children: [
      { key: 'programacao-agenda-servicos', title: 'Agenda de Serviços', icon: 'mdi-calendar-check-outline', routeName: 'ordens-servico', query: { aba: 'agenda' } },
      { key: 'programacao-servico-avulso', title: 'Novo Serviço Avulso', icon: 'mdi-briefcase-plus-outline', routeName: 'ordens-servico', query: { acao: 'novo', tipo: 'avulso' } },
      { key: 'programacao-servico-ra', title: 'Novo Serviço RA', icon: 'mdi-clipboard-plus-outline', routeName: 'ordens-servico', query: { acao: 'novo', tipo: 'ra' } },
      devItem('Nova Vistoria para Relatório', 'nova-vistoria-relatorio', 'mdi-clipboard-text-search-outline'),
      devItem('Nova Vistoria para Orçamento', 'nova-vistoria-orcamento', 'mdi-clipboard-search-outline')
    ]
  },
  {
    key: 'atendimentos',
    title: 'Atendimentos',
    icon: 'mdi-face-agent',
    children: [
      { key: 'atendimentos-novo', title: 'Novo Atendimento', icon: 'mdi-plus-circle-outline', routeName: 'atendimento' },
      { key: 'atendimentos-consultar', title: 'Consultar Atendimentos', icon: 'mdi-forum-outline', routeName: 'atendimento' },
      {
        key: 'ordem-servico',
        title: 'Ordem de Serviço',
        icon: 'mdi-clipboard-list-outline',
        children: [
          { key: 'ordem-servico-agenda', title: 'Agenda e Ordens', icon: 'mdi-calendar-check-outline', routeName: 'ordens-servico', query: { aba: 'agenda' } },
          devItem('Informações de Segurança e Prevenção', 'informacoes-seguranca-prevencao', 'mdi-shield-check-outline'),
          devItem('Modelos de Ordem de Serviço', 'modelos-ordem-servico', 'mdi-file-cog-outline', { roles: ['admin', 'supervisor'] })
        ]
      },
      { key: 'atendimentos-relatorios', title: 'Relatórios', icon: 'mdi-file-chart-outline', routeName: 'relatorios', roles: ['admin'] }
    ]
  },
  {
    key: 'setor-tecnico',
    title: 'Setor Técnico',
    icon: 'mdi-tools',
    children: [
      { key: 'vistorias-consultar', title: 'Consultar Vistorias', icon: 'mdi-clipboard-search-outline', routeName: 'monitoramento' },
      { key: 'relatorios-tecnicos', title: 'Relatórios Técnicos', icon: 'mdi-file-chart-outline', routeName: 'relatorios', roles: ['admin', 'supervisor'] }
    ]
  },
  {
    key: 'crm-comercial',
    title: 'CRM Comercial',
    icon: 'mdi-phone-in-talk-outline',
    children: [
      { key: 'crm-conversas', title: 'Conversas', icon: 'mdi-message-text-outline', routeName: 'atendimento' },
      { key: 'crm-pipelines', title: 'Pipelines', icon: 'mdi-chart-timeline-variant', routeName: 'pipeline-vendas' },
      { key: 'crm-campanhas', title: 'Campanhas', icon: 'mdi-message-bookmark-outline', routeName: 'campanhas', roles: ['admin'] },
      {
        key: 'gestao-crm',
        title: 'Gestão CRM',
        icon: 'mdi-account-tie-outline',
        roles: ['admin'],
        children: [
          { key: 'gestao-crm-dashboard', title: 'Dashboard', icon: 'mdi-view-dashboard-variant', routeName: 'painel-atendimentos' },
          devItem('Ao Vivo', 'crm-ao-vivo', 'mdi-access-point'),
          { key: 'gestao-crm-consulta-conversas', title: 'Consulta de Conversas', icon: 'mdi-text-search', routeName: 'relatorios' }
        ]
      }
    ]
  },
  {
    key: 'cadastros',
    title: 'Cadastros',
    icon: 'mdi-archive-cog-outline',
    roles: ['admin', 'supervisor'],
    children: [
      {
        key: 'cadastros-comercial',
        title: 'Comercial',
        icon: 'mdi-storefront-outline',
        children: [
          devItem('Serviços', 'cad-servicos', 'mdi-format-list-bulleted-type'),
          devItem('Produtos', 'cad-produtos', 'mdi-package-variant-closed'),
          devItem('Pragas', 'cad-pragas', 'mdi-bug-outline'),
          devItem('Métodos', 'metodos', 'mdi-spray'),
          devItem('Tipos de Atendimento', 'tipos-atendimento', 'mdi-format-list-checks'),
          devItem('Informações para Orçamentos', 'cad-informacoes-orcamentos', 'mdi-information-outline')
        ]
      },
      {
        key: 'cadastros-operacional',
        title: 'Operacional',
        icon: 'mdi-factory',
        children: [
          devItem('Armadilhas', 'cad-armadilhas', 'mdi-crosshairs-gps'),
          devItem('Ferramentas', 'ferramentas', 'mdi-hammer-wrench'),
          devItem('Equipamentos', 'equipamentos', 'mdi-toolbox-outline'),
          devItem('Veículos', 'veiculos', 'mdi-truck-outline'),
          devItem('Não Conformidades', 'nao-conformidades', 'mdi-alert-octagon-outline')
        ]
      },
      {
        key: 'cadastros-pessoas',
        title: 'Pessoas',
        icon: 'mdi-account-multiple-outline',
        roles: ['admin'],
        children: [
          devItem('Funcionários', 'funcionarios', 'mdi-account-tie-outline'),
          { key: 'cad-usuarios', title: 'Usuários', icon: 'mdi-account-group', routeName: 'usuarios' },
          { key: 'cad-departamentos', title: 'Departamentos', icon: 'mdi-office-building-outline', routeName: 'filas' },
          { key: 'cad-perfis-acesso', title: 'Perfis de Acesso', icon: 'mdi-account-key-outline', routeName: 'usuarios', query: { view: 'permissoes' } }
        ]
      },
      {
        key: 'cadastros-financeiro',
        title: 'Financeiro',
        icon: 'mdi-cash-multiple',
        roles: ['admin'],
        children: [
          devItem('Plano de Contas', 'plano-contas', 'mdi-format-list-numbered'),
          devItem('Formas de Pagamento', 'formas-pagamento', 'mdi-credit-card-outline'),
          devItem('Tipos de Fechamento', 'tipos-fechamento', 'mdi-calendar-end'),
          devItem('Condições de Pagamento', 'condicoes-pagamento', 'mdi-calendar-clock')
        ]
      },
      {
        key: 'cadastros-gerais',
        title: 'Cadastros Gerais',
        icon: 'mdi-database-cog-outline',
        roles: ['admin'],
        children: [
          devItem('Fornecedores', 'fornecedores', 'mdi-truck-delivery-outline'),
          devItem('Cidades', 'cidades', 'mdi-city-variant-outline'),
          devItem('Estados', 'estados', 'mdi-map-outline'),
          devItem('Empresas/Filiais', 'empresas-filiais', 'mdi-domain'),
          { key: 'parametros-gerais', title: 'Parâmetros Gerais', icon: 'mdi-cog-outline', routeName: 'configuracoes' }
        ]
      }
    ]
  },
  {
    key: 'financeiro',
    title: 'Financeiro',
    icon: 'mdi-currency-usd',
    roles: ['admin', 'supervisor'],
    children: [
      devItem('Contas a Receber', 'contas-a-receber', 'mdi-cash-plus'),
      devItem('Contas a Pagar', 'contas-a-pagar', 'mdi-cash-minus'),
      devItem('Fluxo de Caixa', 'fluxo-de-caixa', 'mdi-swap-horizontal'),
      devItem('Conciliação Financeira', 'conciliacao-financeira', 'mdi-bank-check'),
      devItem('Relatórios Financeiros', 'relatorios-financeiros', 'mdi-file-chart-outline')
    ]
  },
  {
    key: 'relatorios',
    title: 'Relatórios',
    icon: 'mdi-chart-bar',
    roles: ['admin'],
    children: [
      { key: 'rel-clientes', title: 'Clientes', icon: 'mdi-account-box-outline', routeName: 'relatorios' },
      { key: 'rel-orcamentos', title: 'Orçamentos', icon: 'mdi-file-document-edit-outline', routeName: 'relatorios' },
      { key: 'rel-vendas', title: 'Vendas', icon: 'mdi-cash-register', routeName: 'relatorios' },
      { key: 'rel-atendimentos', title: 'Atendimentos', icon: 'mdi-face-agent', routeName: 'relatorios' },
      { key: 'rel-programacao', title: 'Programação', icon: 'mdi-calendar-month-outline', routeName: 'relatorios' },
      { key: 'rel-setor-tecnico', title: 'Setor Técnico', icon: 'mdi-tools', routeName: 'relatorios' },
      { key: 'rel-crm-comercial', title: 'CRM Comercial', icon: 'mdi-phone-in-talk-outline', routeName: 'relatorios' },
      { key: 'rel-financeiro', title: 'Financeiro', icon: 'mdi-currency-usd', routeName: 'relatorios' }
    ]
  },
  {
    key: 'configuracoes-crm',
    title: 'Configurações CRM',
    icon: 'mdi-cog-sync-outline',
    roles: ['admin'],
    children: [
      devItem('Status de Leads', 'status-leads', 'mdi-list-status'),
      devItem('Origens dos Leads', 'origens-leads', 'mdi-source-branch'),
      devItem('Origem de Chegada', 'origem-chegada', 'mdi-map-marker-path'),
      { key: 'gerenciar-pipelines', title: 'Gerenciar Pipelines', icon: 'mdi-chart-timeline-variant-shimmer', routeName: 'pipeline-vendas' },
      devItem('Produtos de Venda', 'produtos-venda', 'mdi-package-variant'),
      devItem('Metas de Venda', 'metas-venda', 'mdi-target'),
      devItem('Motivos de Perda', 'motivos-perda', 'mdi-close-octagon-outline'),
      devItem('Campos Customizados', 'campos-customizados', 'mdi-form-textbox')
    ]
  },
  {
    key: 'administracao',
    title: 'Administração do Sistema',
    icon: 'mdi-shield-account-outline',
    roles: ['admin'],
    children: [
      { key: 'admin-usuarios', title: 'Usuários', icon: 'mdi-account-group', routeName: 'usuarios' },
      { key: 'admin-perfis', title: 'Perfis de Acesso', icon: 'mdi-account-key-outline', routeName: 'usuarios', query: { view: 'permissoes' } },
      { key: 'admin-departamentos', title: 'Departamentos', icon: 'mdi-office-building-outline', routeName: 'filas' },
      { key: 'admin-api-webhooks', title: 'API / Webhooks', icon: 'mdi-call-split', routeName: 'api-service' },
      { key: 'admin-prompts', title: 'Prompts', icon: 'mdi-message-cog-outline', routeName: 'chat-flow' },
      devItem('AI Prompts', 'ai-prompts', 'mdi-robot-outline'),
      devItem('Controle de Acesso por IP', 'controle-acesso-ip', 'mdi-ip-network-outline'),
      devItem('Logs do Sistema', 'logs-sistema', 'mdi-text-box-search-outline'),
      { key: 'admin-config-gerais', title: 'Configurações Gerais', icon: 'mdi-cog-outline', routeName: 'configuracoes' },
      devItem('Configurações Avançadas', 'configuracoes-avancadas', 'mdi-cog-transfer-outline')
    ]
  },
  { key: 'minha-assinatura', title: 'Minha Assinatura', icon: 'mdi-credit-card-outline', routeName: 'minha-assinatura' },
  { key: 'delivery-pedidos', title: 'Delivery', icon: 'mdi-food-fork-drink', routeName: 'delivery-pedidos', requiredModule: 'delivery', roles: ['admin'] },
  { key: 'delivery-cardapio', title: 'Cardápio', icon: 'mdi-silverware-fork-knife', routeName: 'delivery-catalogo', requiredModule: 'delivery', roles: ['admin'] },
  { key: 'delivery-zonas', title: 'Áreas de Entrega', icon: 'mdi-map-marker-radius', routeName: 'delivery-zonas', requiredModule: 'delivery', roles: ['admin'] }
]

const filterMenuByAccess = (nodes, canShow) => nodes.reduce((acc, node) => {
  if (!canShow(node)) return acc
  const children = Array.isArray(node.children) ? filterMenuByAccess(node.children, canShow) : []
  if (!node.children || children.length) {
    acc.push({ ...node, children })
  }
  return acc
}, [])

const legacyMenuState = { objMenuGroups, menuCatalog, buildMenuGroups }

export default {
  name: 'MainLayout',
  mixins: [socketInitial],
  components: { SidebarMenu, ModalUsuario, cStatusUsuario, cSystemVersion, OnboardingAdmin },
  data () {
    return {
      username,
      tenantLogoUrl: resolveTenantLogoUrl(localStorage.getItem('tenantLogoUrl')),
      domainExperimentalsMenus: ['@'],
      sidebarCollapsed: localStorage.getItem('crmSidebarCollapsed') === 'true',
      userProfile: 'user',
      modalUsuario: false,
      onboardingOpen: false,
      notificationPromptOpen: false,
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
      globalSearch: '',
      commandPaletteOpen: false,
      usuario: {},
      alertSound,
      leftDrawerOpen: false,
      menuData: [],
      menuDataAdmin: objMenuAdminGroups,
      legacyMenuState,
      countTickets: 0,
      ticketsList: []
    }
  },
  watch: {
    sidebarCollapsed (value) {
      localStorage.setItem('crmSidebarCollapsed', value ? 'true' : 'false')
    }
  },
  computed: {
    ...mapGetters(['notifications', 'notifications_p', 'whatsapps']),
    accessDaysRemaining () {
      if (!this.usuario.accessExpiresAt) return null
      const expiration = new Date(this.usuario.accessExpiresAt)
      const today = new Date()
      expiration.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      return Math.max(0, Math.ceil((expiration - today) / 86400000) + 1)
    },
    cProblemaConexao () {
      const idx = this.whatsapps.findIndex(w =>
        ['PAIRING', 'TIMEOUT', 'DISCONNECTED'].includes(w.status)
      )
      return idx !== -1
    },
    cQrCode () {
      const idx = this.whatsapps.findIndex(
        w => w.status === 'qrcode' || w.status === 'DESTROYED'
      )
      return idx !== -1
    },
    cOpening () {
      const idx = this.whatsapps.findIndex(w => w.status === 'OPENING')
      return idx !== -1
    },
    cUsersApp () {
      return this.$store.state.usersApp
    },
    currentRouteTitle () {
      return routeDisplayNames[this.$route.name] || 'CRM'
    },
    cObjMenu () {
      if (this.cProblemaConexao) {
        return objMenu.map(menu => {
          if (menu.routeName === 'sessoes') {
            menu.color = 'negative'
          }
          return menu
        })
      }
      return objMenu
    }
  },
  methods: {
    montarMenu () {
      this.menuData = filterMenuByAccess(menuTreeCatalog, item => {
        if (item.available === false) return false
        const roles = item.roles || (item.disabled ? ['admin'] : null)
        if (roles && !roles.includes(this.userProfile)) return false
        if (item.routeName && !canAccessRoute(item.routeName, this.userProfile, this.usuario.enabledModules || {})) return false
        return this.exibirMenuBeta(item)
      })
    },
    executarBuscaGlobal () {
      const searchParam = (this.globalSearch || '').trim()
      if (!searchParam) return
      this.commandPaletteOpen = false
      this.$router.push({ name: 'contatos', query: { searchParam } })
    },
    atualizarLogoCabecalho (event) {
      this.tenantLogoUrl = resolveTenantLogoUrl(event.detail)
    },
    recolherSidebarAoClicarFora (event) {
      const sidebar = this.$refs.sidebarDrawer?.$el
      if (!sidebar || sidebar.contains(event.target)) return
      this.sidebarCollapsed = true
    },
    exibirMenuBeta (itemMenu) {
      if (itemMenu?.requiredModule && !this.usuario.enabledModules?.[itemMenu.requiredModule]) return false
      if (!itemMenu?.isBeta) return true
      for (const domain of this.domainExperimentalsMenus) {
        if (this.usuario.email.indexOf(domain) !== -1) return true
      }
      return false
    },
    async listarWhatsapps () {
      const { data } = await ListarWhatsapps()
      this.$store.commit('LOAD_WHATSAPPS', data)
    },
    dispensarAtivacaoNotificacoes () {
      localStorage.setItem('notificationPromptDismissed', 'true')
      this.notificationPromptOpen = false
    },
    async ativarNotificacoes () {
      if (!('Notification' in window)) {
        this.$q.notify({
          type: 'warning',
          message: 'Este navegador não oferece suporte a notificações.'
        })
        this.notificationPromptOpen = false
        return
      }
      const permission = await Notification.requestPermission()
      this.notificationPermission = permission
      this.notificationPromptOpen = false
      if (permission === 'granted') {
        localStorage.removeItem('notificationPromptDismissed')
        this.$q.notify({
          type: 'positive',
          message: 'Notificações ativadas.'
        })
        return
      }
      this.$q.notify({
        type: 'warning',
        message: 'As notificações continuam desativadas. Você pode liberá-las nas configurações do navegador.'
      })
    },
    handlerNotifications (data) {
      const { message, contact, ticket } = data

      const options = {
        body: `${message.body} - ${format(new Date(), 'HH:mm')}`,
        icon: contact.profilePicUrl,
        tag: ticket.id,
        renotify: true
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(
          `Mensagem de ${contact.name}`,
          options
        )

        notification.onclick = e => {
          e.preventDefault()
          window.focus()
          this.$store.dispatch('AbrirChatMensagens', ticket)
          this.$router.push({ name: 'atendimento' })
        }
      }
      this.$nextTick(() => {
        // utilizar refs do layout
        this.$refs.audioNotification.play()
      })
    },
    async abrirModalUsuario () {
      this.modalUsuario = true
    },
    async efetuarLogout () {
      try {
        await RealizarLogout(this.usuario)
        clearAccessToken()
        localStorage.removeItem('username')
        localStorage.removeItem('profile')
        localStorage.removeItem('userId')
        localStorage.removeItem('queues')
        localStorage.removeItem('usuario')
        localStorage.removeItem('filtrosAtendimento')

        this.$router.go({ name: 'login', replace: true })
      } catch (error) {
        this.$notificarErro('Não foi possível realizar logout', error)
      }
    },
    async listarConfiguracoes () {
      const { data } = await ListarConfiguracoes()
      localStorage.setItem('configuracoes', JSON.stringify(data))
    },
    conectarSocket (usuario) {
      socket.on(`${usuario.tenantId}:chat:updateOnlineBubbles`, data => {
        this.$store.commit('SET_USERS_APP', data)
      })
    },
    atualizarUsuario () {
      this.usuario = JSON.parse(localStorage.getItem('usuario'))
      if (this.usuario.status === 'offline') {
        socket.emit(`${this.usuario.tenantId}:setUserIdle`)
      }
      if (this.usuario.status === 'online') {
        socket.emit(`${this.usuario.tenantId}:setUserActive`)
      }
    },
    async consultarTickets () {
      const params = {
        searchParam: '',
        pageNumber: 1,
        status: ['open'],
        showAll: false,
        count: null,
        queuesIds: [],
        withUnreadMessages: true,
        isNotAssignedUser: false,
        includeNotQueueDefined: true
      }
      try {
        const { data } = await ConsultarTickets(params)
        this.countTickets = data.count // count total de tickets no status
        this.$store.commit('UPDATE_NOTIFICATIONS', data)
      } catch (err) {
        this.$notificarErro('Algum problema', err)
        console.error(err)
      }
      const params2 = {
        searchParam: '',
        pageNumber: 1,
        status: ['pending'],
        showAll: false,
        count: null,
        queuesIds: [],
        withUnreadMessages: false,
        isNotAssignedUser: false,
        includeNotQueueDefined: true
      }
      try {
        const { data } = await ConsultarTickets(params2)
        this.countTickets = data.count // count total de tickets no status
        this.$store.commit('UPDATE_NOTIFICATIONS_P', data)
      } catch (err) {
        this.$notificarErro('Algum problema', err)
        console.error(err)
      }
    },
    abrirChatContato (ticket) {
      // caso esteja em um tamanho mobile, fechar a drawer dos contatos
      if (this.$q.screen.lt.md && ticket.status !== 'pending') {
        this.$root.$emit('infor-cabecalo-chat:acao-menu')
      }
      if (!(ticket.status !== 'pending' && (ticket.id !== this.$store.getters.ticketFocado.id || this.$route.name !== 'chat'))) return
      this.$store.commit('SET_HAS_MORE', true)
      this.$store.dispatch('AbrirChatMensagens', ticket)
    },
    abrirAtendimentoExistente (contato, ticket) {
      this.$q.dialog({
        title: 'Atenção!!',
        message: `${contato} possui um atendimento em curso (Atendimento: ${ticket.id}). Deseja abrir o atendimento?`,
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(async () => {
        try {
          this.abrirChatContato(ticket)
        } catch (error) {
          this.$notificarErro(
            'Não foi possível atualizar o token',
            error
          )
        }
      })
    }
  },
  async mounted () {
    window.addEventListener('tenant-logo-updated', this.atualizarLogoCabecalho)
    document.addEventListener('click', this.recolherSidebarAoClicarFora)
    this.atualizarUsuario()
    await this.listarWhatsapps()
    await this.listarConfiguracoes()
    await this.consultarTickets()
    if (
      'Notification' in window &&
      Notification.permission === 'default' &&
      localStorage.getItem('notificationPromptDismissed') !== 'true'
    ) {
      this.notificationPromptOpen = true
    }
    this.usuario = JSON.parse(localStorage.getItem('usuario'))
    this.userProfile = localStorage.getItem('profile')
    this.montarMenu()
    if (this.userProfile === 'admin') {
      const onboardingKey = `onboardingAdmin:${this.usuario.tenantId || 'default'}`
      const onboarding = JSON.parse(localStorage.getItem(onboardingKey) || '{}')
      this.onboardingOpen = !(onboarding.completed || this.usuario.configs?.onboardingAdmin?.completed)
    }
    await this.conectarSocket(this.usuario)
  },
  destroyed () {
    window.removeEventListener('tenant-logo-updated', this.atualizarLogoCabecalho)
    document.removeEventListener('click', this.recolherSidebarAoClicarFora)
    socket.disconnect()
  }
}
</script>
<style scoped>
.q-img__image {
  background-size: contain;
}
</style>
