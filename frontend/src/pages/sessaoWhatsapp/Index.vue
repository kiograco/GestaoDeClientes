<template>
  <div>
    <div class="row col full-width q-pa-sm">
      <q-card
        flat
        class="full-width"
      >
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="text-h6 text-bold">
              Conexões
            </div>
            <div class="text-caption text-grey-7">
              Conecte o WhatsApp Oficial pela Meta ou informe manualmente os dados do numero.
            </div>
          </div>
          <div class="col-12 col-md-auto row q-gutter-sm justify-end">
            <q-btn
              rounded
              color="primary"
              icon="mdi-whatsapp"
              label="Conectar pela Meta"
              @click="handleWabaMetaSignup"
              :disable="!isAdmin"
            />
            <q-btn
              rounded
              outline
              color="primary"
              icon="mdi-form-textbox-password"
              label="Informar dados do número"
              @click="openManualWabaModal"
              :disable="!isAdmin"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
    <q-banner
      v-if="instagramConnection.state"
      rounded
      class="q-ma-sm text-white"
      :class="`bg-${instagramConnectionColor}`"
    >
      <div class="text-subtitle1 text-bold">{{ instagramConnection.title }}</div>
      <div class="text-body2">{{ instagramConnection.message }}</div>
      <q-linear-progress
        v-if="['opening', 'waiting'].includes(instagramConnection.state)"
        indeterminate
        color="white"
        class="q-mt-sm"
      />
      <template v-slot:action>
        <q-btn
          v-if="['error', 'timeout'].includes(instagramConnection.state)"
          flat
          color="white"
          label="Tentar novamente"
          @click="retryInstagramConnection"
        />
        <q-btn
          v-if="instagramConnection.state === 'success'"
          flat
          color="white"
          label="Fechar"
          @click="clearInstagramConnection"
        />
      </template>
    </q-banner>
    <div class="row full-width">
      <template v-for="item in canais" :key="item.id">
        <q-card
          flat
          bordered
          class="col-xs-12 col-sm-5 col-md-4 col-lg-3 q-ma-sm"

        >
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <q-icon
                  size="40px"
                  name="img:waba-logo.png"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6 text-bold">Nome: {{ item.name }}</q-item-label>
              <q-item-label class="text-h6 text-caption">
                WhatsApp Oficial Meta
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                round
                flat
                dense
                icon="mdi-pen"
                @click="handleOpenModalWhatsapp(item)"
                v-if="isAdmin"
              />
            </q-item-section>
          </q-item>
          <q-separator />
          <q-card-section>
            <ItemStatusChannel :item="item" />
          </q-card-section>
          <q-card-section>
            <q-select
              outlined
              dense
              rounded
              label="Bot"
              v-model="item.chatFlowId"
              :options="listaChatFlow"
              map-options
              emit-value
              option-value="id"
              option-label="name"
              clearable
              @input="handleSaveWhatsApp(item)"
            />
          </q-card-section>
          <q-separator />
          <q-card-actions
            class="q-gutter-md q-pa-md q-pt-none"
            align="center"
          >
            <template>
              <div
                v-if="item.status === 'DISCONNECTED'"
                class="q-gutter-sm"
              >
                <q-btn
                  rounded
                  color="positive"
                  label="Conectar"
                  @click="handleConnectChannel(item)"
                  :disable="!isAdmin"
                />
              </div>

              <div
                v-if="item.status === 'OPENING'"
                class="row items-center q-gutter-sm flex flex-inline"
              >
                <div class="text-bold">
                  Conectando
                </div>
                <q-spinner-radio
                  color="positive"
                  size="2em"
                />
                <q-separator
                  vertical
                  spaced=""
                />
              </div>

              <q-btn
                v-if="['OPENING', 'CONNECTED', 'PAIRING', 'TIMEOUT'].includes(item.status)"
                color="negative"
                label="Desconectar"
                @click="handleDisconectWhatsSession(item.id)"
                :disable="!isAdmin"
                class="q-mx-sm"
              />
            </template>
            <q-btn
              color="red"
              icon="mdi-delete"
              @click="deleteWhatsapp(item)"
              :disable="!isAdmin"
              dense
              round
              flat
              class="absolute-bottom-right"
            >
              <q-tooltip>
                Deletar conexão
              </q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </template>
    </div>
    <ModalWhatsapp
      v-model:modalWhatsapp="modalWhatsapp"
      v-model:whatsAppEdit="whatsappSelecionado"
      @recarregar-lista="listarWhatsapps"
    />
    <q-inner-loading :showing="loading">
      <q-spinner-gears
        size="50px"
        color="primary"
      />
    </q-inner-loading>
  </div>
</template>

<script>

import { DeletarWhatsapp, DeleteWhatsappSession, GetWabaMetaSignupUrl, StartWhatsappSession, ListarWhatsapps, UpdateWhatsapp } from 'src/service/sessoesWhatsapp'
import { format, parseISO } from 'date-fns'
import pt from 'date-fns/locale/pt-BR/index'
import { mapGetters } from 'vuex'
import ModalWhatsapp from './ModalWhatsapp'
import ItemStatusChannel from './ItemStatusChannel'
import { ListarChatFlow } from 'src/service/chatFlow'

const userLogado = JSON.parse(localStorage.getItem('usuario'))

export default {
  name: 'IndexSessoesWhatsapp',
  components: {
    ModalWhatsapp,
    ItemStatusChannel
  },
  data () {
    return {
      loading: false,
      userLogado,
      isAdmin: false,
      modalWhatsapp: false,
      whatsappSelecionado: {},
      listaChatFlow: [],
      whatsAppId: null,
      canais: [],
      instagramConnection: {
        channelId: null,
        state: null,
        title: '',
        message: ''
      },
      columns: [
        {
          name: 'name',
          label: 'Nome',
          field: 'name',
          align: 'left'
        },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center'
        },
        {
          name: 'session',
          label: 'Sessão',
          field: 'status',
          align: 'center'
        },
        {
          name: 'number',
          label: 'Número',
          field: 'number',
          align: 'center'
        },
        {
          name: 'updatedAt',
          label: 'Última Atualização',
          field: 'updatedAt',
          align: 'center',
          format: d => this.formatarData(d, 'dd/MM/yyyy HH:mm')
        },
        {
          name: 'isDefault',
          label: 'Padrão',
          field: 'isDefault',
          align: 'center'
        },
        {
          name: 'acoes',
          label: 'Ações',
          field: 'acoes',
          align: 'center'
        }
      ]
    }
  },
  watch: {
    whatsapps: {
      handler () {
        this.canais = JSON.parse(JSON.stringify(this.whatsapps))
      },
      deep: true
    }
  },
  computed: {
    ...mapGetters(['whatsapps']),
    instagramConnectionColor () {
      if (this.instagramConnection.state === 'success') return 'positive'
      if (['error', 'timeout'].includes(this.instagramConnection.state)) return 'negative'
      return 'primary'
    }
  },
  methods: {
    clearInstagramConnection () {
      this.instagramConnection = {
        channelId: null,
        state: null,
        title: '',
        message: ''
      }
    },
    setInstagramConnection (channelId, state, title, message) {
      this.instagramConnection = {
        channelId,
        state,
        title,
        message
      }
    },
    getMetaSignupError (error) {
      const errorCode = error?.data?.error || error?.response?.data?.error || error?.message
      const errors = {
        ERR_META_WHATSAPP_OAUTH_NOT_CONFIGURED: {
          title: 'Onboarding Meta nao configurado',
          message: 'Configure as variaveis META_APP_ID, META_APP_SECRET, META_WHATSAPP_REDIRECT_URI e META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID no backend.',
          notify: 'Onboarding Meta nao configurado no servidor.'
        },
        'Meta authorization popup blocked': {
          title: 'Janela da Meta bloqueada',
          message: 'Permita popups para este site no navegador e tente conectar novamente.',
          notify: 'O navegador bloqueou a janela de autorizacao da Meta.'
        },
        ERR_META_WHATSAPP_OAUTH_DENIED: {
          title: 'Autorizacao Meta cancelada',
          message: 'A autorizacao foi negada ou cancelada na Meta. Inicie novamente e conclua todas as etapas.',
          notify: 'Autorizacao Meta cancelada.'
        },
        ERR_META_WHATSAPP_INVALID_STATE: {
          title: 'Sessao Meta expirada',
          message: 'A sessao de autorizacao expirou ou ficou invalida. Clique em Conectar pela Meta novamente.',
          notify: 'Sessao de autorizacao Meta invalida.'
        },
        ERR_META_WHATSAPP_OAUTH_TOKEN: {
          title: 'Token Meta nao gerado',
          message: 'A Meta nao retornou o token de acesso. Revise App ID, App Secret, permissao do app e Redirect URI.',
          notify: 'Falha ao gerar token Meta.'
        },
        ERR_META_WHATSAPP_PHONE_NOT_FOUND: {
          title: 'Numero nao encontrado na Meta',
          message: 'A autorizacao foi concluida, mas nenhum Phone Number ID foi encontrado na conta selecionada.',
          notify: 'Nenhum numero WhatsApp Business foi encontrado na Meta.'
        }
      }

      return errors[errorCode] || {
        title: 'Nao foi possivel conectar o WhatsApp Oficial',
        message: 'Confira as credenciais do app Meta, o Redirect URI e tente novamente. Detalhe tecnico: ' + (errorCode || 'erro nao informado'),
        notify: 'Nao foi possivel iniciar o onboarding oficial da Meta.'
      }
    },
    retryInstagramConnection () {
      if (this.instagramConnection.channelId === 'waba-meta') {
        this.handleWabaMetaSignup()
        return
      }
      this.clearInstagramConnection()
    },
    formatarData (data, formato) {
      return format(parseISO(data), formato, { locale: pt })
    },
    handleOpenModalWhatsapp (whatsapp) {
      this.whatsappSelecionado = whatsapp
      this.modalWhatsapp = true
    },
    openManualWabaModal () {
      this.whatsappSelecionado = {
        type: 'waba',
        wabaBSP: 'meta',
        name: '',
        fbPageId: '',
        tokenAPI: '',
        farewellMessage: ''
      }
      this.modalWhatsapp = true
    },
    async handleDisconectWhatsSession (whatsAppId) {
      this.$q.dialog({
        title: 'Atenção!! Deseja realmente desconectar? ',
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
      }).onOk(() => {
        this.loading = true
        DeleteWhatsappSession(whatsAppId).then(() => {
          const whatsapp = this.whatsapps.find(w => w.id === whatsAppId)
          this.$store.commit('UPDATE_WHATSAPPS', {
            ...whatsapp,
            status: 'DISCONNECTED'
          })
        }).finally(f => {
          this.loading = false
        })
      })
    },
    async handleStartWhatsAppSession (whatsAppId) {
      try {
        await StartWhatsappSession(whatsAppId)
      } catch (error) {
        console.error(error)
      }
    },
    async handleWabaMetaSignup () {
      this.setInstagramConnection(
        'waba-meta',
        'opening',
        'Preparando conexao oficial da Meta',
        'Aguarde enquanto abrimos o onboarding oficial do WhatsApp Business.'
      )
      const startedAt = Date.now()
      try {
        const { data } = await GetWabaMetaSignupUrl()
        const popup = window.open(data.url, 'waba-meta-oauth', 'width=720,height=760')
        if (!popup) {
          throw new Error('Meta authorization popup blocked')
        }
        this.setInstagramConnection(
          'waba-meta',
          'waiting',
          'Aguardando autorizacao da Meta',
          'Conclua as etapas na janela aberta. O canal sera criado automaticamente ao final.'
        )
        for (let attempt = 0; attempt < 90; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const response = await ListarWhatsapps()
          this.$store.commit('LOAD_WHATSAPPS', response.data)
          const channel = response.data.find(item =>
            item.type === 'waba' &&
            item.wabaBSP === 'meta' &&
            item.updatedAt &&
            new Date(item.updatedAt).getTime() >= startedAt - 5000
          )
          if (channel) {
            this.setInstagramConnection(
              'waba-meta',
              'success',
              'WhatsApp Oficial conectado',
              'O numero foi autorizado pela Meta e inserido automaticamente neste CRM.'
            )
            this.$notificarSucesso('WhatsApp Oficial conectado pela API Meta.')
            return
          }
        }
        this.setInstagramConnection(
          'waba-meta',
          'timeout',
          'Tempo de autorizacao esgotado',
          'Nao recebemos a confirmacao em tres minutos. Feche a janela anterior e tente novamente.'
        )
      } catch (error) {
        console.error(error)
        const metaError = this.getMetaSignupError(error)
        this.setInstagramConnection(
          'waba-meta',
          'error',
          metaError.title,
          metaError.message
        )
        this.$notificarErro(metaError.notify)

        if ((error?.data?.error || error?.response?.data?.error) === 'ERR_META_WHATSAPP_OAUTH_NOT_CONFIGURED') {
          this.openManualWabaModal()
        }
      }
    },
    async handleConnectChannel (channel) {
      if (channel.type !== 'waba' || channel.wabaBSP !== 'meta') {
        this.$notificarErro('Apenas conexoes WhatsApp Oficial Meta podem ser conectadas.')
        return
      }
      return this.handleStartWhatsAppSession(channel.id)
    },
    async listarWhatsapps () {
      const { data } = await ListarWhatsapps()
      this.$store.commit('LOAD_WHATSAPPS', data)
    },
    async deleteWhatsapp (whatsapp) {
      this.$q.dialog({
        title: 'Atenção!! Deseja realmente deletar? ',
        message: 'Não é uma boa ideia apagar se já tiver gerado atendimentos para esse whatsapp.',
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
      }).onOk(() => {
        this.loading = true
        DeletarWhatsapp(whatsapp.id).then(r => {
          this.$store.commit('DELETE_WHATSAPPS', whatsapp.id)
        }).finally(f => {
          this.loading = false
        })
      })
    },
    async listarChatFlow () {
      const { data } = await ListarChatFlow()
      this.listaChatFlow = data.chatFlow
    },
    async handleSaveWhatsApp (whatsapp) {
      try {
        await UpdateWhatsapp(whatsapp.id, {
          chatFlowId: whatsapp.chatFlowId
        })
        this.$q.notify({
          type: 'positive',
          progress: true,
          position: 'top',
          message: `Whatsapp ${whatsapp.id ? 'editado' : 'criado'} com sucesso!`,
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
      } catch (error) {
        console.error(error)
        return this.$q.notify({
          type: 'error',
          progress: true,
          position: 'top',
          message: 'Ops! Verifique os erros... O nome da conexão não pode existir na plataforma, é um identificador único.',
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
      }
    }
  },
  mounted () {
    this.isAdmin = localStorage.getItem('profile')
    this.listarWhatsapps()
    this.listarChatFlow()
  }
}
</script>

<style lang="scss" scoped>
</style>
