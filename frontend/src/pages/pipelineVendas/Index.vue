<template>
  <q-page padding class="sales-pipeline-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-medium">Pipeline de vendas</div>
        <div class="text-caption text-grey-7">Leads, oportunidades, previsao de fechamento e conversao em OS</div>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarTudo" />
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

    <q-dialog v-model="modalConversao" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Converter em ordem de servico</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12" label="Tipo de servico" v-model="conversao.serviceType" />
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
  </q-page>
</template>

<script>
import {
  ListarOportunidades,
  DashboardPipeline,
  CriarOportunidade,
  AlterarOportunidade,
  ConverterOportunidadeOrdemServico
} from 'src/service/pipelineVendas'
import { ListarClientes } from 'src/service/clientes'
import { ListarUsuarios } from 'src/service/user'

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

export default {
  name: 'PipelineVendas',
  data () {
    return {
      salvando: false,
      modalOportunidade: false,
      modalConversao: false,
      filtros: {},
      oportunidades: [],
      dashboard: {},
      clientes: [],
      usuarios: [],
      oportunidade: emptyOpportunity(),
      oportunidadeConversao: null,
      conversao: {
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
    clienteOptions () {
      return this.clientes.map(cliente => ({ label: `${cliente.name} - ${cliente.number || cliente.email || ''}`, value: cliente.id }))
    },
    dashboardCards () {
      return [
        { label: 'Total', value: this.dashboard.total || 0 },
        { label: 'Abertas', value: this.dashboard.open || 0 },
        { label: 'Ganhas', value: this.dashboard.won || 0 },
        { label: 'Perdidas', value: this.dashboard.lost || 0 },
        { label: 'Em negociacao', value: this.formatarMoeda(this.dashboard.openValue) },
        { label: 'Ganho', value: this.formatarMoeda(this.dashboard.wonValue) },
        { label: 'Conversao', value: `${this.dashboard.conversionRate || 0}%` }
      ]
    }
  },
  mounted () {
    this.carregarTudo()
  },
  methods: {
    async carregarTudo () {
      await Promise.all([
        this.carregarUsuarios(),
        this.carregarOportunidades(),
        this.carregarDashboard()
      ])
    },
    async carregarUsuarios () {
      const { data } = await ListarUsuarios()
      this.usuarios = data.users || data
    },
    async carregarOportunidades () {
      const { data } = await ListarOportunidades(this.filtros)
      this.oportunidades = data
    },
    async carregarDashboard () {
      const { data } = await DashboardPipeline()
      this.dashboard = data
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
        serviceType: item.title,
        scheduledStart: '',
        scheduledEnd: '',
        address: '',
        city: '',
        state: ''
      }
      this.modalConversao = true
    },
    async converterOportunidade () {
      if (!this.oportunidadeConversao) return
      this.salvando = true
      try {
        await ConverterOportunidadeOrdemServico(this.oportunidadeConversao.id, {
          ...this.conversao,
          scheduledStart: this.toApiDate(this.conversao.scheduledStart),
          scheduledEnd: this.toApiDate(this.conversao.scheduledEnd)
        })
        this.$q.notify({ type: 'positive', message: 'Ordem de servico criada.' })
        this.modalConversao = false
        await this.carregarOportunidades()
        await this.carregarDashboard()
      } catch (error) {
        this.$notificarErro('Nao foi possivel converter em OS', error)
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
