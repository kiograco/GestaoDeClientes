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

    <div v-else class="agenda-workspace">
      <q-card flat bordered class="agenda-card">
        <q-card-section class="agenda-toolbar">
          <q-tabs v-model="visao" dense active-color="primary" indicator-color="primary" align="left">
            <q-tab name="dia" icon="mdi-calendar-today" label="Dia" />
            <q-tab name="semana" icon="mdi-calendar-week" label="Semana" />
            <q-tab name="mes" icon="mdi-calendar-month" label="Mês" />
          </q-tabs>
          <q-space />
          <q-btn flat round dense icon="mdi-chevron-left" @click="alterarDataAgenda(-1)">
            <q-tooltip>Dia anterior</q-tooltip>
          </q-btn>
          <q-input dense outlined type="date" class="agenda-date" v-model="dataAgenda" @input="carregarTudo" />
          <q-btn flat round dense icon="mdi-chevron-right" @click="alterarDataAgenda(1)">
            <q-tooltip>Próximo dia</q-tooltip>
          </q-btn>
          <q-btn flat color="primary" icon="mdi-calendar-today" label="Hoje" @click="irParaHoje" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div v-if="visao === 'dia'" class="technician-schedule">
            <div class="schedule-grid schedule-header" :style="gridAgendaStyle">
              <div class="technician-heading">Técnico</div>
              <div v-for="hour in agendaHours" :key="hour" class="hour-heading">{{ hourLabel(hour) }}</div>
            </div>
            <div v-if="!linhasTecnicos.length" class="empty-state">
              <q-icon name="mdi-calendar-blank-outline" size="42px" color="grey-6" />
              <div>Nenhum técnico ativo para exibir na agenda.</div>
            </div>
            <div
              v-for="linha in linhasTecnicos"
              :key="linha.id || 'sem-tecnico'"
              class="schedule-grid schedule-row"
              :style="gridAgendaStyle"
            >
              <div class="technician-name" :style="{ backgroundColor: linha.color }">
                <strong>{{ linha.name }}</strong>
                <span>{{ ordensDaLinha(linha.id).length }} ordem(ns)</span>
              </div>
              <div
                v-for="hour in agendaHours"
                :key="`${linha.id || 'sem'}-${hour}`"
                class="hour-cell"
                role="button"
                :aria-label="`Reservar ${linha.name} ${hourLabel(hour)}`"
                @contextmenu="prepararMenuHorario(linha, hour)"
                @dblclick="reservarHorario(linha, hour)"
                @dragover.prevent
                @drop="soltarOrdem(linha, hour)"
              >
                <q-menu context-menu>
                  <q-list dense style="min-width: 220px">
                    <q-item clickable v-close-popup @click="reservarHorario(linha, hour)">
                      <q-item-section avatar><q-icon name="mdi-calendar-plus" /></q-item-section>
                      <q-item-section>Reservar horário</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="abrirOrdemNoHorario(linha, hour)">
                      <q-item-section avatar><q-icon name="mdi-clipboard-plus-outline" /></q-item-section>
                      <q-item-section>Nova ordem neste horário</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
              <button
                v-for="ordem in ordensDaLinha(linha.id)"
                :key="ordem.id"
                class="schedule-order"
                :aria-label="`#${ordem.id} ${ordem.title}`"
                :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
                :style="estiloOrdemAgenda(ordem)"
                draggable="true"
                @dragstart="arrastarOrdem(ordem)"
                @click="selecionarOrdem(ordem)"
                @contextmenu="prepararMenuOrdem(ordem)"
              >
                <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
                <span>{{ formatarHora(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</span>
                <span>{{ ordem.contact ? ordem.contact.name : 'Sem cliente' }}</span>
                <q-menu context-menu>
                  <q-list dense style="min-width: 260px">
                    <q-item-label header>Ordem #{{ ordem.id }}</q-item-label>
                    <q-item clickable v-close-popup @click="abrirOrdem(ordem)">
                      <q-item-section avatar><q-icon name="mdi-pencil" /></q-item-section>
                      <q-item-section>Editar ordem</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')">
                      <q-item-section avatar><q-icon name="mdi-play" /></q-item-section>
                      <q-item-section>Iniciar atendimento</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')">
                      <q-item-section avatar><q-icon name="mdi-check" /></q-item-section>
                      <q-item-section>Concluir</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="cancelarOrdem(ordem)">
                      <q-item-section avatar><q-icon name="mdi-cancel" /></q-item-section>
                      <q-item-section>Cancelar</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item-label header>Trocar técnico</q-item-label>
                    <q-item
                      v-for="tecnico in atendentes"
                      :key="tecnico.id"
                      clickable
                      v-close-popup
                      :disable="tecnico.id === ordem.attendantId"
                      @click="moverOrdemParaTecnico(ordem, tecnico)"
                    >
                      <q-item-section avatar><q-icon name="mdi-account-hard-hat-outline" /></q-item-section>
                      <q-item-section>{{ tecnico.name }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </button>
            </div>
          </div>
          <div v-else class="calendar-list">
            <button
              v-for="ordem in ordens"
              :key="ordem.id"
              class="calendar-item"
              :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
              @click="selecionarOrdem(ordem)"
              @contextmenu.prevent="prepararMenuOrdem(ordem)"
            >
              <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
              <span>{{ formatarData(ordem.scheduledStart) }} - {{ formatarData(ordem.scheduledEnd) }}</span>
              <span>{{ ordem.contact ? ordem.contact.name : '' }}</span>
            </button>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Detalhes</div>
          <div v-if="!ordemSelecionada" class="text-grey-7 q-mt-sm">Selecione uma visita no calendário.</div>
          <div v-else class="details-grid q-mt-sm">
            <div><strong>Cliente:</strong> {{ ordemSelecionada.contact && ordemSelecionada.contact.name }}</div>
            <div><strong>Técnico:</strong> {{ ordemSelecionada.attendant && ordemSelecionada.attendant.name }}</div>
            <div><strong>Status:</strong> {{ ordemSelecionada.status }}</div>
            <div><strong>Horário:</strong> {{ formatarData(ordemSelecionada.scheduledStart) }} - {{ formatarHora(ordemSelecionada.scheduledEnd) }}</div>
            <div><strong>Recorrência:</strong> {{ formatarRecorrencia(ordemSelecionada) }}</div>
            <div><strong>Endereço:</strong> {{ ordemSelecionada.address }} {{ ordemSelecionada.city }}/{{ ordemSelecionada.state }}</div>
            <div><strong>Descrição:</strong> {{ ordemSelecionada.description }}</div>
            <div><strong>Observação cliente:</strong> {{ ordemSelecionada.publicObservation }}</div>
            <div v-if="ordemSelecionada.internalObservation"><strong>Observação interna:</strong> {{ ordemSelecionada.internalObservation }}</div>
            <q-separator class="col-12" />
            <div class="row q-gutter-sm col-12">
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
          >
            <template v-slot:before-options>
              <q-item clickable @click.stop="abrirCadastroCliente">
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-account-plus-outline" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-primary text-weight-medium">Cadastrar novo cliente</q-item-label>
                  <q-item-label caption>Abre o cadastro sem fechar esta ordem</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
            <template v-slot:no-option>
              <q-item clickable @click.stop="abrirCadastroCliente">
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-account-plus-outline" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-primary text-weight-medium">Cadastrar novo cliente</q-item-label>
                  <q-item-label caption>Nenhum cliente encontrado para a busca</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select dense outlined emit-value map-options class="col-12 col-md-6" label="Técnico" v-model="form.attendantId" :options="opcoesAtendentes" />
          <q-input dense outlined class="col-12 col-md-6" label="Título" v-model="form.title" />
          <q-input dense outlined class="col-12 col-md-6" label="Tipo de serviço" v-model="form.serviceType" />
          <q-select dense outlined class="col-12 col-md-3" label="Prioridade" v-model="form.priority" :options="priorityOptions" />
          <q-select dense outlined class="col-12 col-md-3" label="Status" v-model="form.status" :options="statusOptions" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-3" label="Início" v-model="form.scheduledStart" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-3" label="Fim" v-model="form.scheduledEnd" />
          <div class="col-12">
            <q-toggle
              v-model="form.recurrenceActive"
              label="Ordem recorrente"
              @input="alternarRecorrencia"
            />
          </div>
          <q-select
            v-if="form.recurrenceActive"
            dense outlined emit-value map-options
            class="col-12 col-md-6"
            label="Tipo de recorrência"
            v-model="form.recurrenceType"
            :options="recurrenceOptions"
          />
          <q-input
            v-if="form.recurrenceActive && form.recurrenceType === 'monthly_fixed_day'"
            dense outlined type="number"
            class="col-12 col-md-3"
            label="Dia fixo do mês"
            v-model.number="form.recurrenceDayOfMonth"
            min="1"
            max="31"
          />
          <q-input
            v-if="form.recurrenceActive && form.recurrenceType === 'custom_interval'"
            dense outlined type="number"
            class="col-12 col-md-3"
            label="A cada (dias)"
            v-model.number="form.recurrenceIntervalDays"
            min="1"
            max="365"
          />
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

    <ClienteModal
      v-model="modalCliente"
      :contactId="selectedContactId"
      @saved="clienteSalvo"
    />
  </q-page>
</template>

<script>
import { socketIO } from 'src/utils/socket'
import { ListarClientes } from 'src/service/clientes'
import ClienteModal from 'src/pages/clientes/ClienteModal'
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

const localDateInput = (value = new Date()) => {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

const emptyForm = () => ({
  contactId: null,
  attendantId: null,
  title: '',
  description: '',
  serviceType: '',
  priority: 'baixa',
  status: 'rascunho',
  recurrenceActive: false,
  recurrenceType: 'single',
  recurrenceDayOfMonth: null,
  recurrenceIntervalDays: 30,
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
  components: { ClienteModal },
  data () {
    return {
      visao: 'dia',
      aba: 'agenda',
      salvando: false,
      dataAgenda: localDateInput(),
      modalOrdem: false,
      modalAtendente: false,
      modalNotificacao: false,
      modalCliente: false,
      selectedContactId: null,
      form: emptyForm(),
      atendente: { active: true },
      notificacao: { channels: ['internal'], message: '' },
      ordens: [],
      atendentes: [],
      clientes: [],
      ordemSelecionada: null,
      ordemArrastada: null,
      contextHorario: null,
      dashboard: {},
      filtros: {},
      priorityOptions: ['baixa', 'media', 'alta', 'urgente'],
      statusOptions: ['rascunho', 'agendada', 'em_atendimento', 'concluida', 'cancelada', 'reagendada'],
      recurrenceOptions: [
        { label: 'Dia fixo todo mês', value: 'monthly_fixed_day' },
        { label: 'Intervalo em dias', value: 'custom_interval' }
      ],
      notificationOptions: [
        { label: 'Interna', value: 'internal' },
        { label: 'E-mail', value: 'email' },
        { label: 'WhatsApp', value: 'whatsapp' }
      ],
      agendaStartHour: 0,
      agendaEndHour: 23
    }
  },
  computed: {
    opcoesAtendentes () {
      return this.atendentes.map(item => ({ label: item.name, value: item.id }))
    },
    agendaHours () {
      return Array.from(
        { length: this.agendaEndHour - this.agendaStartHour + 1 },
        (_, index) => index + this.agendaStartHour
      )
    },
    gridAgendaStyle () {
      return {
        gridTemplateColumns: `150px repeat(${this.agendaHours.length}, minmax(48px, 1fr))`
      }
    },
    linhasTecnicos () {
      const colors = ['#bae6fd', '#bbf7d0', '#fed7aa', '#fde68a', '#99f6e4', '#fbcfe8', '#ddd6fe', '#fecaca']
      const linhas = this.atendentes.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }))
      if (this.ordens.some(ordem => this.mesmoDiaAgenda(ordem.scheduledStart) && !ordem.attendantId)) {
        linhas.push({ id: null, name: 'Sem técnico', color: '#e5e7eb' })
      }
      return linhas
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
      const params = { ...this.filtros }
      if (this.visao === 'dia') {
        const start = this.dataHoraAgenda(this.agendaStartHour)
        const end = this.dataHoraAgenda(this.agendaEndHour + 1)
        params.start = start.toISOString()
        params.end = end.toISOString()
      }
      const { data } = await ListarOrdensServico(params)
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
        this.clientes = data.map(this.formatarOpcaoCliente)
      })
    },
    formatarOpcaoCliente (cliente) {
      return {
        label: `${cliente.name} - ${cliente.number || cliente.email || ''}`,
        value: cliente.id
      }
    },
    abrirCadastroCliente () {
      this.selectedContactId = null
      this.modalCliente = true
    },
    clienteSalvo (cliente) {
      const opcao = this.formatarOpcaoCliente(cliente)
      const index = this.clientes.findIndex(item => item.value === opcao.value)
      if (index === -1) this.clientes.unshift(opcao)
      else this.$set(this.clientes, index, opcao)
      this.form.contactId = opcao.value
    },
    abrirOrdem (ordem) {
      this.form = ordem
        ? {
          ...emptyForm(),
          ...ordem,
          recurrenceActive: Boolean(ordem.recurrenceActive || (ordem.recurrenceType && ordem.recurrenceType !== 'single')),
          recurrenceType: ordem.recurrenceType || 'single',
          recurrenceDayOfMonth: ordem.recurrenceDayOfMonth || null,
          recurrenceIntervalDays: ordem.recurrenceIntervalDays || 30,
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
        const payload = this.normalizarDatasPayload({ ...this.form, status })
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
    async alterarStatusOrdem (ordem, status) {
      this.ordemSelecionada = ordem
      await this.salvarStatus({ ...ordem, status })
    },
    confirmarCancelamento () {
      this.$q.dialog({
        title: 'Cancelar ordem',
        message: 'Confirma o cancelamento desta ordem de serviço?',
        cancel: true,
        persistent: true
      }).onOk(() => this.salvarStatus({ ...this.ordemSelecionada, status: 'cancelada' }))
    },
    cancelarOrdem (ordem) {
      this.ordemSelecionada = ordem
      this.confirmarCancelamento()
    },
    async salvarStatus (payload) {
      try {
        const { data } = await AlterarOrdemServico(this.normalizarDatasPayload(payload))
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
    async soltarOrdem (linha, hour) {
      if (!this.ordemArrastada) return
      const originalStart = new Date(this.ordemArrastada.scheduledStart)
      const originalEnd = new Date(this.ordemArrastada.scheduledEnd)
      const duration = originalEnd - originalStart
      const nextStart = this.dataHoraAgenda(hour)
      const nextEnd = new Date(nextStart.getTime() + duration)
      await this.salvarStatus({
        ...this.ordemArrastada,
        attendantId: linha.id,
        scheduledStart: this.toInputDate(nextStart),
        scheduledEnd: this.toInputDate(nextEnd),
        status: this.ordemArrastada.status === 'agendada' ? 'reagendada' : this.ordemArrastada.status
      })
      this.ordemArrastada = null
    },
    async moverOrdemParaTecnico (ordem, tecnico) {
      await this.salvarStatus({
        ...ordem,
        attendantId: tecnico.id,
        attendant: tecnico,
        status: ordem.status === 'agendada' ? 'reagendada' : ordem.status
      })
    },
    prepararMenuHorario (linha, hour) {
      this.contextHorario = { linha, hour }
      this.ordemSelecionada = null
    },
    prepararMenuOrdem (ordem) {
      this.ordemSelecionada = ordem
    },
    reservarHorario (linha, hour) {
      this.abrirOrdemNoHorario(linha, hour, {
        title: 'Reserva de horário',
        serviceType: 'Reserva',
        status: 'rascunho'
      })
    },
    abrirOrdemNoHorario (linha, hour, overrides = {}) {
      const start = this.dataHoraAgenda(hour)
      const end = new Date(start.getTime())
      end.setHours(end.getHours() + 1)
      this.form = {
        ...emptyForm(),
        ...overrides,
        attendantId: linha.id,
        scheduledStart: this.toInputDate(start),
        scheduledEnd: this.toInputDate(end)
      }
      this.modalOrdem = true
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
    mesmoDiaAgenda (value) {
      if (!value) return false
      return localDateInput(value) === this.dataAgenda
    },
    ordensDaLinha (attendantId) {
      return this.ordens.filter(ordem => (
        this.mesmoDiaAgenda(ordem.scheduledStart) &&
        (ordem.attendantId || null) === (attendantId || null)
      ))
    },
    estiloOrdemAgenda (ordem) {
      const start = new Date(ordem.scheduledStart)
      const end = new Date(ordem.scheduledEnd)
      const startHour = start.getHours() + (start.getMinutes() / 60)
      const durationHours = Math.max(0.5, (end - start) / 3600000)
      const clampedStart = Math.max(this.agendaStartHour, Math.floor(startHour))
      const offset = Math.max(0, startHour - clampedStart)
      const span = Math.max(1, Math.ceil(offset + durationHours))
      return {
        gridColumn: `${clampedStart - this.agendaStartHour + 2} / span ${span}`,
        marginLeft: `${offset * 100}%`
      }
    },
    dataHoraAgenda (hour) {
      const date = new Date(`${this.dataAgenda}T00:00:00`)
      date.setHours(hour, 0, 0, 0)
      return date
    },
    alterarDataAgenda (days) {
      const date = new Date(`${this.dataAgenda}T00:00:00`)
      date.setDate(date.getDate() + days)
      this.dataAgenda = localDateInput(date)
      this.carregarTudo()
    },
    irParaHoje () {
      this.dataAgenda = localDateInput()
      this.carregarTudo()
    },
    hourLabel (hour) {
      return `${String(hour).padStart(2, '0')}:00`
    },
    formatarHora (value) {
      if (!value) return ''
      return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    },
    formatarData (value) {
      if (!value) return ''
      return new Date(value).toLocaleString('pt-BR')
    },
    formatarRecorrencia (ordem) {
      if (!ordem || !ordem.recurrenceActive || ordem.recurrenceType === 'single') return 'Avulsa'
      if (ordem.recurrenceType === 'monthly_fixed_day') return `Todo mês no dia ${ordem.recurrenceDayOfMonth}`
      if (ordem.recurrenceType === 'custom_interval') return `A cada ${ordem.recurrenceIntervalDays} dia(s)`
      return 'Avulsa'
    },
    alternarRecorrencia (active) {
      if (!active) {
        this.form.recurrenceType = 'single'
        this.form.recurrenceDayOfMonth = null
        this.form.recurrenceIntervalDays = null
        return
      }
      if (this.form.recurrenceType === 'single') this.form.recurrenceType = 'monthly_fixed_day'
      if (!this.form.recurrenceDayOfMonth) {
        const start = this.form.scheduledStart ? new Date(this.form.scheduledStart) : new Date()
        this.form.recurrenceDayOfMonth = start.getDate()
      }
      if (!this.form.recurrenceIntervalDays) this.form.recurrenceIntervalDays = 30
    },
    toInputDate (value) {
      if (!value) return ''
      const date = new Date(value)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      return date.toISOString().slice(0, 16)
    },
    toApiDate (value) {
      if (!value) return null
      return new Date(value).toISOString()
    },
    normalizarDatasPayload (payload) {
      return {
        ...payload,
        ...this.normalizarRecorrenciaPayload(payload),
        scheduledStart: this.toApiDate(payload.scheduledStart),
        scheduledEnd: this.toApiDate(payload.scheduledEnd)
      }
    },
    normalizarRecorrenciaPayload (payload) {
      if (!payload.recurrenceActive || payload.recurrenceType === 'single') {
        return {
          recurrenceActive: false,
          recurrenceType: 'single',
          recurrenceDayOfMonth: null,
          recurrenceIntervalDays: null
        }
      }
      if (payload.recurrenceType === 'custom_interval') {
        return {
          recurrenceActive: true,
          recurrenceType: 'custom_interval',
          recurrenceDayOfMonth: null,
          recurrenceIntervalDays: Number(payload.recurrenceIntervalDays)
        }
      }
      return {
        recurrenceActive: true,
        recurrenceType: 'monthly_fixed_day',
        recurrenceDayOfMonth: Number(payload.recurrenceDayOfMonth),
        recurrenceIntervalDays: null
      }
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
.agenda-workspace {
  display: grid;
  gap: 16px;
}
.agenda-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.agenda-date {
  width: 168px;
}
.agenda-card {
  overflow: hidden;
}
.technician-schedule {
  overflow-x: auto;
  border: 1px solid #d7dde7;
  border-radius: 8px;
}
.schedule-grid {
  display: grid;
  min-width: 1280px;
}
.schedule-header {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #f8fafc;
  border-bottom: 1px solid #cbd5e1;
}
.technician-heading,
.hour-heading {
  min-height: 36px;
  padding: 8px;
  border-right: 1px solid #d7dde7;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.technician-heading {
  text-align: left;
}
.schedule-row {
  min-height: 82px;
  border-bottom: 1px solid #d7dde7;
}
.technician-name {
  grid-column: 1;
  grid-row: 1;
  display: grid;
  align-content: center;
  gap: 2px;
  padding: 10px;
  border-right: 1px solid #cbd5e1;
  color: #111827;
}
.technician-name span {
  color: #475569;
  font-size: 12px;
}
.hour-cell {
  grid-row: 1;
  min-height: 82px;
  border-right: 1px solid #d7dde7;
  background: #fff;
  cursor: context-menu;
}
.hour-cell:nth-child(even) {
  background: #f8fafc;
}
.visit-block,
.calendar-item,
.schedule-order {
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
.schedule-order {
  grid-row: 1;
  z-index: 3;
  align-self: center;
  min-height: 54px;
  max-height: 72px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .12);
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
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 16px;
}
.status-em_atendimento { border-left-color: #d97706; background: #fffbeb; }
.status-concluida { border-left-color: #16a34a; background: #f0fdf4; }
.status-cancelada { border-left-color: #dc2626; background: #fef2f2; }
.status-reagendada { border-left-color: #7c3aed; background: #f5f3ff; }
.urgente {
  box-shadow: inset 0 0 0 2px #dc2626;
}
@media (max-width: 700px) {
  .agenda-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .agenda-date {
    width: 100%;
  }
}
</style>
