<template>
  <q-page class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Tipos de Atendimento</h1>
        <div class="app-page-subtitle">Cadastro parametrizavel usado em atendimentos, ordens e filtros operacionais.</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn-dropdown v-if="podeExportar" flat color="primary" icon="mdi-download" label="Exportar" :loading="exportando">
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
        <q-btn v-if="podeCriar" unelevated color="primary" icon="mdi-plus" label="Novo tipo" @click="abrirFormulario()" />
      </div>
    </div>

    <q-card flat bordered class="app-card">
      <q-card-section class="row q-col-gutter-sm items-center">
        <q-input v-model.trim="searchParam" dense outlined clearable debounce="400" class="col-12 col-md-5" placeholder="Pesquisar por nome ou descricao" @input="carregar">
          <template v-slot:prepend><q-icon name="mdi-magnify" /></template>
        </q-input>
        <q-select v-model="isActive" dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Status" :options="statusOptions" @input="carregar" />
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
        <template v-slot:body-cell-isActive="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'grey'">
              {{ props.value ? 'Ativo' : 'Inativo' }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="mdi-eye-outline" color="grey-8" @click="abrirDetalhes(props.row)">
              <q-tooltip>Visualizar</q-tooltip>
            </q-btn>
            <q-btn v-if="podeEditar" flat round dense icon="mdi-pencil" color="primary" @click="abrirFormulario(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn v-if="podeEditar" flat round dense :icon="props.row.isActive ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'" color="warning" @click="confirmarStatus(props.row)">
              <q-tooltip>{{ props.row.isActive ? 'Inativar' : 'Reativar' }}</q-tooltip>
            </q-btn>
            <q-btn v-if="podeExcluir" flat round dense icon="mdi-delete-outline" color="negative" @click="confirmarExclusao(props.row)">
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalFormulario">
      <q-card style="width: 640px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Editar tipo' : 'Novo tipo' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12" label="Nome" v-model.trim="form.name" :disable="salvando" />
          <q-input dense outlined class="col-12" type="textarea" label="Descricao" v-model.trim="form.description" :disable="salvando" />
          <q-toggle class="col-12" label="Ativo" v-model="form.isActive" :disable="salvando" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="grey-7" label="Cancelar" @click="modalFormulario = false" />
          <q-btn unelevated color="primary" label="Salvar" :loading="salvando" @click="salvar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalDetalhes">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ detalhes.name }}</div>
          <q-badge class="q-mt-sm" :color="detalhes.isActive ? 'positive' : 'grey'">{{ detalhes.isActive ? 'Ativo' : 'Inativo' }}</q-badge>
        </q-card-section>
        <q-card-section>
          <div class="text-caption text-grey-7 q-mb-xs">Descricao</div>
          <div>{{ detalhes.description || '-' }}</div>
          <div class="text-caption text-grey-7 q-mt-md">Atualizado em</div>
          <div>{{ formatarData(detalhes.updatedAt) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fechar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {
  AlterarTipoAtendimento,
  AtivarTipoAtendimento,
  CriarTipoAtendimento,
  ExcluirTipoAtendimento,
  ExportarTiposAtendimento,
  ListarTiposAtendimento
} from 'src/service/tiposAtendimento'

const managerProfiles = ['admin', 'superadmin', 'supervisor']

const emptyForm = () => ({
  name: '',
  description: '',
  isActive: true
})

export default {
  name: 'TiposAtendimento',
  data () {
    return {
      rows: [],
      searchParam: '',
      isActive: null,
      loading: false,
      salvando: false,
      exportando: false,
      modalFormulario: false,
      modalDetalhes: false,
      form: emptyForm(),
      detalhes: {},
      pagination: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
      statusOptions: [
        { label: 'Todos', value: null },
        { label: 'Ativo', value: true },
        { label: 'Inativo', value: false }
      ],
      columns: [
        { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
        { name: 'description', label: 'Descricao', field: row => row.description || '-', align: 'left' },
        { name: 'isActive', label: 'Status', field: 'isActive', align: 'center', sortable: true },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ]
    }
  },
  computed: {
    perfilAtual () {
      return localStorage.getItem('profile')
    },
    podeCriar () {
      return managerProfiles.includes(this.perfilAtual)
    },
    podeEditar () {
      return managerProfiles.includes(this.perfilAtual)
    },
    podeExcluir () {
      return managerProfiles.includes(this.perfilAtual)
    },
    podeExportar () {
      return managerProfiles.includes(this.perfilAtual)
    }
  },
  mounted () {
    this.carregar()
  },
  methods: {
    async carregar () {
      this.loading = true
      try {
        const { data } = await ListarTiposAtendimento({
          searchParam: this.searchParam,
          isActive: this.isActive,
          pageNumber: this.pagination.page,
          rowsPerPage: this.pagination.rowsPerPage
        })
        this.rows = data.rows || []
        this.pagination.rowsNumber = data.count || this.rows.length
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar tipos de atendimento.', error)
      } finally {
        this.loading = false
      }
    },
    onRequest ({ pagination }) {
      this.pagination = { ...this.pagination, ...pagination }
      this.carregar()
    },
    abrirFormulario (row) {
      this.form = row ? { ...row } : emptyForm()
      this.modalFormulario = true
    },
    abrirDetalhes (row) {
      this.detalhes = { ...row }
      this.modalDetalhes = true
    },
    async salvar () {
      this.salvando = true
      try {
        const payload = { ...this.form }
        await (payload.id ? AlterarTipoAtendimento(payload) : CriarTipoAtendimento(payload))
        this.$q.notify({ type: 'positive', message: 'Tipo de atendimento salvo.' })
        this.modalFormulario = false
        await this.carregar()
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar o tipo de atendimento.', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarStatus (row) {
      const acao = row.isActive ? 'inativar' : 'reativar'
      this.$q.dialog({ title: 'Confirmar alteracao', message: `Deseja ${acao} "${row.name}"?`, cancel: true, persistent: true }).onOk(() => this.alterarStatus(row))
    },
    async alterarStatus (row) {
      try {
        await AtivarTipoAtendimento(row.id, !row.isActive)
        this.$q.notify({ type: 'positive', message: row.isActive ? 'Tipo inativado.' : 'Tipo reativado.' })
        await this.carregar()
      } catch (error) {
        this.$notificarErro('Nao foi possivel alterar o status.', error)
      }
    },
    confirmarExclusao (row) {
      this.$q.dialog({ title: 'Confirmar exclusao', message: `Excluir "${row.name}"? Se houver vinculo, o tipo sera apenas inativado.`, cancel: true, persistent: true }).onOk(() => this.excluir(row))
    },
    async excluir (row) {
      try {
        const response = await ExcluirTipoAtendimento(row.id)
        this.$q.notify({ type: 'positive', message: response?.data?.inactivated ? 'Tipo vinculado e inativado.' : 'Tipo excluido.' })
        await this.carregar()
      } catch (error) {
        this.$notificarErro('Nao foi possivel excluir o tipo de atendimento.', error)
      }
    },
    async exportar (format) {
      this.exportando = true
      try {
        const { data } = await ExportarTiposAtendimento({
          format,
          searchParam: this.searchParam,
          isActive: this.isActive
        })
        const extension = format === 'xlsx' ? 'xlsx' : format
        const mime = format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : format === 'pdf'
            ? 'application/pdf'
            : 'text/csv;charset=utf-8'
        const url = URL.createObjectURL(new Blob([data], { type: mime }))
        const link = document.createElement('a')
        link.href = url
        link.download = `tipos-atendimento.${extension}`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notificarErro('Nao foi possivel exportar tipos de atendimento.', error)
      } finally {
        this.exportando = false
      }
    },
    formatarData (value) {
      return value ? new Date(value).toLocaleString('pt-BR') : '-'
    }
  }
}
</script>
