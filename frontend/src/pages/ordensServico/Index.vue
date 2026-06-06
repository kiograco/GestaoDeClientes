<template>
  <q-page padding class="service-orders-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-medium">Ordens de Serviço</div>
        <div class="text-caption text-grey-7">Agenda de visitas, técnicos e histórico operacional</div>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn unelevated color="primary" icon="mdi-account-hard-hat-outline" label="Técnico" @click="abrirAtendente()" />
        <q-btn unelevated color="primary" icon="mdi-calendar-plus" label="Nova ordem" @click="abrirOrdem()" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <q-select dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Técnico" v-model="filtros.attendantId" :options="opcoesAtendentes" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Status" v-model="filtros.status" :options="statusOptions" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Prioridade" v-model="filtros.priority" :options="priorityOptions" @input="carregarOrdens" />
        <q-input dense outlined clearable class="col-12 col-md-3" label="Tipo de serviço" v-model="filtros.serviceType" @keyup.enter="carregarOrdens" />
        <q-btn flat color="primary" icon="mdi-refresh" class="col-12 col-md-auto" label="Atualizar" @click="carregarTudo" />
      </q-card-section>
    </q-card>

    <q-tabs v-model="aba" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md">
      <q-tab name="agenda" icon="mdi-calendar-clock" label="Agenda" />
      <q-tab name="dashboard" icon="mdi-chart-box-outline" label="Dashboard" />
    </q-tabs>

    <div v-if="aba === 'dashboard'" class="dashboard-grid q-mb-md">
      <q-card v-for="card in dashboardCards" :key="card.label" flat bordered>
        <q-card-section>
          <div class="text-caption text-grey-7">{{ card.label }}</div>
          <div class="text-h5 text-weight-medium">{{ card.value }}</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Por status</div>
          <div v-for="item in dashboardList(dashboard.byStatus)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Técnicos com mais visitas</div>
          <div v-for="item in dashboardList(dashboard.byAttendant)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Serviços mais solicitados</div>
          <div v-for="item in dashboardList(dashboard.byServiceType)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-lg-7">
        <q-card flat bordered>
          <q-tabs v-model="visao" dense active-color="primary" indicator-color="primary" align="left">
            <q-tab name="dia" icon="mdi-calendar-today" label="Dia" />
            <q-tab name="semana" icon="mdi-calendar-week" label="Semana" />
            <q-tab name="mes" icon="mdi-calendar-month" label="Mês" />
          </q-tabs>
          <q-separator />
          <q-card-section>
            <div v-if="!ordens.length" class="empty-state">
              <q-icon name="mdi-calendar-blank-outline" size="42px" color="grey-6" />
              <div>Nenhuma visita agendada para os filtros atuais.</div>
            </div>
            <div v-else-if="visao === 'dia'" class="day-grid">
              <div v-for="hour in hours" :key="hour" class="time-row">
                <div class="time-label">{{ hour }}:00</div>
                <div class="time-slot" @dragover.prevent @drop="soltarOrdem(hour)">
                  <button
                    v-for="ordem in ordensPorHora(hour)"
                    :key="ordem.id"
                    class="visit-block"
                    :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
                    :style="estiloBloco(ordem)"
                    draggable="true"
                    @dragstart="arrastarOrdem(ordem)"
                    @click="selecionarOrdem(ordem)"
                  >
                    <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
                    <span>{{ formatarHora(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</span>
                    <span>{{ ordem.attendant ? ordem.attendant.name : 'Sem técnico' }}</span>
                    <span class="resize-actions" @click.stop>
                      <q-btn dense flat round size="sm" icon="mdi-minus" @click="redimensionarOrdem(ordem, -30)" />
                      <q-btn dense flat round size="sm" icon="mdi-plus" @click="redimensionarOrdem(ordem, 30)" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="calendar-list">
              <button
                v-for="ordem in ordens"
                :key="ordem.id"
                class="calendar-item"
                :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
                @click="selecionarOrdem(ordem)"
              >
                <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
                <span>{{ formatarData(ordem.scheduledStart) }} - {{ formatarData(ordem.scheduledEnd) }}</span>
                <span>{{ ordem.contact ? ordem.contact.name : '' }}</span>
              </button>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">Detalhes</div>
            <div v-if="!ordemSelecionada" class="text-grey-7 q-mt-sm">Selecione uma visita no calendário.</div>
            <div v-else class="q-gutter-sm q-mt-sm">
              <div><strong>Cliente:</strong> {{ ordemSelecionada.contact && ordemSelecionada.contact.name }}</div>
              <div><strong>Técnico:</strong> {{ ordemSelecionada.attendant && ordemSelecionada.attendant.name }}</div>
              <div><strong>Status:</strong> {{ ordemSelecionada.status }}</div>
              <div><strong>Endereço:</strong> {{ ordemSelecionada.address }} {{ ordemSelecionada.city }}/{{ ordemSelecionada.state }}</div>
              <div><strong>Descrição:</strong> {{ ordemSelecionada.description }}</div>
              <div><strong>Observação cliente:</strong> {{ ordemSelecionada.publicObservation }}</div>
              <div v-if="ordemSelecionada.internalObservation"><strong>Observação interna:</strong> {{ ordemSelecionada.internalObservation }}</div>
              <q-separator />
              <div class="row q-gutter-sm">
                <q-btn dense flat color="primary" icon="mdi-pencil" label="Editar" @click="abrirOrdem(ordemSelecionada)" />
                <q-btn dense flat color="amber-9" icon="mdi-play" label="Iniciar" @click="alterarStatus('em_atendimento')" />
                <q-btn dense flat color="positive" icon="mdi-check" label="Concluir" @click="alterarStatus('concluida')" />
                <q-btn dense flat color="negative" icon="mdi-cancel" label="Cancelar" @click="confirmarCancelamento" />
                <q-btn dense flat color="primary" icon="mdi-file-pdf-box" label="PDF cliente" @click="abrirPdf(false)" />
                <q-btn v-if="podeVerObservacaoInterna" dense flat color="primary" icon="mdi-file-document-alert-outline" label="PDF interno" @click="abrirPdf(true)" />
                <q-btn dense flat color="primary" icon="mdi-send" label="Notificar" @click="modalNotificacao = true" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="modalOrdem" persistent>
      <q-card style="width: 920px; max-width: 96vw">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ form.id ? 'Editar ordem' : 'Nova ordem' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-sm">
          <q-select
            dense outlined use-input fill-input hide-selected input-debounce="300"
            class="col-12 col-md-6"
            label="Cliente"
            v-model="form.contactId"
            emit-value map-options
            :options="clientes"
            @filter="filtrarClientes"
          />
          <q-select dense outlined emit-value map-options class="col-12 col-md-6" label="Técnico" v-model="form.attendantId" :options="opcoesAtendentes" />
          <q-input dense outlined class="col-12 col-md-6" label="Título" v-model="form.title" />
          <q-input dense outlined class="col-12 col-md-6" label="Tipo de serviço" v-model="form.serviceType" />
          <q-select dense outlined class="col-12 col-md-3" label="Prioridade" v-model="form.priority" :options="priorityOptions" />
          <q-select dense outlined class="col-12 col-md-3" label="Status" v-model="form.status" :options="statusOptions" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-3" label="Início" v-model="form.scheduledStart" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-3" label="Fim" v-model="form.scheduledEnd" />
          <q-input dense outlined class="col-12 col-md-6" label="Endereço" v-model="form.address" />
          <q-input dense outlined class="col-12 col-md-3" label="Cidade" v-model="form.city" />
          <q-input dense outlined maxlength="2" class="col-12 col-md-1" label="UF" v-model="form.state" />
          <q-input dense outlined mask="#####-###" class="col-12 col-md-2" label="CEP" v-model="form.zipCode" />
          <q-input dense outlined type="textarea" class="col-12" label="Descrição" v-model="form.description" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observação para o cliente" v-model="form.publicObservation" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observação interna" v-model="form.internalObservation" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar rascunho" color="primary" :loading="salvando" @click="salvarOrdem('rascunho')" />
          <q-btn unelevated label="Agendar" color="positive" :loading="salvando" @click="salvarOrdem('agendada')" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalAtendente">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ atendente.id ? 'Editar técnico' : 'Novo técnico' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input dense outlined label="Nome" v-model="atendente.name" />
          <q-input dense outlined label="E-mail" v-model="atendente.email" />
          <q-input dense outlined mask="(##) #####-####" label="Telefone" v-model="atendente.phone" />
          <q-input dense outlined label="Especialidade" v-model="atendente.specialty" />
          <q-toggle label="Ativo" v-model="atendente.active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarAtendente" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalNotificacao">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Notificar cliente</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-option-group
            v-model="notificacao.channels"
            type="checkbox"
            :options="notificationOptions"
          />
          <q-input dense outlined type="textarea" label="Mensagem pública" v-model="notificacao.message" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Enviar" color="primary" :loading="salvando" @click="enviarNotificacao" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { socketIO } from 'src/utils/socket'
import { ListarClientes } from 'src/service/clientes'
import {
  ListarAtendentesServico,
  CriarAtendenteServico,
  AlterarAtendenteServico,
  ListarOrdensServico,
  DashboardOrdensServico,
  CriarOrdemServico,
  AlterarOrdemServico,
  DocumentoOrdemServico,
  DocumentoInternoOrdemServico,
  NotificarOrdemServico
} from 'src/service/ordensServico'

const socket = socketIO()

const emptyForm = () => ({
  contactId: null,
  attendantId: null,
  title: '',
  description: '',
  serviceType: '',
  priority: 'baixa',
  status: 'rascunho',
  scheduledStart: '',
  scheduledEnd: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  publicObservation: '',
  internalObservation: ''
})

export default {
  name: 'OrdensServico',
  data () {
    return {
      visao: 'dia',
      aba: 'agenda',
      salvando: false,
      modalOrdem: false,
      modalAtendente: false,
      modalNotificacao: false,
      form: emptyForm(),
      atendente: { active: true },
      notificacao: { channels: ['internal'], message: '' },
      ordens: [],
      atendentes: [],
      clientes: [],
      ordemSelecionada: null,
      ordemArrastada: null,
      dashboard: {},
      filtros: {},
      priorityOptions: ['baixa', 'media', 'alta', 'urgente'],
      statusOptions: ['rascunho', 'agendada', 'em_atendimento', 'concluida', 'cancelada', 'reagendada'],
      notificationOptions: [
        { label: 'Interna', value: 'internal' },
        { label: 'E-mail', value: 'email' },
        { label: 'WhatsApp', value: 'whatsapp' }
      ],
      hours: Array.from({ length: 15 }, (_, index) => index + 7)
    }
  },
  computed: {
    opcoesAtendentes () {
      return this.atendentes.map(item => ({ label: item.name, value: item.id }))
    },
    dashboardCards () {
      return [
        { label: 'Total', value: this.dashboard.total || 0 },
        { label: 'Agendadas', value: this.dashboard.scheduled || 0 },
        { label: 'Concluídas', value: this.dashboard.completed || 0 },
        { label: 'Canceladas', value: this.dashboard.canceled || 0 },
        { label: 'Atrasadas', value: this.dashboard.late || 0 },
        { label: 'Tempo médio', value: `${this.dashboard.averageServiceMinutes || 0} min` },
        { label: 'Taxa cancelamento', value: `${this.dashboard.cancellationRate || 0}%` }
      ]
    },
    podeVerObservacaoInterna () {
      return ['admin', 'superadmin', 'supervisor', 'atendente', 'tecnico'].includes(localStorage.getItem('profile'))
    }
  },
  methods: {
    async carregarTudo () {
      await Promise.all([this.carregarAtendentes(), this.carregarOrdens(), this.carregarDashboard()])
    },
    async carregarAtendentes () {
      const { data } = await ListarAtendentesServico()
      this.atendentes = data
    },
    async carregarOrdens () {
      const { data } = await ListarOrdensServico(this.filtros)
      this.ordens = data
      await this.carregarDashboard()
    },
    async carregarDashboard () {
      const { data } = await DashboardOrdensServico(this.filtros)
      this.dashboard = data
    },
    async filtrarClientes (val, update) {
      const { data } = await ListarClientes({ searchParam: val })
      update(() => {
        this.clientes = data.map(item => ({ label: `${item.name} - ${item.number || item.email || ''}`, value: item.id }))
      })
    },
    abrirOrdem (ordem) {
      this.form = ordem
        ? {
          ...ordem,
          scheduledStart: this.toInputDate(ordem.scheduledStart),
          scheduledEnd: this.toInputDate(ordem.scheduledEnd)
        }
        : emptyForm()
      this.modalOrdem = true
    },
    abrirAtendente (atendente) {
      this.atendente = atendente ? { ...atendente } : { active: true }
      this.modalAtendente = true
    },
    async salvarAtendente () {
      this.salvando = true
      try {
        if (this.atendente.id) await AlterarAtendenteServico(this.atendente)
        else await CriarAtendenteServico(this.atendente)
        this.$q.notify({ type: 'positive', message: 'Técnico salvo.' })
        this.modalAtendente = false
        await this.carregarAtendentes()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o técnico', error)
      } finally {
        this.salvando = false
      }
    },
    async salvarOrdem (status) {
      this.salvando = true
      try {
        const payload = { ...this.form, status }
        const response = payload.id ? await AlterarOrdemServico(payload) : await CriarOrdemServico(payload)
        this.$q.notify({ type: 'positive', message: 'Ordem de serviço salva.' })
        this.modalOrdem = false
        this.ordemSelecionada = response.data
        await this.carregarOrdens()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar a ordem de serviço', error)
      } finally {
        this.salvando = false
      }
    },
    selecionarOrdem (ordem) {
      this.ordemSelecionada = ordem
    },
    async alterarStatus (status) {
      if (!this.ordemSelecionada) return
      await this.salvarStatus({ ...this.ordemSelecionada, status })
    },
    confirmarCancelamento () {
      this.$q.dialog({
        title: 'Cancelar ordem',
        message: 'Confirma o cancelamento desta ordem de serviço?',
        cancel: true,
        persistent: true
      }).onOk(() => this.salvarStatus({ ...this.ordemSelecionada, status: 'cancelada' }))
    },
    async salvarStatus (payload) {
      try {
        const { data } = await AlterarOrdemServico(payload)
        this.ordemSelecionada = data
        await this.carregarOrdens()
      } catch (error) {
        this.$notificarErro('Não foi possível alterar o status', error)
      }
    },
    async abrirPdf (interno) {
      if (!this.ordemSelecionada) return
      try {
        const { data } = interno
          ? await DocumentoInternoOrdemServico(this.ordemSelecionada.id)
          : await DocumentoOrdemServico(this.ordemSelecionada.id)
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        window.open(url, '_blank')
      } catch (error) {
        this.$notificarErro('Não foi possível gerar o PDF', error)
      }
    },
    async enviarNotificacao () {
      if (!this.ordemSelecionada) return
      this.salvando = true
      try {
        const { data } = await NotificarOrdemServico(this.ordemSelecionada.id, this.notificacao)
        const falhas = Object.keys(data.failed || {})
        this.$q.notify({
          type: falhas.length ? 'warning' : 'positive',
          message: falhas.length ? `Notificação parcial. Falhas: ${falhas.join(', ')}` : 'Notificação enviada.'
        })
        this.modalNotificacao = false
      } catch (error) {
        this.$notificarErro('Não foi possível enviar a notificação', error)
      } finally {
        this.salvando = false
      }
    },
    arrastarOrdem (ordem) {
      this.ordemArrastada = ordem
    },
    async soltarOrdem (hour) {
      if (!this.ordemArrastada) return
      const originalStart = new Date(this.ordemArrastada.scheduledStart)
      const originalEnd = new Date(this.ordemArrastada.scheduledEnd)
      const duration = originalEnd - originalStart
      const nextStart = new Date(originalStart)
      nextStart.setHours(hour, 0, 0, 0)
      const nextEnd = new Date(nextStart.getTime() + duration)
      await this.salvarStatus({
        ...this.ordemArrastada,
        scheduledStart: this.toInputDate(nextStart),
        scheduledEnd: this.toInputDate(nextEnd),
        status: this.ordemArrastada.status === 'agendada' ? 'reagendada' : this.ordemArrastada.status
      })
      this.ordemArrastada = null
    },
    async redimensionarOrdem (ordem, minutes) {
      const end = new Date(ordem.scheduledEnd)
      end.setMinutes(end.getMinutes() + minutes)
      if (end <= new Date(ordem.scheduledStart)) return
      await this.salvarStatus({ ...ordem, scheduledEnd: this.toInputDate(end) })
    },
    dashboardList (source) {
      return Object.entries(source || {})
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    },
    ordensPorHora (hour) {
      return this.ordens.filter(ordem => new Date(ordem.scheduledStart).getHours() === hour)
    },
    estiloBloco (ordem) {
      const start = new Date(ordem.scheduledStart)
      const end = new Date(ordem.scheduledEnd)
      const duration = Math.max(30, (end - start) / 60000)
      return { minHeight: `${Math.min(160, duration)}px` }
    },
    formatarHora (value) {
      if (!value) return ''
      return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    },
    formatarData (value) {
      if (!value) return ''
      return new Date(value).toLocaleString('pt-BR')
    },
    toInputDate (value) {
      if (!value) return ''
      const date = new Date(value)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      return date.toISOString().slice(0, 16)
    },
    conectarSocket () {
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      if (!usuario?.tenantId) return
      socket.on(`${usuario.tenantId}:serviceOrders`, () => this.carregarOrdens())
    }
  },
  async mounted () {
    await this.carregarTudo()
    this.conectarSocket()
  },
  destroyed () {
    socket.disconnect()
  }
}
</script>

<style scoped>
.empty-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 8px;
  color: #6b7280;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}
.dashboard-panel {
  min-height: 190px;
}
.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #eef2f7;
}
.day-grid {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.time-row {
  display: grid;
  grid-template-columns: 64px 1fr;
  min-height: 72px;
  border-bottom: 1px solid #eef2f7;
}
.time-label {
  padding: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}
.time-slot {
  padding: 6px;
  display: grid;
  gap: 6px;
}
.visit-block,
.calendar-item {
  width: 100%;
  text-align: left;
  border: 0;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
  padding: 8px;
  display: grid;
  gap: 2px;
  background: #eff6ff;
  cursor: pointer;
}
.resize-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}
.calendar-list {
  display: grid;
  gap: 8px;
}
.status-em_atendimento { border-left-color: #d97706; background: #fffbeb; }
.status-concluida { border-left-color: #16a34a; background: #f0fdf4; }
.status-cancelada { border-left-color: #dc2626; background: #fef2f2; }
.status-reagendada { border-left-color: #7c3aed; background: #f5f3ff; }
.urgente {
  box-shadow: inset 0 0 0 2px #dc2626;
}
</style>
