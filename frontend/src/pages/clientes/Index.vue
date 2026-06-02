<template>
  <div class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">Clientes</div>
        <div class="text-caption text-grey-7">Cadastre os dados comerciais importantes para vendas.</div>
      </div>
      <q-space />
      <q-input
        v-model.trim="searchParam"
        outlined
        dense
        clearable
        debounce="500"
        placeholder="Buscar cliente"
        class="q-mr-sm"
        @input="carregar"
      >
        <template v-slot:prepend><q-icon name="mdi-magnify" /></template>
      </q-input>
      <q-btn rounded color="primary" icon="mdi-plus" label="Novo cliente" @click="abrirCliente()" />
    </div>

    <q-card flat bordered>
      <q-table flat :data="clientes" :columns="colunas" row-key="id" :loading="loading">
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
  methods: {
    formatarStatus (status) {
      return { LEAD: 'Lead', CUSTOMER: 'Cliente', INACTIVE: 'Inativo' }[status] || 'Nao informado'
    },
    formatarEndereco (address) {
      return address ? `${address.street}, ${address.number} - ${address.city}/${address.state}` : 'Nao cadastrado'
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
