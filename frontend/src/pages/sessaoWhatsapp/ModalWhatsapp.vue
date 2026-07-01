<template>
  <q-dialog
    :value="modalWhatsapp"
    @hide="fecharModal"
    @show="abrirModal"
    persistent
  >
    <q-card
      class="q-pa-md"
      style="width: 500px"
    >
      <q-card-section>
        <div class="text-h6">
          <q-icon
            size="50px"
            class="q-mr-md"
            name="img:waba-logo.png"
          />
          {{ whatsapp.id ? 'Editar' : 'Adicionar' }} WhatsApp Oficial Meta
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row">
          <div class="col-12 q-mb-md">
            <q-banner class="bg-blue-1 text-primary rounded-borders">
              Cadastre apenas numeros do WhatsApp Business conectados pela API oficial da Meta.
              O Phone Number ID e o token ficam salvos somente no backend deste tenant.
            </q-banner>
          </div>

          <div class="col-12 q-mb-md">
            <q-list
              dense
              bordered
              class="rounded-borders bg-grey-1"
            >
              <q-item>
                <q-item-section avatar>
                  <q-icon
                    color="primary"
                    name="mdi-numeric-1-circle-outline"
                  />
                </q-item-section>
                <q-item-section>Informe o Phone Number ID do numero na Meta.</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon
                    color="primary"
                    name="mdi-numeric-2-circle-outline"
                  />
                </q-item-section>
                <q-item-section>Informe o token permanente de acesso da Meta.</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon
                    color="primary"
                    name="mdi-numeric-3-circle-outline"
                  />
                </q-item-section>
                <q-item-section>Depois de salvar, copie o webhook exibido e cadastre no painel da Meta.</q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 q-mb-md">
            <c-input
              outlined
              rounded
              label="Nome da conexao"
              dense
              v-model="whatsapp.name"
              :validator="v$.whatsapp.name"
              @blur="v$.whatsapp.name.$touch"
            />
          </div>

          <div class="col-12 q-mb-md">
            <c-input
              outlined
              dense
              label="Phone Number ID"
              v-model="whatsapp.fbPageId"
              hint="Exemplo: 123456789012345"
            />
          </div>

          <div class="col-12 q-mb-md">
            <c-input
              outlined
              dense
              label="Token de acesso Meta"
              :type="isPwd ? 'password' : 'text'"
              v-model="whatsapp.tokenAPI"
              hint="Token permanente do usuario de sistema ou app da Meta"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </c-input>
          </div>

          <div
            class="col-12 q-mb-md"
            v-if="whatsapp.UrlWabaWebHook"
          >
            <c-input
              outlined
              dense
              readonly
              label="Webhook para cadastrar na Meta"
              :value="whatsapp.UrlWabaWebHook"
            >
              <template v-slot:after>
                <q-btn
                  round
                  flat
                  color="primary"
                  icon="content_copy"
                  @click="copy(whatsapp.UrlWabaWebHook)"
                />
              </template>
            </c-input>
          </div>
        </div>

        <div class="row q-my-md">
          <div class="col-12 relative-position">
            <label class="text-caption">Mensagem Despedida:</label>
            <textarea
              ref="inputFarewellMessage"
              style="min-height: 15vh; max-height: 15vh;"
              class="q-pa-sm rounded-all bg-white full-width"
              placeholder="Digite a mensagem"
              autogrow
              dense
              outlined
              v-model="whatsapp.farewellMessage"
            />
            <div class="absolute-top-right">
              <q-btn
                rounded
                dense
                color="black"
                style="margin-bottom: -40px; margin-right: -10px"
              >
                <q-icon
                  size="1.5em"
                  name="mdi-variable"
                />
                <q-tooltip>
                  Variaveis
                </q-tooltip>
                <q-menu touch-position>
                  <q-list
                    dense
                    style="min-width: 100px"
                  >
                    <q-item
                      v-for="variavel in variaveis"
                      :key="variavel.label"
                      clickable
                      @click="onInsertSelectVariable(variavel.value)"
                      v-close-popup
                    >
                      <q-item-section>{{ variavel.label }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="center"
        class="q-mt-lg"
      >
        <q-btn
          rounded
          label="Sair"
          class="q-px-md q-mr-lg"
          color="negative"
          v-close-popup
        />
        <q-btn
          label="Salvar"
          color="positive"
          rounded
          class="q-px-md"
          @click="handleSaveWhatsApp(whatsapp)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, maxLength } from '@vuelidate/validators'
import { UpdateWhatsapp, CriarWhatsapp } from 'src/service/sessoesWhatsapp'
import cInput from 'src/components/cInput.vue'
import { copyToClipboard, Notify } from 'quasar'

const emptyWhatsapp = () => ({
  name: '',
  isDefault: false,
  tokenAPI: '',
  fbPageId: '',
  wabaBSP: 'meta',
  type: 'waba',
  farewellMessage: ''
})

export default {
  components: { cInput },
  name: 'ModalWhatsapp',
  setup () {
    return { v$: useVuelidate() }
  },
  props: {
    modalWhatsapp: {
      type: Boolean,
      default: false
    },
    whatsAppId: {
      type: Number,
      default: null
    },
    whatsAppEdit: {
      type: Object,
      default: () => { }
    }
  },
  data () {
    return {
      isPwd: true,
      whatsapp: emptyWhatsapp(),
      variaveis: [
        { label: 'Nome', value: '{{name}}' },
        { label: 'Saudacao', value: '{{greeting}}' },
        { label: 'Protocolo', value: '{{protocol}}' }
      ]
    }
  },
  validations () {
    return {
      whatsapp: {
        name: { required, minLength: minLength(3), maxLength: maxLength(50) },
        isDefault: {}
      }
    }
  },
  methods: {
    copy (text) {
      copyToClipboard(text)
        .then(this.$notificarSucesso('URL de integracao copiada!'))
        .catch()
    },

    onInsertSelectVariable (variable) {
      const tArea = this.$refs.inputFarewellMessage
      const startPos = tArea.selectionStart
      const endPos = tArea.selectionEnd
      const tmpStr = tArea.value

      if (!variable) return

      this.whatsapp.farewellMessage = tmpStr.substring(0, startPos) + variable + tmpStr.substring(endPos, tmpStr.length)

      setTimeout(() => {
        tArea.selectionStart = tArea.selectionEnd = startPos + variable.length
      }, 10)
    },

    fecharModal () {
      this.whatsapp = emptyWhatsapp()
      this.$emit('update:whatsAppEdit', {})
      this.$emit('update:modalWhatsapp', false)
    },

    abrirModal () {
      this.whatsapp = this.whatsAppEdit.id
        ? { ...emptyWhatsapp(), ...this.whatsAppEdit, type: 'waba', wabaBSP: 'meta' }
        : emptyWhatsapp()
    },

    async handleSaveWhatsApp (whatsapp) {
      this.v$.whatsapp.$touch()
      if (this.v$.whatsapp.$error) {
        return this.$q.notify({
          type: 'warning',
          progress: true,
          position: 'top',
          message: 'Ops! Verifique os erros...',
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
      }

      const payload = {
        ...whatsapp,
        type: 'waba',
        wabaBSP: 'meta'
      }

      if (!payload.fbPageId || (!this.whatsAppEdit.id && !payload.tokenAPI)) {
        return this.$q.notify({
          type: 'warning',
          progress: true,
          position: 'top',
          message: 'Informe o Phone Number ID e o token de acesso da Meta.'
        })
      }

      try {
        if (this.whatsAppEdit.id) {
          await UpdateWhatsapp(this.whatsAppEdit.id, payload)
        } else {
          await CriarWhatsapp(payload)
        }
        this.$q.notify({
          type: 'positive',
          progress: true,
          position: 'top',
          message: `Whatsapp ${this.whatsAppEdit.id ? 'editado' : 'criado'} com sucesso!`,
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
        this.$emit('recarregar-lista')
        this.fecharModal()
      } catch (error) {
        console.error(error)
        if (error?.data?.error === 'ERR_NO_PERMISSION_CONNECTIONS_LIMIT') {
          Notify.create({
            type: 'negative',
            message: 'Limite de conexoes atingida.',
            caption: 'ERR_NO_PERMISSION_CONNECTIONS_LIMIT',
            position: 'top',
            progress: true
          })
        } else {
          return this.$q.notify({
            type: 'error',
            progress: true,
            position: 'top',
            message: 'Ops! Verifique os erros... O nome da conexao nao pode existir na plataforma, e um identificador unico.',
            actions: [{
              icon: 'close',
              round: true,
              color: 'white'
            }]
          })
        }
      }
    }
  },
  unmounted () {
    this.v$.whatsapp.$reset()
  }
}
</script>

<style lang="scss" scoped>
</style>
