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
            <q-btn flat round icon="mdi-pencil" @click="abrirCliente(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalCliente" persistent>
      <q-card style="width: 900px; max-width: 96vw">
        <q-card-section class="text-h6">{{ cliente.id ? 'Editar' : 'Novo' }} cliente</q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="text-subtitle2">Dados principais</div>
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="cliente.name" outlined dense label="Nome *" class="col-12 col-md-6" />
            <q-input v-model.trim="cliente.companyName" outlined dense label="Empresa" class="col-12 col-md-6" />
            <q-input v-model.trim="cliente.number" outlined dense label="WhatsApp ou telefone *" class="col-12 col-md-4" />
            <q-input v-model.trim="cliente.secondaryPhone" outlined dense label="Telefone alternativo" class="col-12 col-md-4" />
            <q-input v-model.trim="cliente.email" outlined dense label="E-mail" class="col-12 col-md-4" />
            <q-input v-model.trim="cliente.document" outlined dense label="CPF ou CNPJ" class="col-12 col-md-4" />
            <q-input v-model="cliente.birthDate" outlined dense type="date" label="Data de nascimento" class="col-12 col-md-4" />
            <q-select
              v-model="cliente.salesStatus"
              :options="opcoesStatus"
              emit-value
              map-options
              outlined
              dense
              label="Situacao comercial"
              class="col-12 col-md-4"
            />
            <q-input v-model.trim="cliente.source" outlined dense label="Origem do cliente" class="col-12" />
          </div>

          <q-separator />
          <div class="text-subtitle2">Endereco principal</div>
          <div class="row q-col-gutter-md">
            <q-input
              v-model.trim="cliente.address.zipCode"
              outlined
              dense
              mask="#####-###"
              unmasked-value
              label="CEP *"
              class="col-12 col-md-3"
              @blur="consultarCep"
            >
              <template v-slot:append>
                <q-btn flat round dense icon="mdi-magnify" :loading="loadingCep" @click="consultarCep" />
              </template>
            </q-input>
            <q-input v-model.trim="cliente.address.street" outlined dense label="Logradouro *" class="col-12 col-md-6" />
            <q-input v-model.trim="cliente.address.number" outlined dense label="Numero *" class="col-12 col-md-3" />
            <q-input v-model.trim="cliente.address.district" outlined dense label="Bairro *" class="col-12 col-md-4" />
            <q-input v-model.trim="cliente.address.city" outlined dense label="Cidade *" class="col-12 col-md-4" />
            <q-input v-model.trim="cliente.address.state" outlined dense maxlength="2" label="UF *" class="col-12 col-md-2" />
            <q-input v-model.trim="cliente.address.complement" outlined dense label="Complemento" class="col-12 col-md-6" />
            <q-input v-model.trim="cliente.address.reference" outlined dense label="Referencia" class="col-12 col-md-6" />
          </div>

          <q-separator />
          <q-input v-model.trim="cliente.notes" outlined dense type="textarea" label="Observacoes comerciais" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modalCliente = false" />
          <q-btn rounded color="primary" label="Salvar" :disable="!clienteValido" :loading="saving" @click="salvarCliente" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { AlterarCliente, ConsultarCep, CriarCliente, ListarClientes, ObterCliente } from 'src/service/clientes'

const enderecoVazio = () => ({
  label: 'Principal',
  zipCode: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: '',
  complement: '',
  reference: ''
})

const clienteVazio = () => ({
  name: '',
  companyName: '',
  number: '',
  secondaryPhone: '',
  email: '',
  document: '',
  birthDate: null,
  salesStatus: 'LEAD',
  source: '',
  notes: '',
  address: enderecoVazio()
})

export default {
  name: 'ClientesIndex',
  data () {
    return {
      clientes: [],
      cliente: clienteVazio(),
      modalCliente: false,
      loading: false,
      loadingCep: false,
      saving: false,
      searchParam: '',
      opcoesStatus: [
        { label: 'Lead', value: 'LEAD' },
        { label: 'Cliente', value: 'CUSTOMER' },
        { label: 'Inativo', value: 'INACTIVE' }
      ],
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
  computed: {
    clienteValido () {
      const address = this.cliente.address
      return !!(
        this.cliente.name &&
        this.somenteDigitos(this.cliente.number).length >= 8 &&
        address.zipCode &&
        address.street &&
        address.number &&
        address.district &&
        address.city &&
        address.state.length === 2
      )
    }
  },
  mounted () {
    this.carregar()
  },
  methods: {
    somenteDigitos (value) {
      return (value || '').replace(/\D/g, '')
    },
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
    async abrirCliente (cliente = null) {
      if (!cliente) {
        this.cliente = clienteVazio()
        this.modalCliente = true
        return
      }
      this.loading = true
      try {
        const { data } = await ObterCliente(cliente.id)
        const profile = data.salesProfile || {}
        this.cliente = {
          id: data.id,
          name: data.name || '',
          number: data.number || '',
          email: data.email || '',
          document: profile.document || '',
          secondaryPhone: profile.secondaryPhone || '',
          companyName: profile.companyName || '',
          birthDate: profile.birthDate || null,
          salesStatus: profile.salesStatus || 'LEAD',
          source: profile.source || '',
          notes: profile.notes || '',
          address: data.addresses && data.addresses[0] ? { ...data.addresses[0] } : enderecoVazio()
        }
        this.modalCliente = true
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar o cliente.', error)
      } finally {
        this.loading = false
      }
    },
    async consultarCep () {
      const zipCode = this.somenteDigitos(this.cliente.address.zipCode)
      if (zipCode.length !== 8) return
      this.loadingCep = true
      try {
        const { data } = await ConsultarCep(zipCode)
        this.cliente.address = {
          ...this.cliente.address,
          zipCode,
          street: data.logradouro || '',
          district: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          complement: this.cliente.address.complement || data.complemento || ''
        }
      } catch (error) {
        this.$notificarErro('Nao foi possivel localizar o CEP.', error)
      } finally {
        this.loadingCep = false
      }
    },
    async salvarCliente () {
      this.saving = true
      try {
        const payload = {
          ...this.cliente,
          number: this.somenteDigitos(this.cliente.number),
          document: this.somenteDigitos(this.cliente.document),
          secondaryPhone: this.somenteDigitos(this.cliente.secondaryPhone),
          address: {
            ...this.cliente.address,
            zipCode: this.somenteDigitos(this.cliente.address.zipCode),
            state: this.cliente.address.state.toUpperCase()
          }
        }
        const action = payload.id ? AlterarCliente : CriarCliente
        await action(payload)
        this.modalCliente = false
        await this.carregar()
        this.$q.notify({ type: 'positive', message: 'Cliente salvo.' })
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar o cliente.', error)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
