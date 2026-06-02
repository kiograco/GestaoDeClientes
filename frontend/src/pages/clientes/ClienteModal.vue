<template>
  <q-dialog :value="value" persistent @hide="$emit('input', false)">
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
        <q-btn flat rounded label="Cancelar" @click="$emit('input', false)" />
        <q-btn rounded color="primary" label="Salvar" :disable="!clienteValido" :loading="saving" @click="salvarCliente" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { AlterarCliente, ConsultarCep, CriarCliente, ObterCliente } from 'src/service/clientes'

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
  name: 'ClienteModal',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    contactId: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      cliente: clienteVazio(),
      loadingCep: false,
      saving: false,
      opcoesStatus: [
        { label: 'Lead', value: 'LEAD' },
        { label: 'Cliente', value: 'CUSTOMER' },
        { label: 'Inativo', value: 'INACTIVE' }
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
  watch: {
    value (opened) {
      if (opened) this.carregarCliente()
    }
  },
  methods: {
    somenteDigitos (value) {
      return (value || '').replace(/\D/g, '')
    },
    async carregarCliente () {
      this.cliente = clienteVazio()
      if (!this.contactId) return
      try {
        const { data } = await ObterCliente(this.contactId)
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
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar o cliente.', error)
        this.$emit('input', false)
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
        const { data } = await action(payload)
        this.$emit('saved', data)
        this.$emit('input', false)
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
