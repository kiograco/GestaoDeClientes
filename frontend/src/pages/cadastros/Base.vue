<template>
  <q-page class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">{{ moduloAtual.title }}</h1>
        <div class="app-page-subtitle">{{ moduloAtual.subtitle }}</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn-dropdown flat color="primary" icon="mdi-download" label="Exportar" :loading="exportando">
          <q-list>
            <q-item clickable v-close-popup @click="exportar('csv')">
              <q-item-section avatar><q-icon name="mdi-file-delimited-outline" /></q-item-section>
              <q-item-section>CSV</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="exportar('xlsx')">
              <q-item-section avatar><q-icon name="mdi-file-excel-outline" /></q-item-section>
              <q-item-section>Excel</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="exportar('pdf')">
              <q-item-section avatar><q-icon name="mdi-file-pdf-box" /></q-item-section>
              <q-item-section>PDF</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn unelevated color="primary" icon="mdi-plus" :label="`Novo ${moduloAtual.singular}`" @click="abrirFormulario()" />
      </div>
    </div>

    <q-card flat bordered class="app-card">
      <q-card-section class="row q-col-gutter-sm items-center">
        <q-input v-model.trim="searchParam" dense outlined clearable debounce="400" class="col-12 col-md-4" placeholder="Pesquisar" @input="carregar">
          <template v-slot:prepend><q-icon name="mdi-magnify" /></template>
        </q-input>
        <q-select v-model="status" dense outlined emit-value map-options class="col-12 col-md-2" label="Status" :options="statusOptions" @input="carregar" />
        <q-space />
        <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregar" />
      </q-card-section>

      <q-table
        flat
        :data="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        v-model:pagination="pagination"
        @request="onRequest"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'inactive' ? 'grey' : 'positive'">
              {{ props.value === 'inactive' ? 'Inativo' : 'Ativo' }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirFormulario(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="mdi-delete-outline" color="negative" @click="confirmarExclusao(props.row)">
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalFormulario">
      <q-card style="width: 720px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Editar' : 'Novo' }} {{ moduloAtual.singular }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <template v-if="isUnidades">
            <q-select
              v-model="form.clientId"
              dense
              outlined
              emit-value
              map-options
              use-input
              class="col-12 col-md-8"
              label="Cliente"
              :options="clientesOptions"
              @filter="filtrarClientes"
            />
            <q-input dense outlined class="col-12 col-md-4" label="Código" v-model.trim="form.code" />
            <q-input dense outlined class="col-12 col-md-6" label="Nome da unidade" v-model.trim="form.name" />
            <q-input dense outlined class="col-12 col-md-6" label="Responsável" v-model.trim="form.responsibleName" />
            <q-input dense outlined class="col-12 col-md-4" label="Telefone" v-model.trim="form.phone" />
            <q-input dense outlined class="col-12 col-md-8" label="E-mail" v-model.trim="form.email" />
            <q-input dense outlined class="col-12 col-md-3" label="CEP" v-model.trim="form.zipCode" />
            <q-input dense outlined class="col-12 col-md-7" label="Endereço" v-model.trim="form.street" />
            <q-input dense outlined class="col-12 col-md-2" label="Número" v-model.trim="form.number" />
            <q-input dense outlined class="col-12 col-md-4" label="Bairro" v-model.trim="form.neighborhood" />
            <q-input dense outlined class="col-12 col-md-4" label="Cidade" v-model.trim="form.city" />
            <q-input dense outlined class="col-12 col-md-2" label="UF" maxlength="2" v-model.trim="form.state" />
            <q-input dense outlined class="col-12 col-md-2" label="Complemento" v-model.trim="form.complement" />
            <q-input dense outlined class="col-12" type="textarea" label="Observações" v-model.trim="form.observations" />
          </template>
          <template v-else>
            <q-input dense outlined class="col-12 col-md-4" label="Código" v-model.trim="form.code" />
            <q-input dense outlined class="col-12 col-md-8" label="Nome" v-model.trim="form.name" />
            <q-input dense outlined class="col-12" type="textarea" label="Descrição" v-model.trim="form.description" />
            <q-select
              v-if="module === 'cities'"
              v-model="form.data.stateId"
              dense
              outlined
              emit-value
              map-options
              use-input
              class="col-12 col-md-6"
              label="Estado"
              :options="stateOptions"
              @filter="filtrarEstados"
            />
            <component
              v-for="field in moduloAtual.fields"
              :key="field.name"
              :is="field.type === 'select' ? 'q-select' : 'q-input'"
              v-model="form.data[field.name]"
              dense
              outlined
              emit-value
              map-options
              :type="field.type === 'number' ? 'number' : 'text'"
              :label="field.label"
              :options="field.options"
              class="col-12 col-md-6"
            />
          </template>
          <q-select v-model="form.status" dense outlined emit-value map-options class="col-12 col-md-4" label="Status" :options="statusOptionsSemTodos" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="grey-7" label="Cancelar" @click="modalFormulario = false" />
          <q-btn unelevated color="primary" label="Salvar" :loading="salvando" @click="salvar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {
  AlterarCadastroBase,
  AlterarUnidadeCliente,
  CriarCadastroBase,
  CriarUnidadeCliente,
  ExcluirCadastroBase,
  ExcluirUnidadeCliente,
  ExportarCadastroBase,
  ExportarUnidadesCliente,
  ListarCadastroBase,
  ListarUnidadesCliente
} from 'src/service/cadastrosBase'
import { ListarClientes } from 'src/service/clientes'

const modules = {
  unidades: { title: 'Unidades', singular: 'unidade', subtitle: 'Unidades operacionais vinculadas aos clientes.', icon: 'mdi-domain' },
  methods: { title: 'Métodos', singular: 'método', subtitle: 'Métodos aplicáveis aos serviços técnicos.', fields: [{ name: 'applicationType', label: 'Tipo de aplicação' }] },
  'non-conformities': { title: 'Não Conformidades', singular: 'não conformidade', subtitle: 'Ocorrências padronizadas para auditoria operacional.', fields: [{ name: 'severity', label: 'Gravidade', type: 'select', options: [{ label: 'Baixa', value: 'low' }, { label: 'Média', value: 'medium' }, { label: 'Alta', value: 'high' }] }, { name: 'category', label: 'Categoria' }] },
  tools: { title: 'Ferramentas', singular: 'ferramenta', subtitle: 'Ferramentas utilizadas pela equipe técnica.', fields: [{ name: 'category', label: 'Categoria' }, { name: 'observations', label: 'Observações' }] },
  equipment: { title: 'Equipamentos', singular: 'equipamento', subtitle: 'Equipamentos operacionais e de campo.', fields: [{ name: 'model', label: 'Modelo' }, { name: 'manufacturer', label: 'Fabricante' }, { name: 'assetNumber', label: 'Número de patrimônio' }, { name: 'responsibleName', label: 'Responsável' }] },
  vehicles: { title: 'Veículos', singular: 'veículo', subtitle: 'Veículos e dados de apoio operacional.', fields: [{ name: 'plate', label: 'Placa' }, { name: 'model', label: 'Modelo' }, { name: 'brand', label: 'Marca' }, { name: 'year', label: 'Ano', type: 'number' }, { name: 'color', label: 'Cor' }, { name: 'mileage', label: 'Quilometragem', type: 'number' }, { name: 'responsibleName', label: 'Responsável' }] },
  'chart-of-accounts': { title: 'Plano de Contas', singular: 'conta', subtitle: 'Estrutura contábil e financeira base.', fields: [{ name: 'accountType', label: 'Tipo', type: 'select', options: [{ label: 'Receita', value: 'revenue' }, { label: 'Despesa', value: 'expense' }, { label: 'Ativo', value: 'asset' }, { label: 'Passivo', value: 'liability' }] }, { name: 'parentCode', label: 'Código da conta pai' }] },
  'payment-methods': { title: 'Formas de Pagamento', singular: 'forma de pagamento', subtitle: 'Meios aceitos nos fluxos financeiros.', fields: [{ name: 'requiresClearing', label: 'Exige conciliação', type: 'select', options: [{ label: 'Sim', value: true }, { label: 'Não', value: false }] }] },
  'closing-types': { title: 'Tipos de Fechamento', singular: 'tipo de fechamento', subtitle: 'Regras de fechamento operacional e financeiro.', fields: [{ name: 'frequency', label: 'Frequência' }] },
  'service-order-statuses': { title: 'Situações de OS', singular: 'situação de OS', subtitle: 'Situações parametrizadas para agenda, filtros e execução de ordens de serviço.', fields: [{ name: 'color', label: 'Cor/identificador visual' }, { name: 'finalStatus', label: 'Status final', type: 'select', options: [{ label: 'Sim', value: true }, { label: 'Não', value: false }] }] },
  suppliers: { title: 'Fornecedores', singular: 'fornecedor', subtitle: 'Fornecedores de produtos, equipamentos e serviços.', fields: [{ name: 'tradeName', label: 'Nome fantasia' }, { name: 'document', label: 'CPF/CNPJ' }, { name: 'phone', label: 'Telefone' }, { name: 'email', label: 'E-mail' }, { name: 'address', label: 'Endereço' }, { name: 'providedProducts', label: 'Produtos fornecidos' }, { name: 'observations', label: 'Observações' }] },
  states: { title: 'Estados', singular: 'estado', subtitle: 'Estados utilizados em cadastros e relatórios.', fields: [{ name: 'ibgeCode', label: 'Código IBGE', type: 'number' }] },
  cities: { title: 'Cidades', singular: 'cidade', subtitle: 'Cidades utilizadas em cadastros, rotas e filtros.', fields: [{ name: 'ibgeCode', label: 'Código IBGE', type: 'number' }] },
  'general-parameters': { title: 'Parâmetros Gerais', singular: 'parâmetro', subtitle: 'Parâmetros administrativos usados pelo sistema.', fields: [{ name: 'scope', label: 'Escopo', type: 'select', options: [{ label: 'Empresa', value: 'company' }, { label: 'Sistema', value: 'system' }, { label: 'Operacional', value: 'operations' }, { label: 'Comunicação', value: 'communication' }, { label: 'Impressão', value: 'printing' }] }, { name: 'value', label: 'Valor' }] }
}

export default {
  name: 'CadastrosBase',
  data () {
    return {
      module: this.moduloDaRota(),
      rows: [],
      clientes: [],
      clientesOptions: [],
      states: [],
      stateOptions: [],
      searchParam: '',
      status: null,
      loading: false,
      salvando: false,
      exportando: false,
      modalFormulario: false,
      form: this.formVazio(this.moduloDaRota()),
      pagination: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
      statusOptions: [{ label: 'Todos', value: null }, { label: 'Ativo', value: 'active' }, { label: 'Inativo', value: 'inactive' }],
      statusOptionsSemTodos: [{ label: 'Ativo', value: 'active' }, { label: 'Inativo', value: 'inactive' }]
    }
  },
  computed: {
    moduloAtual () {
      return modules[this.module] || modules.methods
    },
    isUnidades () {
      return this.module === 'unidades'
    },
    columns () {
      const base = this.isUnidades
        ? [
          { name: 'name', label: 'Unidade', field: 'name', align: 'left', sortable: true },
          { name: 'client', label: 'Cliente', field: row => row.client?.tradeName || row.client?.legalName || '-', align: 'left' },
          { name: 'city', label: 'Cidade/UF', field: row => [row.city, row.state].filter(Boolean).join('/') || '-', align: 'left' }
        ]
        : [
          { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
          { name: 'code', label: 'Código', field: row => row.code || '-', align: 'left' },
          { name: 'description', label: 'Descrição', field: row => row.description || '-', align: 'left' }
        ]
      return [
        ...base,
        { name: 'status', label: 'Status', field: 'status', align: 'center' },
        { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
      ]
    }
  },
  watch: {
    '$route.query.modulo' () {
      this.module = this.moduloDaRota()
      this.searchParam = ''
      this.pagination.page = 1
      this.carregar()
    }
  },
  mounted () {
    this.carregarClientes()
    this.carregarEstados()
    this.carregar()
  },
  methods: {
    moduloDaRota () {
      const modulo = this.$route.query.modulo || this.$route.params.modulo
      return modules[modulo] ? modulo : 'unidades'
    },
    formVazio (module = this.module) {
      return module === 'unidades'
        ? { clientId: null, code: '', name: '', responsibleName: '', phone: '', email: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', observations: '', status: 'active' }
        : { code: '', name: '', description: '', status: 'active', data: {} }
    },
    filtrarClientes (value, update) {
      const term = String(value || '').toLowerCase()
      update(() => {
        this.clientesOptions = this.clientes
          .filter(cliente => `${cliente.legalName || ''} ${cliente.tradeName || ''}`.toLowerCase().includes(term))
          .map(cliente => ({ label: cliente.tradeName || cliente.legalName, value: cliente.id }))
      })
    },
    filtrarEstados (value, update) {
      const term = String(value || '').toLowerCase()
      update(() => {
        this.stateOptions = this.states
          .filter(state => `${state.name || ''} ${state.code || ''}`.toLowerCase().includes(term))
          .map(state => ({ label: `${state.code} - ${state.name}`, value: state.id }))
      })
    },
    async carregarClientes () {
      try {
        const { data } = await ListarClientes({ rowsPerPage: 100 })
        const clientes = Array.isArray(data) ? data : data.rows || []
        this.clientes = clientes
        this.clientesOptions = clientes.map(cliente => ({ label: cliente.tradeName || cliente.legalName, value: cliente.id }))
      } catch (error) {
        this.$notificarErro('Não foi possível carregar clientes.', error)
      }
    },
    async carregarEstados () {
      try {
        const { data } = await ListarCadastroBase('states', { rowsPerPage: 100 })
        this.states = data.rows || []
        this.stateOptions = this.states.map(state => ({ label: `${state.code} - ${state.name}`, value: state.id }))
      } catch (error) {
        this.$notificarErro('Não foi possível carregar estados.', error)
      }
    },
    async carregar () {
      this.loading = true
      try {
        const params = {
          searchParam: this.searchParam,
          status: this.status,
          pageNumber: this.pagination.page,
          rowsPerPage: this.pagination.rowsPerPage
        }
        const { data } = this.isUnidades ? await ListarUnidadesCliente(params) : await ListarCadastroBase(this.module, params)
        this.rows = data.rows || []
        this.pagination.rowsNumber = data.count || this.rows.length
      } catch (error) {
        this.$notificarErro('Não foi possível carregar o cadastro.', error)
      } finally {
        this.loading = false
      }
    },
    onRequest ({ pagination }) {
      this.pagination = { ...this.pagination, ...pagination }
      this.carregar()
    },
    abrirFormulario (row) {
      this.form = row ? { ...row, data: { ...(row.data || {}) } } : this.formVazio()
      this.modalFormulario = true
    },
    async salvar () {
      this.salvando = true
      try {
        const payload = { ...this.form }
        if (payload.state) payload.state = String(payload.state).toUpperCase()
        if (this.isUnidades) {
          payload.clientId = Number(payload.clientId)
          await (payload.id ? AlterarUnidadeCliente(payload) : CriarUnidadeCliente(payload))
        } else {
          await (payload.id ? AlterarCadastroBase(this.module, payload) : CriarCadastroBase(this.module, payload))
        }
        this.$q.notify({ type: 'positive', message: 'Cadastro salvo.' })
        this.modalFormulario = false
        await this.carregar()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o cadastro.', error)
      } finally {
        this.salvando = false
      }
    },
    async exportar (format) {
      this.exportando = true
      try {
        const params = {
          format,
          searchParam: this.searchParam,
          status: this.status
        }
        const { data } = this.isUnidades ? await ExportarUnidadesCliente(params) : await ExportarCadastroBase(this.module, params)
        const extension = format === 'xlsx' ? 'xlsx' : format
        const mime = format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : format === 'pdf'
            ? 'application/pdf'
            : 'text/csv;charset=utf-8'
        const url = URL.createObjectURL(new Blob([data], { type: mime }))
        const link = document.createElement('a')
        link.href = url
        link.download = `${this.moduloAtual.title.toLowerCase().replace(/\s+/g, '-')}.${extension}`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notificarErro('Não foi possível exportar o cadastro.', error)
      } finally {
        this.exportando = false
      }
    },
    confirmarExclusao (row) {
      this.$q.dialog({ title: 'Confirmar exclusão', message: `Excluir ${this.moduloAtual.singular} "${row.name}"?`, cancel: true, persistent: true }).onOk(() => this.excluir(row))
    },
    async excluir (row) {
      try {
        if (this.isUnidades) await ExcluirUnidadeCliente(row.id)
        else await ExcluirCadastroBase(this.module, row.id)
        this.$q.notify({ type: 'positive', message: 'Cadastro excluído.' })
        await this.carregar()
      } catch (error) {
        this.$notificarErro('Não foi possível excluir o cadastro.', error)
      }
    }
  }
}
</script>
