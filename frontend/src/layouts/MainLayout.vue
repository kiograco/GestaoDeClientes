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
            <q-avatar size="26px">
              {{ $iniciaisString(username) }}
            </q-avatar>
            <span
              v-if="$q.screen.gt.sm"
              class="q-ml-sm"
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
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      content-class="app-sidebar"
    >
      <q-scroll-area class="fit">
        <q-list
          padding
          :key="userProfile"
        >
          <template v-for="group in menuData">
            <div :key="group.title">
              <q-item-label
                v-show="!miniState"
                header
                class="app-nav-group"
              >
                {{ group.title }}
              </q-item-label>
              <EssentialLink
                v-for="item in group.items"
                :key="item.title"
                v-bind="item"
              />
            </div>
          </template>
          <div v-if="userProfile === 'admin'">
            <q-separator spaced />
            <template v-for="group in menuDataAdmin">
              <div :key="group.title">
                <q-item-label
                  v-show="!miniState"
                  header
                  class="app-nav-group"
                >
                  {{ group.title }}
                </q-item-label>
                <EssentialLink
                  v-for="item in group.items"
                  v-if="exibirMenuBeta(item)"
                  :key="item.title"
                  v-bind="item"
                />
                <q-separator spaced />
              </div>
            </template>
          </div>

        </q-list>
      </q-scroll-area>
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
import EssentialLink from 'components/EssentialLink.vue'
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
    routes: ['atendimento', 'ordens-servico']
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
    title: 'Usuarios',
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
    title: 'Cardapio',
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
    title: 'Areas de entrega',
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

export default {
  name: 'MainLayout',
  mixins: [socketInitial],
  components: { EssentialLink, ModalUsuario, cStatusUsuario, cSystemVersion, OnboardingAdmin },
  data () {
    return {
      username,
      tenantLogoUrl: resolveTenantLogoUrl(localStorage.getItem('tenantLogoUrl')),
      domainExperimentalsMenus: ['@'],
      miniState: true,
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
      menuData: objMenuGroups,
      menuDataAdmin: objMenuAdminGroups,
      countTickets: 0,
      ticketsList: []
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
    executarBuscaGlobal () {
      const searchParam = (this.globalSearch || '').trim()
      if (!searchParam) return
      this.commandPaletteOpen = false
      this.$router.push({ name: 'contatos', query: { searchParam } })
    },
    atualizarLogoCabecalho (event) {
      this.tenantLogoUrl = resolveTenantLogoUrl(event.detail)
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
    if (this.userProfile === 'admin') {
      const onboardingKey = `onboardingAdmin:${this.usuario.tenantId || 'default'}`
      const onboarding = JSON.parse(localStorage.getItem(onboardingKey) || '{}')
      this.onboardingOpen = !(onboarding.completed || this.usuario.configs?.onboardingAdmin?.completed)
    }
    await this.conectarSocket(this.usuario)
  },
  destroyed () {
    window.removeEventListener('tenant-logo-updated', this.atualizarLogoCabecalho)
    socket.disconnect()
  }
}
</script>
<style scoped>
.q-img__image {
  background-size: contain;
}
</style>
