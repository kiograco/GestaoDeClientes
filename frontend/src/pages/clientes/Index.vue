<template>
  <div class="app-page clientes-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Clientes</h1>
        <div class="app-page-subtitle">
          Cadastro central de clientes, enderecos e contatos para operacoes de controle de pragas.
        </div>
      </div>
      <div class="clientes-actions">
        <q-input
          v-model.trim="searchParam"
          outlined
          dense
          clearable
          debounce="500"
          placeholder="Buscar por nome, fantasia, CPF/CNPJ ou ramo"
          @input="carregar"
        >
          <template v-slot:prepend><q-icon name="mdi-magnify" /></template>
        </q-input>
        <q-btn unelevated color="primary" icon="mdi-plus" label="Novo cliente" @click="abrirCliente()" />
      </div>
    </div>

    <section class="clientes-summary q-mb-md">
      <q-card flat bordered class="app-card clientes-summary-card">
        <div class="app-kpi-label">Total</div>
        <div class="app-kpi-value">{{ clientes.length }}</div>
        <div class="app-kpi-context">clientes filtrados</div>
      </q-card>
      <q-card flat bordered class="app-card clientes-summary-card">
        <div class="app-kpi-label">Ativos</div>
        <div class="app-kpi-value">{{ clientesPorStatus.active }}</div>
        <div class="app-kpi-context">em atendimento</div>
      </q-card>
      <q-card flat bordered class="app-card clientes-summary-card">
        <div class="app-kpi-label">Prospects</div>
        <div class="app-kpi-value">{{ clientesPorStatus.prospect }}</div>
        <div class="app-kpi-context">em qualificacao</div>
      </q-card>
    </section>

    <q-card flat bordered class="app-card">
      <q-table
        flat
        :data="clientes"
        :columns="colunas"
        row-key="id"
        :loading="loading"
        @row-click="selecionarCliente"
      >
        <template v-slot:body-cell-legalName="props">
          <q-td :props="props">
            <div class="cliente-table-name">{{ props.row.legalName }}</div>
            <div class="cliente-table-caption">{{ props.row.tradeName || formatarTipo(props.row.registrationType) }}</div>
          </q-td>
        </template>
        <template v-slot:body-cell-document="props">
          <q-td :props="props">{{ formatarDocumento(props.value) }}</q-td>
        </template>
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="statusColor(props.value)">
              {{ formatarStatus(props.value) }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-address="props">
          <q-td :props="props">{{ formatarEndereco(props.row.addresses && props.row.addresses[0]) }}</q-td>
        </template>
        <template v-slot:body-cell-contacts="props">
          <q-td :props="props">{{ (props.row.contacts || []).length }}</q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round dense icon="mdi-pencil" @click.stop="abrirCliente(props.row.id)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click.stop="confirmarExclusao(props.row)">
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-drawer
      v-model="drawerCliente"
      side="right"
      overlay
      bordered
      :width="$q.screen.lt.sm ? $q.screen.width : 440"
      content-class="cliente-detail-drawer"
    >
      <div v-if="clienteSelecionado" class="cliente-detail">
        <div class="cliente-detail__header">
          <div>
            <div class="cliente-detail__eyebrow">{{ formatarTipo(clienteSelecionado.registrationType) }}</div>
            <div class="cliente-detail__title">{{ clienteSelecionado.legalName }}</div>
            <div class="cliente-detail__subtitle">{{ clienteSelecionado.tradeName || 'Nome fantasia nao informado' }}</div>
          </div>
          <q-btn flat round dense icon="mdi-close" class="app-icon-btn" @click="drawerCliente = false" />
        </div>
        <q-separator />
        <div class="cliente-detail__body">
          <q-badge :color="statusColor(clienteSelecionado.status)" class="q-mb-md">
            {{ formatarStatus(clienteSelecionado.status) }}
          </q-badge>
          <q-list separator>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-card-account-details-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ formatarDocumento(clienteSelecionado.document) }}</q-item-label>
                <q-item-label caption>CPF/CNPJ</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-domain" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ clienteSelecionado.activitySector || 'Nao informado' }}</q-item-label>
                <q-item-label caption>Ramo de atividade</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-map-marker-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ formatarEndereco(clienteSelecionado.addresses && clienteSelecionado.addresses[0]) }}</q-item-label>
                <q-item-label caption>Endereco principal</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-account-multiple-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ (clienteSelecionado.contacts || []).length }} contato(s)</q-item-label>
                <q-item-label caption>Contatos vinculados</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="cliente-detail__actions">
          <q-btn outline color="primary" icon="mdi-pencil" label="Editar cliente" @click="abrirCliente(clienteSelecionado.id)" />
        </div>
      </div>
    </q-drawer>

    <ClienteModal v-model="modalCliente" :clientId="selectedClientId" @saved="carregar" />
  </div>
</template>

<script>
import ClienteModal from './ClienteModal'
import { ExcluirCliente, ListarClientes } from 'src/service/clientes'

export default {
  name: 'ClientesIndex',
  components: { ClienteModal },
  data () {
    return {
      clientes: [],
      modalCliente: false,
      selectedClientId: null,
      clienteSelecionado: null,
      drawerCliente: false,
      loading: false,
      searchParam: '',
      colunas: [
        { name: 'legalName', label: 'Cliente', field: 'legalName', align: 'left', sortable: true },
        { name: 'document', label: 'CPF/CNPJ', field: 'document', align: 'left' },
        { name: 'activitySector', label: 'Ramo', field: 'activitySector', align: 'left' },
        { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
        { name: 'address', label: 'Endereco', field: 'address', align: 'left' },
        { name: 'contacts', label: 'Contatos', field: 'contacts', align: 'center' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ]
    }
  },
  mounted () {
    this.carregar()
  },
  computed: {
    clientesPorStatus () {
      return this.clientes.reduce((acc, cliente) => {
        const status = cliente.status || 'prospect'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, { prospect: 0, active: 0, inactive: 0 })
    }
  },
  methods: {
    formatarStatus (status) {
      return { prospect: 'Prospect', active: 'Ativo', inactive: 'Inativo' }[status] || 'Nao informado'
    },
    formatarTipo (tipo) {
      return {
        person: 'Pessoa Fisica',
        legal_entity: 'Pessoa Juridica',
        condominium: 'Condominio',
        company: 'Empresa'
      }[tipo] || 'Cliente'
    },
    formatarDocumento (documento) {
      const value = (documento || '').replace(/\D/g, '')
      if (value.length === 11) {
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }
      if (value.length === 14) {
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      }
      return 'Nao informado'
    },
    formatarEndereco (address) {
      return address && address.street
        ? `${address.street}, ${address.number || 's/n'} - ${address.city || ''}/${address.state || ''}`
        : 'Nao cadastrado'
    },
    statusColor (status) {
      return { prospect: 'primary', active: 'positive', inactive: 'grey' }[status] || 'grey'
    },
    selecionarCliente (evt, row) {
      this.clienteSelecionado = row
      this.drawerCliente = true
    },
    async carregar () {
      this.loading = true
      try {
        const { data } = await ListarClientes({ searchParam: this.searchParam })
        this.clientes = data
        if (this.clienteSelecionado) {
          this.clienteSelecionado = this.clientes.find(cliente => cliente.id === this.clienteSelecionado.id) || null
        }
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar os clientes.', error)
      } finally {
        this.loading = false
      }
    },
    abrirCliente (clientId = null) {
      this.selectedClientId = clientId
      this.modalCliente = true
    },
    confirmarExclusao (cliente) {
      this.$q.dialog({
        title: 'Excluir cliente',
        message: `Deseja excluir ${cliente.legalName}?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await ExcluirCliente(cliente.id)
          this.$q.notify({ type: 'positive', message: 'Cliente excluido.' })
          if (this.clienteSelecionado?.id === cliente.id) {
            this.drawerCliente = false
            this.clienteSelecionado = null
          }
          await this.carregar()
        } catch (error) {
          this.$notificarErro('Nao foi possivel excluir o cliente.', error)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.clientes-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clientes-actions .q-field {
  min-width: 340px;
}

.clientes-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 16px;
}

.clientes-summary-card {
  padding: 18px;
}

.cliente-table-name {
  color: var(--text-primary);
  font-weight: 700;
}

.cliente-table-caption {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 18px;
}

.cliente-detail-drawer {
  background: var(--surface) !important;
}

.cliente-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cliente-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 22px;
}

.cliente-detail__eyebrow {
  color: var(--color-primary-600);
  font-size: 12px;
  line-height: 16px;
  font-weight: 750;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.cliente-detail__title {
  color: var(--text-primary);
  font-size: 22px;
  line-height: 30px;
  font-weight: 750;
}

.cliente-detail__subtitle {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 20px;
}

.cliente-detail__body {
  padding: 20px 22px;
  flex: 1;
}

.cliente-detail__actions {
  padding: 16px 22px;
  border-top: 1px solid var(--border);
}

.cliente-detail__actions .q-btn {
  width: 100%;
}

@media (max-width: 700px) {
  .clientes-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .clientes-actions .q-field,
  .clientes-actions .q-btn {
    min-width: 0;
    width: 100%;
  }

  .clientes-summary {
    grid-template-columns: 1fr;
  }
}
</style>
