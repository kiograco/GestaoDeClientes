<template>
  <div>
    <div class="row col full-width q-pa-sm">
      <q-card
        flat
        class="full-width"
      >
        <q-card-section class="text-h6 text-bold">
          Canais
          <div class="absolute-right q-pa-md">
            <q-btn
              rounded
              color="primary"
              icon="mdi-whatsapp"
              label="Conectar Meta"
              class="q-mr-sm"
              @click="handleWabaMetaSignup"
              :disable="!isAdmin"
            />
            <q-btn
              rounded
              color="black"
              icon="mdi-plus"
              label="Adicionar"
              @click="modalWhatsapp = true"
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
      <template v-for="item in canais">
        <q-card
          flat
          bordered
          class="col-xs-12 col-sm-5 col-md-4 col-lg-3 q-ma-sm"
          :key="item.id"
        >
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <q-icon
                  size="40px"
                  :name="`img:${item.type === 'instagram_oauth' ? 'instagram' : item.type}-logo.png`"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6 text-bold">Nome: {{ item.name }}</q-item-label>
              <q-item-label class="text-h6 text-caption">
                {{ item.type }}
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
            <template v-if="item.type === 'messenger'">
              <div class="text-body2 text-bold q-mt-sm">
                <span> Página: </span>
                {{ item.fbObject && item.fbObject.name || 'Nenhuma página configurada.' }}
              </div>
            </template>
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
            <template v-if="item.type !== 'messenger'">
              <q-btn
                rounded
                v-if="item.type == 'whatsapp' && item.status == 'qrcode'"
                color="blue-5"
                label="QR Code"
                @click="handleOpenQrModal(item, 'btn-qrCode')"
                icon-right="watch_later"
                :disable="!isAdmin"
              />

              <div
                v-if="['DISCONNECTED', 'INSTAGRAM_BAD_PASSWORD'].includes(item.status)"
                class="q-gutter-sm"
              >
                <q-btn
                  rounded
                  color="positive"
                  label="Conectar"
                  @click="handleConnectChannel(item)"
                />
                <q-btn
                  rounded
                  v-if="item.status == 'DISCONNECTED' && item.type == 'whatsapp'"
                  color="blue-5"
                  label="Novo QR Code"
                  @click="handleRequestNewQrCode(item, 'btn-qrCode')"
                  icon-right="watch_later"
                  :disable="!isAdmin"
                />
              </div>

              <div
                v-if="item.status == 'OPENING'"
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
                Deletar conexáo
              </q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </template>
    </div>
    <ModalQrCode
      :abrirModalQR.sync="abrirModalQR"
      :channel="cDadosWhatsappSelecionado"
      @gerar-novo-qrcode="v => handleRequestNewQrCode(v, 'btn-qrCode')"
    />
    <ModalWhatsapp
      :modalWhatsapp.sync="modalWhatsapp"
      :whatsAppEdit.sync="whatsappSelecionado"
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

import { DeletarWhatsapp, DeleteWhatsappSession, GetInstagramOAuthUrl, GetWabaMetaSignupUrl, StartWhatsappSession, ListarWhatsapps, RequestNewQrCode, UpdateWhatsapp } from 'src/service/sessoesWhatsapp'
import { format, parseISO } from 'date-fns'
import pt from 'date-fns/locale/pt-BR/index'
import ModalQrCode from './ModalQrCode'
import { mapGetters } from 'vuex'
import ModalWhatsapp from './ModalWhatsapp'
import ItemStatusChannel from './ItemStatusChannel'
import { ListarChatFlow } from 'src/service/chatFlow'

const userLogado = JSON.parse(localStorage.getItem('usuario'))

export default {
  name: 'IndexSessoesWhatsapp',
  components: {
    ModalQrCode,
    ModalWhatsapp,
    ItemStatusChannel
  },
  data () {
    return {
      loading: false,
      userLogado,
      isAdmin: false,
      abrirModalQR: false,
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
      objStatus: {
        qrcode: ''
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
    cDadosWhatsappSelecionado () {
      const { id } = this.whatsappSelecionado
      return this.whatsapps.find(w => w.id === id)
    },
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
    retryInstagramConnection () {
      if (this.instagramConnection.channelId === 'waba-meta') {
        this.handleWabaMetaSignup()
        return
      }
      const channel = this.canais.find(item => item.id === this.instagramConnection.channelId)
      if (channel) this.handleConnectChannel(channel)
    },
    formatarData (data, formato) {
      return format(parseISO(data), formato, { locale: pt })
    },
    handleOpenQrModal (channel) {
      this.whatsappSelecionado = channel
      this.abrirModalQR = true
    },
    handleOpenModalWhatsapp (whatsapp) {
      this.whatsappSelecionado = whatsapp
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
        this.setInstagramConnection(
          'waba-meta',
          'error',
          'Nao foi possivel conectar o WhatsApp Oficial',
          'Verifique se o navegador bloqueou a nova janela e confirme as configuracoes do app Meta.'
        )
        this.$notificarErro('Nao foi possivel iniciar o onboarding oficial da Meta.')
      }
    },
    async handleRequestNewQrCode (channel, origem) {
      if (channel.type === 'telegram' && !channel.tokenTelegram) {
        this.$notificarErro('Necessário informar o token para Telegram')
      }
      this.loading = true
      try {
        await RequestNewQrCode({ id: channel.id, isQrcode: true })
        this.handleOpenQrModal(channel)
        this.pollQrCode(channel.id)
      } catch (error) {
        console.error(error)
      }
      this.loading = false
    },
    async handleConnectChannel (channel) {
      if (channel.type !== 'instagram_oauth') {
        return this.handleStartWhatsAppSession(channel.id)
      }
      this.setInstagramConnection(
        channel.id,
        'opening',
        'Preparando autorizacao do Instagram',
        'Aguarde enquanto abrimos a pagina oficial de autorizacao.'
      )
      try {
        const { data } = await GetInstagramOAuthUrl(channel.id)
        const popup = window.open(data.url, 'instagram-oauth', 'width=720,height=760')
        if (!popup) {
          throw new Error('Instagram authorization popup blocked')
        }
        this.setInstagramConnection(
          channel.id,
          'waiting',
          'Aguardando autorizacao do Instagram',
          'Conclua as etapas na janela aberta. A verificacao pode levar ate tres minutos.'
        )
        for (let attempt = 0; attempt < 90; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const response = await ListarWhatsapps()
          this.$store.commit('LOAD_WHATSAPPS', response.data)
          const updated = response.data.find(item => item.id === channel.id)
          if (updated && updated.status === 'CONNECTED') {
            this.setInstagramConnection(
              channel.id,
              'success',
              'Instagram conectado',
              'A conta foi autorizada e o canal esta pronto para uso.'
            )
            this.$notificarSucesso('Instagram conectado pela API oficial.')
            return
          }
        }
        this.setInstagramConnection(
          channel.id,
          'timeout',
          'Tempo de autorizacao esgotado',
          'Nao recebemos a confirmacao em tres minutos. Feche a janela anterior e tente novamente.'
        )
      } catch (error) {
        console.error(error)
        this.setInstagramConnection(
          channel.id,
          'error',
          'Nao foi possivel conectar o Instagram',
          'Verifique se o navegador bloqueou a nova janela e tente novamente. Se o erro persistir, confirme o acesso a conta diretamente no Instagram.'
        )
        this.$notificarErro('Nao foi possivel iniciar a autorizacao oficial do Instagram.')
      }
    },
    async pollQrCode (channelId) {
      for (let attempt = 0; attempt < 45; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          const { data } = await ListarWhatsapps()
          this.$store.commit('LOAD_WHATSAPPS', data)
          const channel = data.find(item => item.id === channelId)
          if (!channel || channel.qrcode || channel.status === 'CONNECTED') {
            return
          }
        } catch (error) {
          console.error(error)
          return
        }
      }
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
