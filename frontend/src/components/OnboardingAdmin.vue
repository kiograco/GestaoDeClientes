<template>
  <q-dialog
    :value="value"
    persistent
  >
    <q-card style="width: 680px; max-width: 95vw">
      <q-card-section class="row items-center">
        <div>
          <div class="text-h6">Configuração inicial</div>
          <div class="text-caption text-grey-7">
            Conclua estas etapas para preparar o atendimento da sua equipe.
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="$emit('input', false)"
        />
      </q-card-section>

      <q-linear-progress
        :value="progress"
        color="positive"
        size="8px"
      />

      <q-list separator>
        <q-item
          v-for="step in steps"
          :key="step.id"
        >
          <q-item-section avatar>
            <q-avatar
              :color="step.done ? 'positive' : 'grey-4'"
              :text-color="step.done ? 'white' : 'grey-8'"
              :icon="step.done ? 'check' : step.icon"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ step.title }}</q-item-label>
            <q-item-label caption>{{ step.caption }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-sm">
              <q-btn
                v-if="step.routeName"
                outline
                rounded
                dense
                color="primary"
                label="Abrir"
                @click="openRoute(step.routeName)"
              />
              <q-btn
                v-if="step.id === 'testTicket' && !step.done"
                outline
                rounded
                dense
                color="positive"
                label="Marcar como testado"
                @click="markTicketTested"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-actions align="between" class="q-pa-md">
        <q-btn
          flat
          rounded
          color="primary"
          label="Atualizar checklist"
          :loading="loading"
          @click="loadStatus"
        />
        <q-btn
          rounded
          color="positive"
          label="Finalizar configuração"
          :disable="!allStepsDone"
          @click="finish"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ListarWhatsapps } from 'src/service/sessoesWhatsapp'
import { ListarFilas } from 'src/service/filas'
import { ListarUsuarios, UpdateConfiguracoesUsuarios } from 'src/service/user'

export default {
  name: 'OnboardingAdmin',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    usuario: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      loading: false,
      channelConnected: false,
      queueCreated: false,
      userCreated: false,
      ticketTested: false
    }
  },
  computed: {
    storageKey () {
      return `onboardingAdmin:${this.usuario.tenantId || 'default'}`
    },
    steps () {
      return [
        {
          id: 'channel',
          title: 'Conectar um canal',
          caption: 'Cadastre um canal e confirme o status Conectado.',
          icon: 'mdi-cellphone-wireless',
          routeName: 'sessoes',
          done: this.channelConnected
        },
        {
          id: 'queue',
          title: 'Criar uma fila',
          caption: 'Organize os atendimentos por equipe, assunto ou setor.',
          icon: 'mdi-arrow-decision-outline',
          routeName: 'filas',
          done: this.queueCreated
        },
        {
          id: 'user',
          title: 'Cadastrar um usuário',
          caption: 'Inclua ao menos um atendente além do administrador.',
          icon: 'mdi-account-plus',
          routeName: 'usuarios',
          done: this.userCreated
        },
        {
          id: 'testTicket',
          title: 'Testar um atendimento',
          caption: 'Inicie um ticket de teste, envie uma mensagem e resolva o atendimento.',
          icon: 'mdi-forum-outline',
          routeName: this.ticketTested ? null : 'atendimento',
          done: this.ticketTested
        }
      ]
    },
    progress () {
      return this.steps.filter(step => step.done).length / this.steps.length
    },
    allStepsDone () {
      return this.steps.every(step => step.done)
    }
  },
  watch: {
    value (isOpen) {
      if (isOpen) this.loadStatus()
    }
  },
  mounted () {
    this.loadStoredStatus()
    if (this.value) this.loadStatus()
  },
  methods: {
    loadStoredStatus () {
      const stored = JSON.parse(localStorage.getItem(this.storageKey) || '{}')
      const synced = this.usuario.configs?.onboardingAdmin || {}
      this.ticketTested = !!(stored.ticketTested || synced.ticketTested)
    },
    async saveStoredStatus (completed = false) {
      const onboardingAdmin = {
        ticketTested: this.ticketTested,
        completed
      }
      localStorage.setItem(this.storageKey, JSON.stringify(onboardingAdmin))

      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      const configs = {
        ...usuario.configs,
        onboardingAdmin
      }
      localStorage.setItem('usuario', JSON.stringify({ ...usuario, configs }))
      try {
        await UpdateConfiguracoesUsuarios(this.usuario.userId, { onboardingAdmin })
      } catch (error) {
        console.error(error)
        this.$notificarErro('Não foi possível sincronizar o checklist inicial', error)
      }
    },
    async loadStatus () {
      this.loadStoredStatus()
      this.loading = true
      try {
        const [channels, queues, users] = await Promise.all([
          ListarWhatsapps(),
          ListarFilas(),
          ListarUsuarios()
        ])
        this.channelConnected = channels.data.some(channel => channel.status === 'CONNECTED')
        this.queueCreated = queues.data.length > 0
        this.userCreated = users.data.users.some(user => user.id !== this.usuario.userId)
      } catch (error) {
        console.error(error)
        this.$notificarErro('Não foi possível atualizar o checklist inicial', error)
      } finally {
        this.loading = false
      }
    },
    openRoute (routeName) {
      this.$emit('input', false)
      if (this.$route.name !== routeName) {
        this.$router.push({ name: routeName })
      }
    },
    async markTicketTested () {
      this.ticketTested = true
      await this.saveStoredStatus()
    },
    async finish () {
      await this.saveStoredStatus(true)
      this.$emit('input', false)
      this.$q.notify({
        type: 'positive',
        message: 'Configuração inicial concluída.',
        position: 'top'
      })
    }
  }
}
</script>
