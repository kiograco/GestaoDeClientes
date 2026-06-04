<template>
  <div class="app-page clientes-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Clientes</h1>
        <div class="app-page-subtitle">Central comercial com dados de contato, empresa, status e endereco.</div>
      </div>
      <div class="clientes-actions">
        <q-input
          v-model.trim="searchParam"
          outlined
          dense
          clearable
          debounce="500"
          placeholder="Buscar cliente"
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
        <div class="app-kpi-label">Clientes</div>
        <div class="app-kpi-value">{{ clientesPorStatus.CUSTOMER }}</div>
        <div class="app-kpi-context">status ativo</div>
      </q-card>
      <q-card flat bordered class="app-card clientes-summary-card">
        <div class="app-kpi-label">Leads</div>
        <div class="app-kpi-value">{{ clientesPorStatus.LEAD }}</div>
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
        <template v-slot:body-cell-salesStatus="props">
          <q-td :props="props">{{ formatarStatus(props.value) }}</q-td>
        </template>
        <template v-slot:body-cell-address="props">
          <q-td :props="props">{{ formatarEndereco(props.row.addresses && props.row.addresses[0]) }}</q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round icon="mdi-pencil" @click="abrirCliente(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-drawer
      v-model="drawerCliente"
      side="right"
      overlay
      bordered
      :width="$q.screen.lt.sm ? $q.screen.width : 420"
      content-class="cliente-detail-drawer"
    >
      <div v-if="clienteSelecionado" class="cliente-detail">
        <div class="cliente-detail__header">
          <div>
            <div class="cliente-detail__eyebrow">Cliente</div>
            <div class="cliente-detail__title">{{ clienteSelecionado.name }}</div>
            <div class="cliente-detail__subtitle">{{ clienteSelecionado.salesProfile?.companyName || 'Empresa nao informada' }}</div>
          </div>
          <q-btn flat round dense icon="mdi-close" class="app-icon-btn" @click="drawerCliente = false" />
        </div>
        <q-separator />
        <div class="cliente-detail__body">
          <q-badge :color="statusColor(clienteSelecionado.salesProfile?.salesStatus)" class="q-mb-md">
            {{ formatarStatus(clienteSelecionado.salesProfile?.salesStatus) }}
          </q-badge>
          <q-list separator>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-phone-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ clienteSelecionado.number || 'Nao informado' }}</q-item-label>
                <q-item-label caption>Telefone principal</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="mdi-email-outline" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ clienteSelecionado.email || 'Nao informado' }}</q-item-label>
                <q-item-label caption>E-mail</q-item-label>
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
              <q-item-section avatar><q-icon name="mdi-source-branch" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ clienteSelecionado.salesProfile?.source || 'Nao informado' }}</q-item-label>
                <q-item-label caption>Origem</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="cliente-detail__actions">
          <q-btn outline color="primary" icon="mdi-pencil" label="Editar cliente" @click="abrirCliente(clienteSelecionado.id)" />
        </div>
      </div>
    </q-drawer>

    <ClienteModal
      v-model="modalCliente"
      :contactId="selectedContactId"
      @saved="carregar"
    />
  </div>
</template>

<script>
import ClienteModal from './ClienteModal'
import { ListarClientes } from 'src/service/clientes'

export default {
  name: 'ClientesIndex',
  components: { ClienteModal },
  data () {
    return {
      clientes: [],
      modalCliente: false,
      selectedContactId: null,
      clienteSelecionado: null,
      drawerCliente: false,
      loading: false,
      searchParam: '',
      colunas: [
        { name: 'name', label: 'Cliente', field: 'name', align: 'left' },
        { name: 'companyName', label: 'Empresa', field: row => row.salesProfile && row.salesProfile.companyName, align: 'left' },
        { name: 'number', label: 'Telefone', field: 'number', align: 'left' },
        { name: 'email', label: 'E-mail', field: 'email', align: 'left' },
        { name: 'salesStatus', label: 'Situacao', field: row => row.salesProfile && row.salesProfile.salesStatus, align: 'left' },
        { name: 'address', label: 'Endereco', field: 'address', align: 'left' },
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
        const status = cliente.salesProfile?.salesStatus || 'LEAD'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, { LEAD: 0, CUSTOMER: 0, INACTIVE: 0 })
    }
  },
  methods: {
    formatarStatus (status) {
      return { LEAD: 'Lead', CUSTOMER: 'Cliente', INACTIVE: 'Inativo' }[status] || 'Nao informado'
    },
    formatarEndereco (address) {
      return address ? `${address.street}, ${address.number} - ${address.city}/${address.state}` : 'Nao cadastrado'
    },
    statusColor (status) {
      return { LEAD: 'primary', CUSTOMER: 'positive', INACTIVE: 'grey' }[status] || 'grey'
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
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar os clientes.', error)
      } finally {
        this.loading = false
      }
    },
    abrirCliente (contactId = null) {
      this.selectedContactId = contactId
      this.modalCliente = true
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
  min-width: 300px;
}

.clientes-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 16px;
}

.clientes-summary-card {
  padding: 18px;
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
