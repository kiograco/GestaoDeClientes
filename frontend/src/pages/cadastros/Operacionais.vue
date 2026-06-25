<template>
  <q-page class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Cadastros Operacionais</h1>
        <div class="app-page-subtitle">Serviços, produtos, pragas e funcionários técnicos.</div>
      </div>
      <q-btn unelevated color="primary" icon="mdi-plus" :label="novoLabel" @click="abrirFormulario()" />
    </div>

    <q-card flat bordered class="app-card">
      <q-card-section class="q-pb-none">
        <q-tabs v-model="aba" dense align="left" active-color="primary" indicator-color="primary" @input="trocarAba">
          <q-tab name="servicos" icon="mdi-format-list-bulleted-type" label="Serviços" />
          <q-tab name="produtos" icon="mdi-package-variant-closed" label="Produtos" />
          <q-tab name="pragas" icon="mdi-bug-outline" label="Pragas" />
          <q-tab name="funcionarios" icon="mdi-account-tie-outline" label="Funcionários" />
        </q-tabs>
      </q-card-section>
      <q-separator />
      <q-card-section class="row q-col-gutter-sm items-center">
        <q-input v-model.trim="search" dense outlined clearable debounce="300" class="col-12 col-md-4" placeholder="Pesquisar">
          <template v-slot:prepend><q-icon name="mdi-magnify" /></template>
        </q-input>
        <q-space />
        <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarAba" />
      </q-card-section>
      <q-table
        flat
        :data="linhasFiltradas"
        :columns="colunasAtuais"
        row-key="id"
        :loading="loading"
        :pagination.sync="pagination"
      >
        <template v-slot:body-cell-active="props">
          <q-td :props="props">
            <q-badge :color="props.value === false ? 'grey' : 'positive'">
              {{ props.value === false ? 'Inativo' : 'Ativo' }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirFormulario(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn v-if="podeExcluir" flat round dense icon="mdi-delete-outline" color="negative" @click="confirmarExclusao(props.row)">
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalFormulario">
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Editar' : 'Novo' }} {{ entidadeAtual }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <template v-if="aba === 'servicos'">
            <q-input dense outlined class="col-12 col-md-6" label="Nome" v-model.trim="form.name" />
            <q-input dense outlined class="col-12 col-md-6" label="Código" v-model.trim="form.code" />
            <q-input dense outlined class="col-12" type="textarea" label="Descrição" v-model.trim="form.description" />
            <q-input dense outlined class="col-12 col-md-6" inputmode="decimal" label="Preço padrão" v-model="form.defaultPrice" prefix="R$" />
            <q-toggle class="col-12 col-md-6" label="Ativo" v-model="form.active" />
          </template>
          <template v-if="aba === 'produtos'">
            <q-input dense outlined class="col-12 col-md-8" label="Nome comercial" v-model.trim="form.name" />
            <q-input dense outlined class="col-12 col-md-4" label="SKU" v-model.trim="form.sku" />
            <q-input dense outlined class="col-12 col-md-6" label="Princípio ativo" v-model.trim="form.activeIngredient" />
            <q-input dense outlined class="col-12 col-md-6" label="Grupo químico" v-model.trim="form.chemicalGroup" />
            <q-input dense outlined class="col-12 col-md-6" label="Registro MS" v-model.trim="form.healthRegistration" />
            <q-input dense outlined class="col-12 col-md-6" label="Fabricante" v-model.trim="form.manufacturer" />
            <q-select dense outlined emit-value map-options class="col-12 col-md-4" label="Unidade" v-model="form.unit" :options="unitOptions" />
            <q-input dense outlined class="col-12 col-md-4" type="number" min="0" label="Saldo" v-model.number="form.quantity" />
            <q-input dense outlined class="col-12 col-md-4" type="number" min="0" label="Estoque mínimo" v-model.number="form.minQuantity" />
            <q-toggle class="col-12 col-md-6" label="Controle de lote" v-model="form.lotControlEnabled" />
            <q-toggle class="col-12 col-md-6" label="Ativo" v-model="form.active" />
          </template>
          <template v-if="aba === 'pragas'">
            <q-input dense outlined class="col-12 col-md-6" label="Nome comum" v-model.trim="form.commonName" />
            <q-input dense outlined class="col-12 col-md-6" label="Nome científico" v-model.trim="form.scientificName" />
          </template>
          <template v-if="aba === 'funcionarios'">
            <q-input dense outlined class="col-12 col-md-6" label="Nome" v-model.trim="form.name" />
            <q-input dense outlined class="col-12 col-md-6" label="E-mail" v-model.trim="form.email" />
            <q-input dense outlined class="col-12 col-md-6" label="Telefone" v-model.trim="form.phone" />
            <q-input dense outlined class="col-12 col-md-6" label="Cargo/Especialidade" v-model.trim="form.specialty" />
            <q-toggle class="col-12" label="Ativo" v-model="form.active" />
          </template>
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
  AlterarAtendenteServico,
  AlterarItemEstoqueServico,
  AlterarPragaServico,
  AlterarTipoServico,
  CriarAtendenteServico,
  CriarItemEstoqueServico,
  CriarPragaServico,
  CriarTipoServico,
  ExcluirItemEstoqueServico,
  ExcluirPragaServico,
  ExcluirTipoServico,
  ListarAtendentesServico,
  ListarEstoqueServico,
  ListarPragasServico,
  ListarTiposServico
} from 'src/service/ordensServico'

const abas = ['servicos', 'produtos', 'pragas', 'funcionarios']
const emptyForms = {
  servicos: () => ({ name: '', code: '', description: '', defaultPrice: '0,00', active: true }),
  produtos: () => ({ name: '', sku: '', activeIngredient: '', chemicalGroup: '', healthRegistration: '', manufacturer: '', unit: 'unidade', quantity: 0, minQuantity: 0, lotControlEnabled: false, active: true }),
  pragas: () => ({ commonName: '', scientificName: '' }),
  funcionarios: () => ({ name: '', email: '', phone: '', specialty: '', active: true })
}

export default {
  name: 'CadastrosOperacionais',
  data () {
    return {
      aba: abas.includes(this.$route.query.aba) ? this.$route.query.aba : 'servicos',
      search: '',
      loading: false,
      salvando: false,
      modalFormulario: false,
      form: emptyForms.servicos(),
      rows: { servicos: [], produtos: [], pragas: [], funcionarios: [] },
      pagination: { rowsPerPage: 15 },
      unitOptions: [
        { label: 'Unidade', value: 'unidade' },
        { label: 'ml', value: 'ml' },
        { label: 'Litro', value: 'litro' },
        { label: 'Grama', value: 'grama' },
        { label: 'Kg', value: 'kg' }
      ]
    }
  },
  computed: {
    entidadeAtual () {
      return { servicos: 'serviço', produtos: 'produto', pragas: 'praga', funcionarios: 'funcionário' }[this.aba]
    },
    novoLabel () {
      return `Novo ${this.entidadeAtual}`
    },
    podeExcluir () {
      return ['servicos', 'produtos', 'pragas'].includes(this.aba)
    },
    colunasAtuais () {
      const actions = { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
      return {
        servicos: [
          { name: 'name', label: 'Serviço', field: 'name', align: 'left', sortable: true },
          { name: 'code', label: 'Código', field: row => row.code || '-', align: 'left' },
          { name: 'defaultPrice', label: 'Preço', field: row => this.formatarMoeda(row.defaultPrice), align: 'right' },
          { name: 'active', label: 'Status', field: 'active', align: 'center' },
          actions
        ],
        produtos: [
          { name: 'name', label: 'Produto', field: 'name', align: 'left', sortable: true },
          { name: 'activeIngredient', label: 'Princípio ativo', field: row => row.activeIngredient || '-', align: 'left' },
          { name: 'quantity', label: 'Saldo', field: row => `${row.quantity || 0} ${row.unit || ''}`, align: 'left' },
          { name: 'active', label: 'Status', field: 'active', align: 'center' },
          actions
        ],
        pragas: [
          { name: 'commonName', label: 'Nome comum', field: 'commonName', align: 'left', sortable: true },
          { name: 'scientificName', label: 'Nome científico', field: 'scientificName', align: 'left' },
          actions
        ],
        funcionarios: [
          { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
          { name: 'email', label: 'E-mail', field: row => row.email || '-', align: 'left' },
          { name: 'specialty', label: 'Cargo/Especialidade', field: row => row.specialty || '-', align: 'left' },
          { name: 'active', label: 'Status', field: 'active', align: 'center' },
          actions
        ]
      }[this.aba]
    },
    linhasFiltradas () {
      const term = this.normalizar(this.search)
      if (!term) return this.rows[this.aba]
      return this.rows[this.aba].filter(row => this.normalizar(Object.values(row).join(' ')).includes(term))
    }
  },
  watch: {
    '$route.query.aba' (value) {
      if (abas.includes(value)) {
        this.aba = value
        this.carregarAba()
      }
    }
  },
  mounted () {
    this.carregarAba()
  },
  methods: {
    normalizar (value) {
      return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    },
    formatarMoeda (value) {
      return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    parseMoeda (value) {
      if (typeof value === 'number') return value
      return Number(String(value || '0').replace(/\./g, '').replace(',', '.')) || 0
    },
    trocarAba () {
      this.search = ''
      this.$router.replace({ name: 'cadastros-operacionais', query: { aba: this.aba } }).catch(() => {})
      this.carregarAba()
    },
    async carregarAba () {
      this.loading = true
      try {
        const loaders = { servicos: ListarTiposServico, produtos: ListarEstoqueServico, pragas: ListarPragasServico, funcionarios: ListarAtendentesServico }
        const { data } = await loaders[this.aba]({})
        this.rows[this.aba] = data
      } catch (error) {
        this.$notificarErro('Não foi possível carregar o cadastro', error)
      } finally {
        this.loading = false
      }
    },
    abrirFormulario (row) {
      this.form = row ? { ...row } : emptyForms[this.aba]()
      if (this.aba === 'servicos' && this.form.defaultPrice !== undefined) this.form.defaultPrice = String(this.form.defaultPrice || '0').replace('.', ',')
      this.modalFormulario = true
    },
    payloadAtual () {
      const payload = { ...this.form }
      if (this.aba === 'servicos') payload.defaultPrice = this.parseMoeda(payload.defaultPrice)
      if (this.aba === 'produtos') {
        payload.quantity = Number(payload.quantity || 0)
        payload.minQuantity = Number(payload.minQuantity || 0)
      }
      return payload
    },
    async salvar () {
      this.salvando = true
      try {
        const payload = this.payloadAtual()
        const actions = {
          servicos: payload.id ? AlterarTipoServico : CriarTipoServico,
          produtos: payload.id ? AlterarItemEstoqueServico : CriarItemEstoqueServico,
          pragas: payload.id ? AlterarPragaServico : CriarPragaServico,
          funcionarios: payload.id ? AlterarAtendenteServico : CriarAtendenteServico
        }
        await actions[this.aba](payload)
        this.$q.notify({ type: 'positive', message: 'Cadastro salvo.' })
        this.modalFormulario = false
        await this.carregarAba()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o cadastro', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarExclusao (row) {
      this.$q.dialog({ title: 'Confirmar exclusão', message: `Excluir ${this.entidadeAtual} "${row.name || row.commonName}"?`, cancel: true, persistent: true }).onOk(() => this.excluir(row))
    },
    async excluir (row) {
      try {
        const actions = { servicos: ExcluirTipoServico, produtos: ExcluirItemEstoqueServico, pragas: ExcluirPragaServico }
        await actions[this.aba](row.id)
        this.$q.notify({ type: 'positive', message: 'Cadastro excluído.' })
        await this.carregarAba()
      } catch (error) {
        this.$notificarErro('Não foi possível excluir o cadastro', error)
      }
    }
  }
}
</script>
