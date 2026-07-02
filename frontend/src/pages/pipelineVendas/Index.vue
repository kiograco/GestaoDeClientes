<template>
  <q-page padding class="sales-pipeline-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-medium">Pipeline de vendas</div>
        <div class="text-caption text-grey-7">Leads, oportunidades, previsao de fechamento e conversao em OS</div>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarTudo" />
        <q-btn flat color="warning" icon="mdi-bell-ring-outline" label="Follow-up" @click="executarFollowUpAutomatico" />
        <q-btn flat color="secondary" icon="mdi-target" label="Meta" @click="abrirMeta()" />
        <q-btn unelevated color="primary" icon="mdi-plus" label="Nova oportunidade" @click="abrirOportunidade()" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <q-input dense outlined clearable class="col-12 col-md-4" label="Buscar" v-model="filtros.search" @keyup.enter="carregarOportunidades" />
        <q-select dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Etapa" v-model="filtros.stage" :options="stageOptions" @input="carregarOportunidades" />
        <q-select dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Responsavel" v-model="filtros.ownerUserId" :options="ownerOptions" @input="carregarOportunidades" />
      </q-card-section>
    </q-card>

    <div class="dashboard-grid q-mb-md">
      <q-card v-for="card in dashboardCards" :key="card.label" flat bordered>
        <q-card-section>
          <div class="text-caption text-grey-7">{{ card.label }}</div>
          <div class="text-h5 text-weight-medium">{{ card.value }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-subtitle1 text-weight-medium">Metas do mes</div>
          <div class="text-caption text-grey-7">Vendedores por oportunidades ganhas e tecnicos por OS concluidas</div>
        </div>
        <div class="col-12 col-md-auto text-right">
          <div class="text-caption text-grey-7">Realizado</div>
          <div class="text-h6">{{ metasDashboard.totals ? metasDashboard.totals.achievedCount : 0 }} / {{ metasDashboard.totals ? metasDashboard.totals.targetCount : 0 }}</div>
        </div>
        <div class="col-12">
          <q-markup-table flat dense>
            <thead>
              <tr>
                <th class="text-left">Perfil</th>
                <th class="text-left">Responsavel</th>
                <th class="text-right">Qtd.</th>
                <th class="text-right">Valor</th>
                <th class="text-right">Progresso</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="linha in metasDashboard.goals || []" :key="linha.id">
                <td>{{ linha.roleType === 'seller' ? 'Vendedor' : 'Tecnico' }}</td>
                <td>{{ linha.user ? linha.user.name : (linha.attendant ? linha.attendant.name : '-') }}</td>
                <td class="text-right">{{ linha.achievedCount }} / {{ linha.targetCount }}</td>
                <td class="text-right">{{ formatarMoeda(linha.achievedValue) }} / {{ formatarMoeda(linha.targetValue) }}</td>
                <td class="text-right">{{ Math.max(linha.countProgress, linha.valueProgress) }}%</td>
              </tr>
              <tr v-if="!(metasDashboard.goals || []).length">
                <td colspan="5" class="text-center text-grey-7">Nenhuma meta cadastrada para o mes.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </q-card-section>
    </q-card>

    <div class="pipeline-board">
      <div v-for="stage in stages" :key="stage.value" class="pipeline-column">
        <div class="pipeline-column-header">
          <div>
            <div class="text-subtitle2 text-weight-medium">{{ stage.label }}</div>
            <div class="text-caption text-grey-7">{{ oportunidadesPorEtapa(stage.value).length }} oportunidade(s)</div>
          </div>
          <q-badge color="primary" outline>{{ formatarMoeda(valorEtapa(stage.value)) }}</q-badge>
        </div>
        <q-card
          v-for="item in oportunidadesPorEtapa(stage.value)"
          :key="item.id"
          flat
          bordered
          class="pipeline-card"
        >
          <q-card-section>
            <div class="row items-start no-wrap">
              <div class="col">
                <div class="text-subtitle2 text-weight-medium">#{{ item.id }} {{ item.title }}</div>
                <div class="text-caption text-grey-7">{{ item.contact ? item.contact.name : '-' }}</div>
              </div>
              <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirOportunidade(item)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
            </div>
            <div class="pipeline-card-meta q-mt-sm">
              <span>{{ formatarMoeda(item.estimatedValue) }}</span>
              <span>{{ formatarData(item.expectedCloseDate) }}</span>
            </div>
            <div class="text-caption q-mt-sm">{{ item.owner ? item.owner.name : 'Sem responsavel' }}</div>
          </q-card-section>
          <q-card-actions align="between">
            <q-btn-dropdown dense flat no-caps color="primary" icon="mdi-swap-horizontal" label="Etapa">
              <q-list>
                <q-item v-for="option in stageOptions" :key="option.value" clickable v-close-popup @click="moverEtapa(item, option.value)">
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
            <q-btn dense flat color="primary" icon="mdi-file-document-edit-outline" label="Proposta" @click="abrirProposta(item)" />
            <q-btn v-if="item.stage !== 'ganho' || !item.convertedServiceOrderId" dense flat color="positive" icon="mdi-clipboard-plus-outline" label="OS" @click="abrirConversao(item)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="modalOportunidade" persistent>
      <q-card style="width: 760px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ oportunidade.id ? 'Editar oportunidade' : 'Nova oportunidade' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-select dense outlined emit-value map-options use-input input-debounce="400" class="col-12 col-md-6" label="Cliente" v-model="oportunidade.contactId" :options="clienteOptions" @filter="filtrarClientes" />
          <q-select dense outlined emit-value map-options clearable class="col-12 col-md-6" label="Responsavel" v-model="oportunidade.ownerUserId" :options="ownerOptions" />
          <q-input dense outlined class="col-12 col-md-8" label="Titulo" v-model="oportunidade.title" />
          <q-select dense outlined emit-value map-options class="col-12 col-md-4" label="Etapa" v-model="oportunidade.stage" :options="stageOptions" />
          <q-input dense outlined class="col-12 col-md-4" label="Valor estimado" v-model="oportunidade.estimatedValue" @blur="oportunidade.estimatedValue = formatarMoedaCampo(oportunidade.estimatedValue)" />
          <q-input dense outlined type="date" class="col-12 col-md-4" label="Previsao" v-model="oportunidade.expectedCloseDate" />
          <q-input dense outlined class="col-12 col-md-4" label="Origem" v-model="oportunidade.source" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Descricao" v-model="oportunidade.description" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observacoes" v-model="oportunidade.notes" />
          <q-input v-if="oportunidade.stage === 'perdido'" dense outlined class="col-12" label="Motivo da perda" v-model="oportunidade.lostReason" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarOportunidade" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalProposta" persistent>
      <q-card style="width: 840px; max-width: 95vw">
        <q-card-section class="row items-center">
          <div>
            <div class="text-h6">Proposta comercial</div>
            <div class="text-caption text-grey-7">{{ oportunidadeProposta ? oportunidadeProposta.title : '' }}</div>
          </div>
          <q-space />
          <q-btn v-if="proposta.id" flat round dense icon="mdi-file-pdf-box" color="negative" @click="abrirPdfProposta(proposta)">
            <q-tooltip>Gerar PDF</q-tooltip>
          </q-btn>
          <q-btn v-if="proposta.publicToken" flat round dense icon="mdi-link-variant" color="primary" @click="copiarLinkPortal(proposta)">
            <q-tooltip>Copiar link do portal</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12 col-md-8" label="Titulo" v-model="proposta.title" />
          <q-select dense outlined emit-value map-options class="col-12 col-md-4" label="Status" v-model="proposta.status" :options="proposalStatusOptions" />
          <q-input dense outlined type="date" class="col-12 col-md-4" label="Validade" v-model="proposta.validUntil" />
          <q-input dense outlined class="col-12 col-md-4" label="Desconto" v-model="proposta.discount" @blur="proposta.discount = formatarMoedaCampo(proposta.discount)" />
          <q-input dense outlined readonly class="col-12 col-md-4" label="Total" :value="formatarMoeda(totalProposta)" />
          <q-input dense outlined type="textarea" class="col-12" label="Introducao" v-model="proposta.introduction" />
          <div class="col-12">
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">Itens</div>
              <q-space />
              <q-btn dense flat color="primary" icon="mdi-plus" label="Item" @click="adicionarItemProposta" />
            </div>
            <q-markup-table flat bordered dense>
              <thead>
                <tr>
                  <th class="text-left">Descricao</th>
                  <th class="text-right">Qtd.</th>
                  <th class="text-right">Unitario</th>
                  <th class="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in proposta.items" :key="index">
                  <td><q-input dense borderless v-model="item.description" /></td>
                  <td><q-input dense borderless type="number" min="1" v-model.number="item.quantity" /></td>
                  <td><q-input dense borderless v-model="item.unitPrice" @blur="item.unitPrice = formatarMoedaCampo(item.unitPrice)" /></td>
                  <td class="text-right">{{ formatarMoeda(totalItemProposta(item)) }}</td>
                  <td class="text-right">
                    <q-btn flat round dense icon="mdi-delete" color="negative" @click="removerItemProposta(index)" />
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
          <q-input dense outlined type="textarea" class="col-12" label="Observacao" v-model="proposta.observation" />
        </q-card-section>
        <q-card-actions align="between">
          <q-btn v-if="proposta.id" flat color="positive" icon="mdi-clipboard-plus-outline" label="Converter em OS" @click="abrirConversaoProposta(proposta)" />
          <div>
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarProposta" />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalConversao" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Converter em ordem de servico</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-select dense outlined emit-value map-options class="col-12" label="Tipo de atendimento" v-model="conversao.attendanceTypeId" :options="opcoesTiposAtendimento" @input="selecionarTipoAtendimentoConversao" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-6" label="Inicio" v-model="conversao.scheduledStart" />
          <q-input dense outlined type="datetime-local" class="col-12 col-md-6" label="Fim" v-model="conversao.scheduledEnd" />
          <q-input dense outlined class="col-12" label="Endereco" v-model="conversao.address" />
          <q-input dense outlined class="col-12 col-md-8" label="Cidade" v-model="conversao.city" />
          <q-input dense outlined class="col-12 col-md-4" label="UF" v-model="conversao.state" maxlength="2" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Converter" color="positive" :loading="salvando" @click="converterOportunidade" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalMeta" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Meta de desempenho</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-select dense outlined emit-value map-options class="col-12 col-md-6" label="Perfil" v-model="meta.roleType" :options="metaRoleOptions" />
          <q-input dense outlined type="month" class="col-12 col-md-6" label="Mes" v-model="meta.periodMonth" />
          <q-select v-if="meta.roleType === 'seller'" dense outlined emit-value map-options class="col-12" label="Vendedor" v-model="meta.userId" :options="ownerOptions" />
          <q-select v-else dense outlined emit-value map-options class="col-12" label="Tecnico" v-model="meta.attendantId" :options="attendantOptions" />
          <q-input dense outlined type="number" min="0" class="col-12 col-md-6" label="Meta de quantidade" v-model.number="meta.targetCount" />
          <q-input dense outlined class="col-12 col-md-6" label="Meta de valor" v-model="meta.targetValue" @blur="meta.targetValue = formatarMoedaCampo(meta.targetValue)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarMeta" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {
  ListarOportunidades,
  DashboardPipeline,
  CriarOportunidade,
  AlterarOportunidade,
  ConverterOportunidadeOrdemServico,
  ListarPropostas,
  CriarProposta,
  AlterarProposta,
  DocumentoProposta,
  ConverterPropostaOrdemServico,
  RodarFollowUpsPipeline,
  SalvarMetaPipeline,
  DashboardMetasPipeline
} from 'src/service/pipelineVendas'
import { ListarClientes } from 'src/service/clientes'
import { ListarUsuarios } from 'src/service/user'
import { ListarAtendentesServico } from 'src/service/ordensServico'
import { ListarTiposAtendimento } from 'src/service/tiposAtendimento'

const emptyOpportunity = () => ({
  contactId: null,
  ownerUserId: null,
  title: '',
  description: '',
  stage: 'novo',
  estimatedValue: '0,00',
  expectedCloseDate: '',
  source: '',
  lostReason: '',
  notes: ''
})

const emptyProposal = () => ({
  title: '',
  introduction: '',
  status: 'rascunho',
  validUntil: '',
  discount: '0,00',
  observation: '',
  items: [
    { description: '', quantity: 1, unitPrice: '0,00' }
  ]
})

export default {
  name: 'PipelineVendas',
  data () {
    return {
      salvando: false,
      modalOportunidade: false,
      modalConversao: false,
      modalProposta: false,
      modalMeta: false,
      filtros: {},
      oportunidades: [],
      dashboard: {},
      metasDashboard: {},
      clientes: [],
      usuarios: [],
      atendentes: [],
      tiposAtendimento: [],
      oportunidade: emptyOpportunity(),
      meta: {
        roleType: 'seller',
        userId: null,
        attendantId: null,
        periodMonth: new Date().toISOString().slice(0, 7),
        targetCount: 0,
        targetValue: '0,00'
      },
      oportunidadeConversao: null,
      oportunidadeProposta: null,
      propostaConversao: null,
      proposta: emptyProposal(),
      conversao: {
        attendanceTypeId: null,
        serviceType: '',
        scheduledStart: '',
        scheduledEnd: '',
        address: '',
        city: '',
        state: ''
      },
      stages: [
        { label: 'Novo', value: 'novo' },
        { label: 'Contato feito', value: 'contato_feito' },
        { label: 'Proposta enviada', value: 'proposta_enviada' },
        { label: 'Negociacao', value: 'negociacao' },
        { label: 'Ganho', value: 'ganho' },
        { label: 'Perdido', value: 'perdido' }
      ],
      proposalStatusOptions: [
        { label: 'Rascunho', value: 'rascunho' },
        { label: 'Enviada', value: 'enviada' },
        { label: 'Aprovada', value: 'aprovada' },
        { label: 'Rejeitada', value: 'rejeitada' },
        { label: 'Convertida', value: 'convertida' }
      ],
      metaRoleOptions: [
        { label: 'Vendedor', value: 'seller' },
        { label: 'Tecnico', value: 'technician' }
      ]
    }
  },
  computed: {
    stageOptions () {
      return this.stages
    },
    ownerOptions () {
      return this.usuarios.map(user => ({ label: user.name, value: user.id }))
    },
    attendantOptions () {
      return this.atendentes.map(attendant => ({ label: attendant.name, value: attendant.id }))
    },
    clienteOptions () {
      return this.clientes.map(cliente => ({ label: `${cliente.name} - ${cliente.number || cliente.email || ''}`, value: cliente.id }))
    },
    opcoesTiposAtendimento () {
      return this.tiposAtendimento
        .filter(item => item.isActive)
        .map(item => ({ label: item.name, value: item.id, name: item.name }))
    },
    dashboardCards () {
      return [
        { label: 'Total', value: this.dashboard.total || 0 },
        { label: 'Abertas', value: this.dashboard.open || 0 },
        { label: 'Ganhas', value: this.dashboard.won || 0 },
        { label: 'Perdidas', value: this.dashboard.lost || 0 },
        { label: 'Paradas', value: this.dashboard.stale || 0 },
        { label: 'Em negociacao', value: this.formatarMoeda(this.dashboard.openValue) },
        { label: 'Ganho', value: this.formatarMoeda(this.dashboard.wonValue) },
        { label: 'Conversao', value: `${this.dashboard.conversionRate || 0}%` }
      ]
    },
    totalProposta () {
      const subtotal = (this.proposta.items || [])
        .reduce((sum, item) => sum + this.totalItemProposta(item), 0)
      const discount = this.parseMoeda(this.proposta.discount) || 0
      return Math.max(0, subtotal - discount)
    }
  },
  mounted () {
    this.carregarTudo()
  },
  methods: {
    async carregarTudo () {
      await Promise.all([
        this.carregarUsuarios(),
        this.carregarAtendentes(),
        this.carregarTiposAtendimento(),
        this.carregarOportunidades(),
        this.carregarDashboard(),
        this.carregarMetas()
      ])
    },
    async carregarUsuarios () {
      const { data } = await ListarUsuarios()
      this.usuarios = data.users || data
    },
    async carregarAtendentes () {
      const { data } = await ListarAtendentesServico()
      this.atendentes = data
    },
    async carregarTiposAtendimento () {
      const { data } = await ListarTiposAtendimento({ isActive: true, rowsPerPage: 100 })
      this.tiposAtendimento = data.rows || []
    },
    async carregarOportunidades () {
      const { data } = await ListarOportunidades(this.filtros)
      this.oportunidades = data
    },
    async carregarDashboard () {
      const { data } = await DashboardPipeline()
      this.dashboard = data
    },
    async carregarMetas () {
      const { data } = await DashboardMetasPipeline({
        periodMonth: new Date().toISOString().slice(0, 7)
      })
      this.metasDashboard = data
    },
    oportunidadesPorEtapa (stage) {
      return this.oportunidades.filter(item => item.stage === stage)
    },
    valorEtapa (stage) {
      return this.oportunidadesPorEtapa(stage)
        .reduce((sum, item) => sum + (this.parseMoeda(item.estimatedValue) || 0), 0)
    },
    abrirOportunidade (item) {
      this.oportunidade = item
        ? {
            ...item,
            estimatedValue: this.formatarMoedaCampo(item.estimatedValue),
            expectedCloseDate: item.expectedCloseDate ? item.expectedCloseDate.slice(0, 10) : ''
          }
        : emptyOpportunity()
      if (item?.contact && !this.clientes.some(cliente => cliente.id === item.contact.id)) {
        this.clientes.unshift(item.contact)
      }
      this.modalOportunidade = true
    },
    async salvarOportunidade () {
      this.salvando = true
      try {
        const payload = {
          ...this.oportunidade,
          estimatedValue: this.parseMoeda(this.oportunidade.estimatedValue) || 0,
          expectedCloseDate: this.oportunidade.expectedCloseDate || null
        }
        if (payload.id) await AlterarOportunidade(payload)
        else await CriarOportunidade(payload)
        this.$q.notify({ type: 'positive', message: 'Oportunidade salva.' })
        this.modalOportunidade = false
        await this.carregarOportunidades()
        await this.carregarDashboard()
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar a oportunidade', error)
      } finally {
        this.salvando = false
      }
    },
    async moverEtapa (item, stage) {
      if (item.stage === stage) return
      await AlterarOportunidade({
        ...item,
        stage,
        estimatedValue: this.parseMoeda(item.estimatedValue) || 0,
        expectedCloseDate: item.expectedCloseDate
      })
      await this.carregarOportunidades()
      await this.carregarDashboard()
    },
    abrirConversao (item) {
      this.oportunidadeConversao = item
      this.conversao = {
        attendanceTypeId: null,
        serviceType: item.title,
        scheduledStart: '',
        scheduledEnd: '',
        address: '',
        city: '',
        state: ''
      }
      this.modalConversao = true
    },
    selecionarTipoAtendimentoConversao (attendanceTypeId) {
      const attendanceType = this.tiposAtendimento.find(item => item.id === attendanceTypeId)
      if (attendanceType) this.conversao.serviceType = attendanceType.name
    },
    async converterOportunidade () {
      if (!this.oportunidadeConversao) return
      this.salvando = true
      try {
        this.selecionarTipoAtendimentoConversao(this.conversao.attendanceTypeId)
        const converter = this.propostaConversao
          ? ConverterPropostaOrdemServico
          : ConverterOportunidadeOrdemServico
        await converter(this.oportunidadeConversao.id, {
          ...this.conversao,
          scheduledStart: this.toApiDate(this.conversao.scheduledStart),
          scheduledEnd: this.toApiDate(this.conversao.scheduledEnd)
        })
        this.$q.notify({ type: 'positive', message: 'Ordem de servico criada.' })
        this.modalConversao = false
        this.modalProposta = false
        this.propostaConversao = null
        await this.carregarOportunidades()
        await this.carregarDashboard()
      } catch (error) {
        this.$notificarErro('Nao foi possivel converter em OS', error)
      } finally {
        this.salvando = false
      }
    },
    async abrirProposta (item) {
      this.oportunidadeProposta = item
      const { data } = await ListarPropostas(item.id)
      const current = data[0]
      this.proposta = current
        ? {
            ...current,
            validUntil: current.validUntil ? current.validUntil.slice(0, 10) : '',
            discount: this.formatarMoedaCampo(current.discount),
            items: (current.items || []).map(proposalItem => ({
              ...proposalItem,
              unitPrice: this.formatarMoedaCampo(proposalItem.unitPrice)
            }))
          }
        : {
            ...emptyProposal(),
            title: item.title,
            introduction: item.description || ''
          }
      this.modalProposta = true
    },
    adicionarItemProposta () {
      this.proposta.items.push({ description: '', quantity: 1, unitPrice: '0,00' })
    },
    removerItemProposta (index) {
      if (this.proposta.items.length === 1) return
      this.proposta.items.splice(index, 1)
    },
    totalItemProposta (item) {
      const quantity = Number(item.quantity || 1)
      const unitPrice = this.parseMoeda(item.unitPrice) || 0
      return quantity * unitPrice
    },
    async salvarProposta () {
      if (!this.oportunidadeProposta) return
      this.salvando = true
      try {
        const payload = {
          ...this.proposta,
          discount: this.parseMoeda(this.proposta.discount) || 0,
          validUntil: this.proposta.validUntil || null,
          items: this.proposta.items.map(item => ({
            description: item.description,
            quantity: Number(item.quantity || 1),
            unitPrice: this.parseMoeda(item.unitPrice) || 0
          }))
        }
        const { data } = payload.id
          ? await AlterarProposta(payload)
          : await CriarProposta(this.oportunidadeProposta.id, payload)
        this.proposta = {
          ...data,
          validUntil: data.validUntil ? data.validUntil.slice(0, 10) : '',
          discount: this.formatarMoedaCampo(data.discount),
          items: (data.items || []).map(item => ({
            ...item,
            unitPrice: this.formatarMoedaCampo(item.unitPrice)
          }))
        }
        this.$q.notify({ type: 'positive', message: 'Proposta salva.' })
        await this.carregarOportunidades()
        await this.carregarDashboard()
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar a proposta', error)
      } finally {
        this.salvando = false
      }
    },
    async abrirPdfProposta (proposal) {
      try {
        const { data } = await DocumentoProposta(proposal.id)
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        window.open(url, '_blank')
      } catch (error) {
        this.$notificarErro('Nao foi possivel gerar a proposta em PDF', error)
      }
    },
    async copiarLinkPortal (proposal) {
      const url = `${window.location.origin}/#/portal/proposta/${proposal.publicToken}`
      try {
        await navigator.clipboard.writeText(url)
        this.$q.notify({ type: 'positive', message: 'Link do portal copiado.' })
      } catch (error) {
        window.open(url, '_blank')
      }
    },
    abrirConversaoProposta (proposal) {
      this.propostaConversao = proposal
      this.oportunidadeConversao = proposal
      this.conversao = {
        attendanceTypeId: proposal.attendanceTypeId || null,
        serviceType: proposal.attendanceType?.name || proposal.title,
        scheduledStart: '',
        scheduledEnd: '',
        address: '',
        city: '',
        state: ''
      }
      this.modalConversao = true
    },
    async executarFollowUpAutomatico () {
      try {
        const { data } = await RodarFollowUpsPipeline({ days: 7 })
        this.$q.notify({
          type: 'positive',
          message: `${data.sent} lembrete(s) registrado(s).`
        })
        await this.carregarOportunidades()
        await this.carregarDashboard()
      } catch (error) {
        this.$notificarErro('Nao foi possivel executar follow-up automatico', error)
      }
    },
    abrirMeta () {
      this.meta = {
        roleType: 'seller',
        userId: this.usuarios[0]?.id || null,
        attendantId: this.atendentes[0]?.id || null,
        periodMonth: new Date().toISOString().slice(0, 7),
        targetCount: 0,
        targetValue: '0,00'
      }
      this.modalMeta = true
    },
    async salvarMeta () {
      this.salvando = true
      try {
        await SalvarMetaPipeline({
          ...this.meta,
          targetValue: this.parseMoeda(this.meta.targetValue) || 0,
          userId: this.meta.roleType === 'seller' ? this.meta.userId : null,
          attendantId: this.meta.roleType === 'technician' ? this.meta.attendantId : null
        })
        this.$q.notify({ type: 'positive', message: 'Meta salva.' })
        this.modalMeta = false
        await this.carregarMetas()
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar a meta', error)
      } finally {
        this.salvando = false
      }
    },
    async filtrarClientes (val, update) {
      const { data } = await ListarClientes({ searchParam: val })
      update(() => {
        this.clientes = data
      })
    },
    toApiDate (value) {
      if (!value) return null
      return new Date(value).toISOString()
    },
    parseMoeda (value) {
      if (value === null || value === undefined || value === '') return null
      const cleaned = String(value).replace(/[^\d,.-]/g, '')
      const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned
      const parsed = Number(normalized)
      return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null
    },
    formatarMoedaCampo (value) {
      const parsed = this.parseMoeda(value)
      return parsed === null ? '' : parsed.toFixed(2).replace('.', ',')
    },
    formatarMoeda (value) {
      const parsed = this.parseMoeda(value)
      if (parsed === null) return '-'
      return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    formatarData (value) {
      if (!value) return '-'
      return new Date(value).toLocaleDateString('pt-BR')
    }
  }
}
</script>

<style scoped>
.sales-pipeline-page {
  background: #f8fafc;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.pipeline-board {
  display: grid;
  grid-template-columns: repeat(6, minmax(230px, 1fr));
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.pipeline-column {
  min-height: 420px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
}

.pipeline-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.pipeline-card {
  border-radius: 8px;
  margin-bottom: 10px;
}

.pipeline-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #334155;
  font-size: 12px;
}
</style>
