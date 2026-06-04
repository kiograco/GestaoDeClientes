<template>
  <q-dialog :value="value" persistent @hide="$emit('input', false)">
    <q-card class="cliente-modal app-card">
      <q-card-section class="cliente-modal__header">
        <div>
          <div class="cliente-modal__eyebrow">Cadastro comercial</div>
          <div class="cliente-modal__title">{{ cliente.id ? 'Editar cliente' : 'Novo cliente' }}</div>
          <div class="cliente-modal__subtitle">
            Organize os dados de contato, qualificacao e endereco do cliente.
          </div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="mdi-close"
          class="app-icon-btn"
          @click="$emit('input', false)"
        >
          <q-tooltip>Fechar</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-separator />

      <q-card-section class="cliente-modal__body">
        <section class="cliente-section">
          <div class="cliente-section__header">
            <q-icon name="mdi-account-outline" />
            <div>
              <div class="cliente-section__title">Dados principais</div>
              <div class="cliente-section__description">Informacoes usadas para identificar e segmentar o cliente.</div>
            </div>
          </div>
          <div class="row q-col-gutter-md">
          <q-input v-model.trim="cliente.name" outlined label="Nome *" class="col-12 col-md-6" />
          <q-input v-model.trim="cliente.companyName" outlined label="Empresa" class="col-12 col-md-6" />
          <q-input v-model.trim="cliente.number" outlined label="WhatsApp ou telefone *" class="col-12 col-md-4" />
          <q-input v-model.trim="cliente.secondaryPhone" outlined label="Telefone alternativo" class="col-12 col-md-4" />
          <q-input v-model.trim="cliente.email" outlined label="E-mail" class="col-12 col-md-4" />
          <q-input v-model.trim="cliente.document" outlined label="CPF ou CNPJ" class="col-12 col-md-4" />
          <q-input v-model="cliente.birthDate" outlined type="date" label="Data de nascimento" class="col-12 col-md-4" />
          <q-select
            v-model="cliente.salesStatus"
            :options="opcoesStatus"
            emit-value
            map-options
            outlined
            label="Situacao comercial"
            class="col-12 col-md-4"
          />
          <q-input v-model.trim="cliente.source" outlined label="Origem do cliente" class="col-12" />
          </div>
        </section>

        <section class="cliente-section">
          <div class="cliente-section__header">
            <q-icon name="mdi-map-marker-outline" />
            <div>
              <div class="cliente-section__title">Endereco principal</div>
              <div class="cliente-section__description">Campos obrigatorios ajudam em entregas, visitas e roteamento.</div>
            </div>
          </div>
          <div class="row q-col-gutter-md">
          <q-input
            v-model.trim="cliente.address.zipCode"
            outlined
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
          <q-input v-model.trim="cliente.address.street" outlined label="Logradouro *" class="col-12 col-md-6" />
          <q-input v-model.trim="cliente.address.number" outlined label="Numero *" class="col-12 col-md-3" />
          <q-input v-model.trim="cliente.address.district" outlined label="Bairro *" class="col-12 col-md-4" />
          <q-input v-model.trim="cliente.address.city" outlined label="Cidade *" class="col-12 col-md-4" />
          <q-input v-model.trim="cliente.address.state" outlined maxlength="2" label="UF *" class="col-12 col-md-2" />
          <q-input v-model.trim="cliente.address.complement" outlined label="Complemento" class="col-12 col-md-6" />
          <q-input v-model.trim="cliente.address.reference" outlined label="Referencia" class="col-12 col-md-6" />
          </div>
        </section>

        <section class="cliente-section">
          <div class="cliente-section__header">
            <q-icon name="mdi-note-text-outline" />
            <div>
              <div class="cliente-section__title">Observacoes</div>
              <div class="cliente-section__description">Contexto comercial visivel para vendas e atendimento.</div>
            </div>
          </div>
          <q-input
            v-model.trim="cliente.notes"
            outlined
            type="textarea"
            autogrow
            label="Observacoes comerciais"
          />
        </section>
      </q-card-section>

      <q-separator />

      <q-card-actions class="cliente-modal__actions">
        <div class="cliente-modal__hint">
          Campos marcados com * sao obrigatorios.
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat label="Cancelar" @click="$emit('input', false)" />
          <q-btn unelevated color="primary" label="Salvar cliente" :disable="!clienteValido" :loading="saving" @click="salvarCliente" />
        </div>
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

<style lang="scss" scoped>
.cliente-modal {
  width: 980px;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.cliente-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
}

.cliente-modal__eyebrow {
  color: var(--color-primary-600);
  font-size: 12px;
  line-height: 16px;
  font-weight: 750;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.cliente-modal__title {
  color: var(--text-primary);
  font-size: 22px;
  line-height: 30px;
  font-weight: 750;
  margin-top: 2px;
}

.cliente-modal__subtitle {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 22px;
  margin-top: 4px;
}

.cliente-modal__body {
  padding: 22px 24px;
  overflow-y: auto;
}

.cliente-section {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.cliente-section + .cliente-section {
  margin-top: 16px;
}

.cliente-section__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.cliente-section__header .q-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-size: 20px;
}

.cliente-section__title {
  color: var(--text-primary);
  font-size: 15px;
  line-height: 22px;
  font-weight: 750;
}

.cliente-section__description {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 20px;
}

.cliente-modal__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: var(--surface-muted);
}

.cliente-modal__hint {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 700px) {
  .cliente-modal {
    max-width: 100vw;
    max-height: 100vh;
  }

  .cliente-modal__header,
  .cliente-modal__body,
  .cliente-modal__actions {
    padding-left: 16px;
    padding-right: 16px;
  }

  .cliente-section {
    padding: 14px;
  }

  .cliente-modal__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .cliente-modal__actions .row {
    justify-content: flex-end;
  }
}
</style>
