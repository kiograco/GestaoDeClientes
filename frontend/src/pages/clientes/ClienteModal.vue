<template>
  <q-dialog :model-value="modelValue" persistent @hide="$emit('update:modelValue', false)">
    <q-card class="cliente-modal app-card">
      <q-card-section class="cliente-modal__header">
        <div>
          <div class="cliente-modal__eyebrow">Cadastro de clientes</div>
          <div class="cliente-modal__title">{{ cliente.id ? 'Editar cliente' : 'Novo cliente' }}</div>
          <div class="cliente-modal__subtitle">
            Centralize dados fiscais, enderecos e contatos operacionais.
          </div>
        </div>
        <q-btn flat round dense icon="mdi-close" class="app-icon-btn" @click="$emit('update:modelValue', false)">
          <q-tooltip>Fechar</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-tabs v-model="tab" dense align="left" class="cliente-tabs" active-color="primary" indicator-color="primary">
        <q-tab name="dados" icon="mdi-card-account-details-outline" label="Dados" />
        <q-tab name="enderecos" icon="mdi-map-marker-outline" label="Enderecos" />
        <q-tab name="areas" icon="mdi-floor-plan" label="Areas" />
        <q-tab name="contatos" icon="mdi-account-multiple-outline" label="Contatos" />
        <q-tab name="observacoes" icon="mdi-note-text-outline" label="Observacoes" />
      </q-tabs>
      <q-separator />

      <q-card-section class="cliente-modal__body">
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="dados" class="q-pa-none">
            <section class="cliente-section">
              <div class="cliente-section__header">
                <q-icon name="mdi-domain" />
                <div>
                  <div class="cliente-section__title">Informacoes basicas</div>
                  <div class="cliente-section__description">Dados usados em OS, contratos, garantias e relatorios.</div>
                </div>
              </div>
              <div class="row q-col-gutter-md">
                <q-select
                  v-model="cliente.registrationType"
                  :options="opcoesTipo"
                  emit-value
                  map-options
                  outlined
                  label="Tipo de cadastro *"
                  class="col-12 col-md-4"
                />
                <q-select
                  v-model="cliente.status"
                  :options="opcoesStatus"
                  emit-value
                  map-options
                  outlined
                  label="Status"
                  class="col-12 col-md-4"
                />
                <q-input
                  v-model.trim="cliente.document"
                  outlined
                  label="CPF/CNPJ"
                  class="col-12 col-md-4"
                  @blur="consultarCnpj"
                >
                  <template v-slot:append>
                    <q-btn
                      flat
                      round
                      dense
                      icon="mdi-cloud-search-outline"
                      :loading="loadingCnpj"
                      @click="consultarCnpj"
                    >
                      <q-tooltip>Buscar dados do CNPJ</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
                <q-input v-model.trim="cliente.legalName" outlined label="Nome/Razao Social *" class="col-12 col-md-6" />
                <q-input v-model.trim="cliente.tradeName" outlined label="Nome Fantasia" class="col-12 col-md-6" />
                <q-input v-model.trim="cliente.stateRegistration" outlined label="Inscricao Estadual" class="col-12 col-md-4" />
                <q-input v-model.trim="cliente.municipalRegistration" outlined label="Inscricao Municipal" class="col-12 col-md-4" />
                <q-input v-model.trim="cliente.activitySector" outlined label="Ramo de Atividade / CNAE" class="col-12 col-md-4" />
              </div>
            </section>
          </q-tab-panel>

          <q-tab-panel name="enderecos" class="q-pa-none">
            <section class="cliente-section">
              <div class="cliente-section__header cliente-section__header--action">
                <div class="cliente-section__title-wrap">
                  <q-icon name="mdi-map-marker-outline" />
                  <div>
                    <div class="cliente-section__title">Enderecos</div>
                    <div class="cliente-section__description">Cadastre matriz, filiais, condominios e locais de atendimento.</div>
                  </div>
                </div>
                <q-btn outline color="primary" icon="mdi-plus" label="Endereco" @click="adicionarEndereco" />
              </div>

              <div v-for="(endereco, index) in cliente.addresses" :key="endereco._key" class="cliente-repeat">
                <div class="cliente-repeat__header">
                  <div>Endereco {{ index + 1 }}</div>
                  <q-btn
                    v-if="cliente.addresses.length > 1"
                    flat
                    round
                    dense
                    color="negative"
                    icon="mdi-delete-outline"
                    @click="removerEndereco(index)"
                  >
                    <q-tooltip>Remover endereco</q-tooltip>
                  </q-btn>
                </div>
                <div class="row q-col-gutter-md">
                  <q-input v-model.trim="endereco.addressType" outlined label="Tipo de endereco" class="col-12 col-md-4" />
                  <q-input v-model.trim="endereco.linkedDocument" outlined label="CNPJ vinculado" class="col-12 col-md-4" />
                  <q-input
                    v-model.trim="endereco.zipCode"
                    outlined
                    mask="#####-###"
                    unmasked-value
                    label="CEP"
                    class="col-12 col-md-4"
                    @blur="consultarCep(index)"
                  >
                    <template v-slot:append>
                      <q-btn flat round dense icon="mdi-magnify" :loading="loadingCepIndex === index" @click="consultarCep(index)" />
                    </template>
                  </q-input>
                  <q-input v-model.trim="endereco.street" outlined label="Rua" class="col-12 col-md-6" />
                  <q-input v-model.trim="endereco.number" outlined label="Numero" class="col-12 col-md-2" />
                  <q-input v-model.trim="endereco.complement" outlined label="Complemento" class="col-12 col-md-4" />
                  <q-input v-model.trim="endereco.district" outlined label="Bairro" class="col-12 col-md-4" />
                  <q-input v-model.trim="endereco.city" outlined label="Cidade" class="col-12 col-md-4" />
                  <q-input v-model.trim="endereco.state" outlined maxlength="2" label="Estado" class="col-12 col-md-2" />
                  <q-input v-model.trim="endereco.reference" outlined label="Referencia" class="col-12 col-md-6" />
                  <q-input v-model.trim="endereco.notes" outlined label="Observacoes do endereco" class="col-12" />
                </div>
              </div>
            </section>
          </q-tab-panel>

          <q-tab-panel name="areas" class="q-pa-none">
            <section class="cliente-section">
              <div class="cliente-section__header cliente-section__header--action">
                <div class="cliente-section__title-wrap">
                  <q-icon name="mdi-floor-plan" />
                  <div>
                    <div class="cliente-section__title">Areas operacionais</div>
                    <div class="cliente-section__description">Mapeie cozinhas, estoques, jardins e setores atendidos por endereco.</div>
                  </div>
                </div>
                <q-btn outline color="primary" icon="mdi-plus" label="Area" @click="adicionarArea" />
              </div>

              <div v-if="!cliente.areas.length" class="cliente-empty">
                Nenhuma area cadastrada.
              </div>

              <div v-for="(area, areaIndex) in cliente.areas" :key="area._key" class="cliente-repeat">
                <div class="cliente-repeat__header">
                  <div>{{ area.name || `Area ${areaIndex + 1}` }}</div>
                  <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="removerArea(areaIndex)">
                    <q-tooltip>Remover area</q-tooltip>
                  </q-btn>
                </div>
                <div class="row q-col-gutter-md">
                  <q-select
                    v-model="area.addressKey"
                    :options="opcoesEndereco"
                    emit-value
                    map-options
                    outlined
                    label="Endereco vinculado *"
                    class="col-12 col-md-4"
                  />
                  <q-input v-model.trim="area.name" outlined label="Nome da area *" class="col-12 col-md-4" />
                  <q-input v-model.trim="area.areaType" outlined label="Tipo da area" class="col-12 col-md-4" />
                  <q-select
                    v-model="area.services"
                    :options="opcoesServicosArea"
                    outlined
                    multiple
                    use-chips
                    use-input
                    new-value-mode="add-unique"
                    label="Servicos por area"
                    class="col-12"
                  />
                  <q-input v-model.trim="area.description" outlined type="textarea" autogrow label="Descricao" class="col-12 col-md-6" />
                  <q-input v-model.trim="area.notes" outlined type="textarea" autogrow label="Observacoes" class="col-12 col-md-6" />
                </div>

                <div class="cliente-subsection">
                  <div class="cliente-subsection__header">
                    <div>Setores</div>
                    <q-btn flat color="primary" icon="mdi-plus" label="Setor" @click="adicionarSetor(areaIndex)" />
                  </div>
                  <div v-if="!area.sectors.length" class="cliente-empty cliente-empty--compact">
                    Nenhum setor cadastrado.
                  </div>
                  <div v-for="(setor, setorIndex) in area.sectors" :key="setor._key" class="cliente-sector">
                    <q-input v-model.trim="setor.name" outlined dense label="Nome do setor *" class="col-grow" />
                    <q-input v-model.trim="setor.description" outlined dense label="Descricao" class="col-grow" />
                    <q-input v-model.trim="setor.notes" outlined dense label="Observacoes" class="col-grow" />
                    <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="removerSetor(areaIndex, setorIndex)">
                      <q-tooltip>Remover setor</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>
            </section>
          </q-tab-panel>

          <q-tab-panel name="contatos" class="q-pa-none">
            <section class="cliente-section">
              <div class="cliente-section__header cliente-section__header--action">
                <div class="cliente-section__title-wrap">
                  <q-icon name="mdi-account-multiple-outline" />
                  <div>
                    <div class="cliente-section__title">Contatos</div>
                    <div class="cliente-section__description">Vincule responsaveis, compradores, zeladores e contatos tecnicos.</div>
                  </div>
                </div>
                <q-btn outline color="primary" icon="mdi-plus" label="Contato" @click="adicionarContato" />
              </div>

              <div v-if="!cliente.contacts.length" class="cliente-empty">
                Nenhum contato cadastrado.
              </div>

              <div v-for="(contato, index) in cliente.contacts" :key="contato._key" class="cliente-repeat">
                <div class="cliente-repeat__header">
                  <div>Contato {{ index + 1 }}</div>
                  <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="removerContato(index)">
                    <q-tooltip>Remover contato</q-tooltip>
                  </q-btn>
                </div>
                <div class="row q-col-gutter-md">
                  <q-input v-model.trim="contato.name" outlined label="Nome *" class="col-12 col-md-4" />
                  <q-input v-model.trim="contato.role" outlined label="Cargo" class="col-12 col-md-4" />
                  <q-select
                    v-model="contato.addressKey"
                    :options="opcoesEndereco"
                    emit-value
                    map-options
                    outlined
                    clearable
                    label="Endereco vinculado"
                    class="col-12 col-md-4"
                  />
                  <q-input v-model.trim="contato.phone" outlined label="Telefone" class="col-12 col-md-4" />
                  <q-input v-model.trim="contato.whatsapp" outlined label="WhatsApp" class="col-12 col-md-4" />
                  <q-input v-model.trim="contato.email" outlined label="E-mail" class="col-12 col-md-4" />
                  <q-input v-model.trim="contato.notes" outlined label="Observacoes do contato" class="col-12" />
                </div>
              </div>
            </section>
          </q-tab-panel>

          <q-tab-panel name="observacoes" class="q-pa-none">
            <section class="cliente-section">
              <div class="cliente-section__header">
                <q-icon name="mdi-note-text-outline" />
                <div>
                  <div class="cliente-section__title">Observacoes</div>
                  <div class="cliente-section__description">Notas administrativas para atendimento e operacao.</div>
                </div>
              </div>
              <q-input v-model.trim="cliente.notes" outlined type="textarea" autogrow label="Observacoes" />
            </section>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions class="cliente-modal__actions">
        <div class="cliente-modal__hint">Campos marcados com * sao obrigatorios.</div>
        <div class="row q-gutter-sm">
          <q-btn flat label="Cancelar" @click="$emit('update:modelValue', false)" />
          <q-btn unelevated color="primary" label="Salvar cliente" :disable="!clienteValido" :loading="saving" @click="salvarCliente" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { AlterarCliente, ConsultarCep, ConsultarCnpj, CriarCliente, ObterCliente } from 'src/service/clientes'

let localKey = 0

const novoKey = prefix => `${prefix}-${Date.now()}-${localKey++}`

const enderecoVazio = () => ({
  _key: novoKey('endereco'),
  addressType: 'Principal',
  linkedDocument: '',
  zipCode: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: '',
  complement: '',
  reference: '',
  notes: ''
})

const contatoVazio = () => ({
  _key: novoKey('contato'),
  name: '',
  role: '',
  phone: '',
  whatsapp: '',
  email: '',
  addressKey: null,
  notes: ''
})

const setorVazio = () => ({
  _key: novoKey('setor'),
  name: '',
  description: '',
  notes: ''
})

const areaVazia = () => ({
  _key: novoKey('area'),
  addressKey: null,
  name: '',
  areaType: '',
  description: '',
  notes: '',
  services: [],
  sectors: []
})

const clienteVazio = () => ({
  registrationType: 'person',
  legalName: '',
  tradeName: '',
  document: '',
  stateRegistration: '',
  municipalRegistration: '',
  activitySector: '',
  status: 'prospect',
  notes: '',
  addresses: [enderecoVazio()],
  areas: [],
  contacts: []
})

export default {
  name: 'ClienteModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    clientId: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      cliente: clienteVazio(),
      tab: 'dados',
      loadingCepIndex: null,
      loadingCnpj: false,
      saving: false,
      opcoesTipo: [
        { label: 'Pessoa Fisica', value: 'person' },
        { label: 'Pessoa Juridica', value: 'legal_entity' },
        { label: 'Condominio', value: 'condominium' },
        { label: 'Empresa', value: 'company' }
      ],
      opcoesStatus: [
        { label: 'Prospect', value: 'prospect' },
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
      ],
      opcoesServicosArea: [
        'Controle de Baratas',
        'Controle de Formigas',
        'Controle de Roedores',
        'Controle de Cupins',
        'Sanitizacao',
        'Monitoramento',
        'Desratizacao',
        'Desinsetizacao'
      ]
    }
  },
  computed: {
    clienteValido () {
      return !!(
        this.cliente.registrationType &&
        this.cliente.legalName &&
        this.cliente.areas.every(area => area.name && area.addressKey && area.sectors.every(setor => setor.name)) &&
        this.cliente.contacts.every(contato => contato.name)
      )
    },
    opcoesEndereco () {
      return this.cliente.addresses.map((endereco, index) => ({
        label: `${endereco.addressType || 'Endereco'} - ${endereco.street || 'sem rua'}`,
        value: endereco.id ? `id-${endereco.id}` : `index-${index}`
      }))
    }
  },
  watch: {
    modelValue (opened) {
      if (opened) this.carregarCliente()
    }
  },
  methods: {
    somenteDigitos (value) {
      return (value || '').replace(/\D/g, '')
    },
    async carregarCliente () {
      this.tab = 'dados'
      this.cliente = clienteVazio()
      if (!this.clientId) return
      try {
        const { data } = await ObterCliente(this.clientId)
        const addresses = (data.addresses || []).map(address => ({
          ...address,
          _key: novoKey('endereco')
        }))
        const areas = addresses.flatMap(address => (address.areas || []).map(area => ({
          ...area,
          _key: novoKey('area'),
          addressKey: `id-${address.id}`,
          services: (area.services || []).map(service => service.serviceName),
          sectors: (area.sectors || []).map(sector => ({
            ...sector,
            _key: novoKey('setor')
          }))
        })))
        this.cliente = {
          id: data.id,
          registrationType: data.registrationType || 'person',
          legalName: data.legalName || '',
          tradeName: data.tradeName || '',
          document: data.document || '',
          stateRegistration: data.stateRegistration || '',
          municipalRegistration: data.municipalRegistration || '',
          activitySector: data.activitySector || '',
          status: data.status || 'prospect',
          notes: data.notes || '',
          addresses: addresses.length ? addresses : [enderecoVazio()],
          areas,
          contacts: (data.contacts || []).map(contact => ({
            ...contact,
            _key: novoKey('contato'),
            addressKey: contact.addressId ? `id-${contact.addressId}` : null
          }))
        }
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar o cliente.', error)
        this.$emit('update:modelValue', false)
      }
    },
    async consultarCnpj () {
      const cnpj = this.somenteDigitos(this.cliente.document)
      if (cnpj.length !== 14) return
      this.loadingCnpj = true
      try {
        const { data } = await ConsultarCnpj(cnpj)
        this.cliente = {
          ...this.cliente,
          registrationType: this.cliente.registrationType === 'person' ? 'legal_entity' : this.cliente.registrationType,
          legalName: this.cliente.legalName || data.legalName || '',
          tradeName: this.cliente.tradeName || data.tradeName || '',
          activitySector: this.cliente.activitySector || data.activitySector || ''
        }
        const endereco = this.cliente.addresses[0] || enderecoVazio()
        this.cliente.addresses[0] = {
          ...endereco,
          linkedDocument: endereco.linkedDocument || cnpj,
          zipCode: endereco.zipCode || data.zipCode || '',
          street: endereco.street || data.street || '',
          number: endereco.number || data.number || '',
          complement: endereco.complement || data.complement || '',
          district: endereco.district || data.district || '',
          city: endereco.city || data.city || '',
          state: endereco.state || data.state || ''
        }
      } catch (error) {
        const status = error?.status || error?.response?.status
        const code = error?.data?.error || error?.response?.data?.error
        if (status === 404 || code === 'ERR_CNPJ_NOT_FOUND') {
          this.$q.notify({
            type: 'warning',
            message: 'CNPJ nao encontrado na consulta publica. Preencha os dados manualmente.'
          })
          return
        }
        this.$q.notify({
          type: 'negative',
          message: 'Nao foi possivel consultar o CNPJ. Preencha os dados manualmente.'
        })
      } finally {
        this.loadingCnpj = false
      }
    },
    async consultarCep (index) {
      const endereco = this.cliente.addresses[index]
      const zipCode = this.somenteDigitos(endereco.zipCode)
      if (zipCode.length !== 8) return
      this.loadingCepIndex = index
      try {
        const { data } = await ConsultarCep(zipCode)
        this.cliente.addresses[index] = {
          ...endereco,
          zipCode,
          street: endereco.street || data.logradouro || '',
          district: endereco.district || data.bairro || '',
          city: endereco.city || data.localidade || '',
          state: endereco.state || data.uf || '',
          complement: endereco.complement || data.complemento || ''
        }
      } catch (error) {
        this.$notificarErro('Nao foi possivel localizar o CEP.', error)
      } finally {
        this.loadingCepIndex = null
      }
    },
    adicionarEndereco () {
      this.cliente.addresses.push(enderecoVazio())
    },
    removerEndereco (index) {
      this.cliente.addresses.splice(index, 1)
      this.cliente.areas = this.cliente.areas.map(area => ({
        ...area,
        addressKey: area.addressKey && area.addressKey.startsWith('index-') ? null : area.addressKey
      }))
      this.cliente.contacts = this.cliente.contacts.map(contact => ({
        ...contact,
        addressKey: contact.addressKey && contact.addressKey.startsWith('index-') ? null : contact.addressKey
      }))
    },
    adicionarArea () {
      const area = areaVazia()
      area.addressKey = this.opcoesEndereco[0]?.value || null
      this.cliente.areas.push(area)
    },
    removerArea (index) {
      this.cliente.areas.splice(index, 1)
    },
    adicionarSetor (areaIndex) {
      this.cliente.areas[areaIndex].sectors.push(setorVazio())
    },
    removerSetor (areaIndex, setorIndex) {
      this.cliente.areas[areaIndex].sectors.splice(setorIndex, 1)
    },
    adicionarContato () {
      this.cliente.contacts.push(contatoVazio())
    },
    removerContato (index) {
      this.cliente.contacts.splice(index, 1)
    },
    montarPayload () {
      return {
        ...this.cliente,
        document: this.somenteDigitos(this.cliente.document),
        addresses: this.cliente.addresses.map(endereco => ({
          id: endereco.id,
          addressType: endereco.addressType,
          linkedDocument: this.somenteDigitos(endereco.linkedDocument),
          zipCode: this.somenteDigitos(endereco.zipCode),
          street: endereco.street,
          number: endereco.number,
          complement: endereco.complement,
          district: endereco.district,
          city: endereco.city,
          state: (endereco.state || '').toUpperCase(),
          reference: endereco.reference,
          notes: endereco.notes
        })),
        contacts: this.cliente.contacts.map(contato => {
          const addressId = contato.addressKey && contato.addressKey.startsWith('id-')
            ? Number(contato.addressKey.replace('id-', ''))
            : null
          const addressIndex = contato.addressKey && contato.addressKey.startsWith('index-')
            ? Number(contato.addressKey.replace('index-', ''))
            : null
          return {
            id: contato.id,
            addressId,
            addressIndex,
            name: contato.name,
            role: contato.role,
            phone: this.somenteDigitos(contato.phone),
            whatsapp: this.somenteDigitos(contato.whatsapp),
            email: contato.email,
            notes: contato.notes
          }
        }),
        areas: this.cliente.areas.map(area => {
          const addressId = area.addressKey && area.addressKey.startsWith('id-')
            ? Number(area.addressKey.replace('id-', ''))
            : null
          const addressIndex = area.addressKey && area.addressKey.startsWith('index-')
            ? Number(area.addressKey.replace('index-', ''))
            : null
          return {
            id: area.id,
            addressId,
            addressIndex,
            name: area.name,
            areaType: area.areaType,
            description: area.description,
            notes: area.notes,
            services: area.services,
            sectors: area.sectors.map(setor => ({
              id: setor.id,
              name: setor.name,
              description: setor.description,
              notes: setor.notes
            }))
          }
        })
      }
    },
    async salvarCliente () {
      this.saving = true
      try {
        const payload = this.montarPayload()
        const action = payload.id ? AlterarCliente : CriarCliente
        const { data } = await action(payload)
        this.$emit('saved', data)
        this.$emit('update:modelValue', false)
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
  width: 1080px;
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

.cliente-tabs {
  padding: 0 18px;
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

.cliente-section__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.cliente-section__header--action {
  justify-content: space-between;
  gap: 16px;
}

.cliente-section__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cliente-section__header .q-icon,
.cliente-section__title-wrap .q-icon {
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

.cliente-repeat {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
}

.cliente-repeat + .cliente-repeat {
  margin-top: 14px;
}

.cliente-repeat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 20px;
  font-weight: 750;
  margin-bottom: 14px;
}

.cliente-empty {
  padding: 18px;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
}

.cliente-empty--compact {
  padding: 12px;
  margin-bottom: 10px;
}

.cliente-subsection {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.cliente-subsection__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 20px;
  font-weight: 750;
  margin-bottom: 12px;
}

.cliente-sector {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) minmax(160px, 1fr) minmax(160px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.cliente-sector + .cliente-sector {
  margin-top: 10px;
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

  .cliente-section,
  .cliente-repeat {
    padding: 14px;
  }

  .cliente-sector {
    grid-template-columns: 1fr;
  }

  .cliente-section__header--action,
  .cliente-modal__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .cliente-modal__actions .row {
    justify-content: flex-end;
  }
}
</style>
