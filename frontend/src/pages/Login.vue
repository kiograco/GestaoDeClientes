<template>
  <q-layout class="vertical-center login-layout">
    <q-page-container>
      <q-page class="flex justify-center items-center">
        <q-ajax-bar
          position="top"
          color="primary"
          size="5px"
        />
        <q-card
          bordered
          class="card q-pa-md shadow-10"
          style="border-top: 5px solid #3E72AF; background-color: rgba(255,255,255,0.75); border-radius: 20px"
        >
          <q-card-section class="text-primary text-center">
            <q-img
              :src="logoUrl"
              spinner-color="white"
              contain
              style="width: 360px; max-width: 100%; aspect-ratio: 4 / 1"
              class="q-mb-lg"
            />
            <q-separator spaced />
          </q-card-section>
          <q-card-section class="text-primary">
            <div class="text-h6">Bem vindo!</div>
            <div class="text-caption text-grey">Faça login...</div>
          </q-card-section>

          <q-card-section>
            <q-input
              class="q-mb-md"
              clearable
              rounded
              v-model="form.email"
              placeholder="meu@email.com"
              @blur="v$.form.email.$touch(); consultarIdentidadeVisual()"
              :error="v$.form.email.$error"
              error-message="Deve ser um e-mail válido."
              outlined
              @keypress.enter="fazerLogin"
            >
              <template v-slot:prepend>
                <q-icon
                  name="mdi-email-outline"
                  class="cursor-pointer"
                  color='primary'
                />
              </template>
            </q-input>

            <q-input
              outlined
              rounded
              v-model="form.password"
              :type="isPwd ? 'password' : 'text'"
              @keypress.enter="fazerLogin"
            >
              <template v-slot:prepend>
                <q-icon
                  name="mdi-shield-key-outline"
                  class="cursor-pointer"
                  color='primary'
                />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
          </q-card-section>
          <q-card-actions>
            <q-space />
            <q-btn
              class="q-mr-sm q-my-lg"
              style="width: 150px"
              color="primary"
              rounded
              :loading="loading"
              @click="fazerLogin"
            >
              Login
              <template #loading><span>
                <q-spinner-puff class="on-left" />Logando...
              </span></template>
            </q-btn>
          </q-card-actions>
          <q-btn
            flat
            color="info"
            no-caps
            dense
            class="q-px-sm"
            label="Esqueci a senha"
            @click="modalEsqueciSenha=true"
          />
          <q-btn
            outline
            color="primary"
            no-caps
            rounded
            class="full-width q-mt-md"
            label="Criar conta e contratar plano"
            @click="abrirCadastro"
          />

          <q-dialog v-model="modalCadastro" persistent maximized>
            <q-card class="signup-dialog">
              <q-card-section class="row items-center q-col-gutter-md">
                <div class="col">
                  <div class="text-h6">Criar conta e contratar plano</div>
                  <div class="text-caption text-grey-7">
                    Informe os dados cadastrais para liberar a empresa e gerar a cobrança.
                  </div>
                </div>
                <div class="col-auto">
                  <q-btn flat round dense icon="close" color="grey-8" @click="modalCadastro=false" />
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pa-md">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-option-group
                      v-model="cadastro.personType"
                      :options="tipoPessoaOptions"
                      color="primary"
                      inline
                      @input="sincronizarPessoa"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="cadastro.businessType"
                      :options="tipoNegocioOptions"
                      emit-value
                      map-options
                      outlined
                      dense
                      label="Tipo de negocio"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="cadastro.paymentMethod"
                      :options="metodosPagamentoOptions"
                      emit-value
                      map-options
                      outlined
                      dense
                      label="Forma de pagamento"
                    />
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-lg q-mb-sm">Plano</div>
                <div class="row q-col-gutter-md">
                  <div
                    v-for="plano in planosCadastro"
                    :key="plano.id"
                    class="col-12 col-md-4"
                  >
                    <q-card
                      bordered
                      flat
                      class="plan-card cursor-pointer"
                      :class="{ 'plan-card--active': cadastro.planId === plano.id }"
                      tabindex="0"
                      @click="cadastro.planId = plano.id"
                      @keyup.enter="cadastro.planId = plano.id"
                      @keyup.space="cadastro.planId = plano.id"
                    >
                      <q-card-section>
                        <div class="row no-wrap items-start">
                          <q-radio
                            v-model="cadastro.planId"
                            :val="plano.id"
                            color="primary"
                            dense
                            class="q-mr-sm"
                          />
                          <div class="col">
                            <div class="text-subtitle1 text-weight-medium">{{ plano.name }}</div>
                            <div class="text-h6 text-primary">{{ formatarPrecoPlano(plano) }}</div>
                          </div>
                        </div>
                        <div class="text-caption text-grey-7">{{ plano.durationDays }} dias de acesso</div>
                        <div class="text-caption text-grey-7 q-mt-xs">
                          {{ plano.limits && plano.limits.maxUsers ? plano.limits.maxUsers : 'Sem limite definido' }} usuarios
                          <span v-if="plano.limits && plano.limits.maxConnections">
                            - {{ plano.limits.maxConnections }} conexoes
                          </span>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div v-if="!planosCadastro.length" class="col-12">
                    <q-banner class="bg-grey-2 text-grey-8">
                      Nenhum plano ativo foi encontrado. Entre em contato com o suporte.
                    </q-banner>
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-lg q-mb-sm">
                  {{ cadastro.personType === 'pj' ? 'Dados da empresa' : 'Dados da pessoa fisica' }}
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model.trim="cadastro.company.name" outlined dense :label="cadastro.personType === 'pj' ? 'Razao social' : 'Nome completo'" />
                  </div>
                  <div v-if="cadastro.personType === 'pj'" class="col-12 col-md-6">
                    <q-input v-model.trim="cadastro.company.tradeName" outlined dense label="Nome fantasia" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.company.document" outlined dense :label="cadastro.personType === 'pj' ? 'CNPJ' : 'CPF'" />
                  </div>
                  <div v-if="cadastro.personType === 'pj'" class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.company.stateRegistration" outlined dense label="Inscricao estadual" />
                  </div>
                  <div v-if="cadastro.personType === 'pj'" class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.company.municipalRegistration" outlined dense label="Inscricao municipal" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.company.segment" outlined dense label="Segmento" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.company.phone" outlined dense label="Telefone comercial" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model.trim="cadastro.company.email" outlined dense label="E-mail comercial" />
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-lg q-mb-sm">Responsavel financeiro</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input v-model.trim="cadastro.responsible.name" outlined dense label="Nome do responsavel" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.responsible.document" outlined dense label="CPF do responsavel" />
                  </div>
                  <div class="col-12 col-md-2">
                    <q-input v-model.trim="cadastro.responsible.phone" outlined dense label="Telefone" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.responsible.email" outlined dense label="E-mail" />
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-lg q-mb-sm">Endereco de cobranca</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-2">
                    <q-input v-model.trim="cadastro.address.zipCode" outlined dense label="CEP" />
                  </div>
                  <div class="col-12 col-md-5">
                    <q-input v-model.trim="cadastro.address.street" outlined dense label="Logradouro" />
                  </div>
                  <div class="col-12 col-md-2">
                    <q-input v-model.trim="cadastro.address.number" outlined dense label="Numero" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.address.complement" outlined dense label="Complemento" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model.trim="cadastro.address.district" outlined dense label="Bairro" />
                  </div>
                  <div class="col-12 col-md-5">
                    <q-input v-model.trim="cadastro.address.city" outlined dense label="Cidade" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input v-model.trim="cadastro.address.state" outlined dense label="UF" maxlength="2" />
                  </div>
                </div>

                <div class="text-subtitle2 q-mt-lg q-mb-sm">Usuario administrador</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input v-model.trim="cadastro.admin.name" outlined dense label="Nome do admin" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model.trim="cadastro.admin.email" outlined dense label="E-mail de acesso" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="cadastro.admin.password" outlined dense label="Senha" type="password" />
                  </div>
                </div>

                <q-checkbox
                  v-model="cadastro.acceptedTerms"
                  class="q-mt-md"
                  color="primary"
                  label="Confirmo que os dados informados estao corretos e autorizo a criacao da conta."
                />
              </q-card-section>

              <q-card-actions align="right" class="q-pa-md">
                <q-btn flat rounded label="Cancelar" color="negative" @click="modalCadastro=false" />
                <q-btn
                  rounded
                  color="primary"
                  label="Criar conta"
                  :loading="loadingCadastro"
                  :disable="!planosCadastro.length || !cadastro.planId"
                  @click="criarContaContratar"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-inner-loading :showing="loading" />
        </q-card>
      </q-page>

      <q-dialog v-model="modalEsqueciSenha" persistent>
        <q-card style="width: 420px; max-width: 90vw">
          <q-card-section>
            <div class="text-h6">Recuperar senha</div>
            <div class="text-caption text-grey-7">
              Informe seu e-mail para receber um link de redefinição.
            </div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model.trim="emailRedefinicao"
              outlined
              rounded
              label="E-mail"
              :error="v$.emailRedefinicao.$error"
              error-message="Informe um e-mail válido."
              @blur="v$.emailRedefinicao.$touch"
              @keypress.enter="solicitarRedefinicaoSenha"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat rounded label="Cancelar" color="negative" v-close-popup />
            <q-btn
              rounded
              label="Enviar link"
              color="primary"
              :loading="loadingRedefinicao"
              @click="solicitarRedefinicaoSenha"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="modalNovaSenha" persistent>
        <q-card style="width: 420px; max-width: 90vw">
          <q-card-section>
            <div class="text-h6">Cadastrar nova senha</div>
            <div class="text-caption text-grey-7">
              Informe uma senha com pelo menos 6 caracteres.
            </div>
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="novaSenha"
              outlined
              rounded
              label="Nova senha"
              :type="isPwdNovaSenha ? 'password' : 'text'"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwdNovaSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwdNovaSenha = !isPwdNovaSenha"
                />
              </template>
            </q-input>
            <q-input
              v-model="confirmacaoNovaSenha"
              outlined
              rounded
              label="Confirmar nova senha"
              :type="isPwdNovaSenha ? 'password' : 'text'"
              @keypress.enter="redefinirSenha"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat rounded label="Cancelar" color="negative" @click="cancelarNovaSenha" />
            <q-btn
              rounded
              label="Salvar senha"
              color="primary"
              :loading="loadingRedefinicao"
              @click="redefinirSenha"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
import {
  ConsultarIdentidadeVisual,
  CriarContaContratarPlano,
  ListarPlanosCadastro,
  RedefinirSenha,
  SolicitarRedefinicaoSenha
} from 'src/service/login'
import { resolveTenantLogoUrl } from 'src/utils/tenantLogo'

const cadastroInicial = () => ({
  personType: 'pj',
  planId: null,
  paymentMethod: 'PIX',
  businessType: 'generic',
  company: {
    name: '',
    tradeName: '',
    document: '',
    stateRegistration: '',
    municipalRegistration: '',
    phone: '',
    email: '',
    segment: ''
  },
  responsible: {
    name: '',
    document: '',
    phone: '',
    email: ''
  },
  address: {
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: ''
  },
  admin: {
    name: '',
    email: '',
    password: ''
  },
  acceptedTerms: false
})

export default {
  name: 'LoginPage',
  setup () {
    return { v$: useVuelidate() }
  },
  data () {
    return {
      modalEsqueciSenha: false,
      modalNovaSenha: false,
      emailRedefinicao: null,
      novaSenha: '',
      confirmacaoNovaSenha: '',
      isPwdNovaSenha: true,
      loadingRedefinicao: false,
      modalCadastro: false,
      loadingCadastro: false,
      loadingPlanosCadastro: false,
      planosCadastro: [],
      cadastro: cadastroInicial(),
      tipoPessoaOptions: [
        { label: 'Pessoa juridica', value: 'pj' },
        { label: 'Pessoa fisica', value: 'pf' }
      ],
      tipoNegocioOptions: [
        { label: 'Atendimento geral', value: 'generic' },
        { label: 'Delivery / restaurante', value: 'food_delivery' }
      ],
      metodosPagamentoOptions: [
        { label: 'Pix', value: 'PIX' },
        { label: 'Cartao ou boleto', value: 'CARD' }
      ],
      logoUrl: resolveTenantLogoUrl(localStorage.getItem('tenantLogoUrl')),
      form: {
        email: null,
        password: null
      },
      contasCliente: {},
      isPwd: true,
      loading: false
    }
  },
  validations () {
    return {
      form: {
        email: { required, email },
        password: { required }
      },
      emailRedefinicao: { required, email }
    }
  },
  methods: {
    async abrirCadastro () {
      this.modalCadastro = true
      if (this.planosCadastro.length) return

      this.loadingPlanosCadastro = true
      try {
        const { data } = await ListarPlanosCadastro()
        this.planosCadastro = (data || []).map(plano => ({
          ...plano,
          id: Number(plano.id)
        }))
        if (this.planosCadastro.length) {
          this.cadastro.planId = this.planosCadastro[0].id
        }
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          position: 'top',
          message: 'Nao foi possivel carregar os planos ativos.'
        })
      } finally {
        this.loadingPlanosCadastro = false
      }
    },
    sincronizarPessoa () {
      if (this.cadastro.personType === 'pf') {
        this.cadastro.company.tradeName = ''
        this.cadastro.company.stateRegistration = ''
        this.cadastro.company.municipalRegistration = ''
      }
    },
    formatarPrecoPlano (plano) {
      const valor = Number(plano.price || 0)
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    validarCadastro () {
      const somenteDigitos = value => String(value || '').replace(/\D/g, '')
      const camposObrigatorios = [
        this.cadastro.planId,
        this.cadastro.paymentMethod,
        this.cadastro.company.name,
        this.cadastro.company.document,
        this.cadastro.company.phone,
        this.cadastro.company.email,
        this.cadastro.company.segment,
        this.cadastro.responsible.name,
        this.cadastro.responsible.document,
        this.cadastro.responsible.phone,
        this.cadastro.responsible.email,
        this.cadastro.address.zipCode,
        this.cadastro.address.street,
        this.cadastro.address.number,
        this.cadastro.address.district,
        this.cadastro.address.city,
        this.cadastro.address.state,
        this.cadastro.admin.name,
        this.cadastro.admin.email,
        this.cadastro.admin.password
      ]

      if (camposObrigatorios.some(campo => !campo)) {
        return 'Preencha todos os campos obrigatorios.'
      }
      const documento = somenteDigitos(this.cadastro.company.document)
      const tamanhoDocumentoEsperado = this.cadastro.personType === 'pj' ? 14 : 11
      if (documento.length !== tamanhoDocumentoEsperado) {
        return this.cadastro.personType === 'pj' ? 'Informe um CNPJ valido.' : 'Informe um CPF valido.'
      }
      if (somenteDigitos(this.cadastro.responsible.document).length !== 11) {
        return 'Informe o CPF do responsavel.'
      }
      if (!/.+@.+\..+/.test(this.cadastro.company.email) || !/.+@.+\..+/.test(this.cadastro.responsible.email) || !/.+@.+\..+/.test(this.cadastro.admin.email)) {
        return 'Informe e-mails validos.'
      }
      if (this.cadastro.admin.password.length < 6) {
        return 'A senha do administrador deve ter pelo menos 6 caracteres.'
      }
      if (!this.cadastro.acceptedTerms) {
        return 'Confirme a autorizacao para criar a conta.'
      }
      return null
    },
    async criarContaContratar () {
      const erroValidacao = this.validarCadastro()
      if (erroValidacao) {
        this.$q.notify({ type: 'warning', position: 'top', message: erroValidacao })
        return
      }

      this.loadingCadastro = true
      try {
        const { data } = await CriarContaContratarPlano({
          ...this.cadastro,
          planId: Number(this.cadastro.planId)
        })
        if (data.payment?.paymentUrl) {
          window.open(data.payment.paymentUrl, '_blank')
        }
        this.$q.notify({
          type: data.payment ? 'positive' : 'warning',
          position: 'top',
          message: data.payment
            ? 'Conta criada. A cobranca do plano foi gerada.'
            : 'Conta criada, mas a cobranca nao foi gerada automaticamente.'
        })
        this.form.email = this.cadastro.admin.email
        this.modalCadastro = false
        this.cadastro = cadastroInicial()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          position: 'top',
          message: 'Nao foi possivel criar a conta. Verifique os dados e tente novamente.'
        })
      } finally {
        this.loadingCadastro = false
      }
    },
    async consultarIdentidadeVisual () {
      if (!this.form.email || this.v$.form.email.$invalid) return
      try {
        const { data } = await ConsultarIdentidadeVisual(this.form.email)
        this.logoUrl = resolveTenantLogoUrl(data.logoUrl)
      } catch (error) {
        this.logoUrl = resolveTenantLogoUrl()
      }
    },
    fazerLogin () {
      this.v$.form.$touch()
      if (this.v$.form.$error) {
        this.$q.notify('Informe usuário e senha corretamente.')
        return
      }
      this.loading = true
      this.$store.dispatch('UserLogin', this.form)
        .then(data => {
          // if (Object.keys(this.contasCliente).length == 1) {
          //   // logar direto
          // }
          this.loading = false
          // .params = { modalEscolhaUnidadeNegocio: true }
        })
        .catch(err => {
          console.error('exStore', err)
          this.loading = false
        })
    },
    async solicitarRedefinicaoSenha () {
      this.v$.emailRedefinicao.$touch()
      if (this.v$.emailRedefinicao.$error) return

      this.loadingRedefinicao = true
      try {
        await SolicitarRedefinicaoSenha(this.emailRedefinicao)
        this.modalEsqueciSenha = false
        this.emailRedefinicao = null
        this.v$.emailRedefinicao.$reset()
        this.$q.notify({
          type: 'positive',
          message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
          position: 'top'
        })
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Não foi possível enviar o link de redefinição. Tente novamente mais tarde.',
          position: 'top'
        })
      } finally {
        this.loadingRedefinicao = false
      }
    },
    async redefinirSenha () {
      if (this.novaSenha.length < 6) {
        this.$q.notify({ type: 'warning', message: 'A senha deve ter pelo menos 6 caracteres.' })
        return
      }
      if (this.novaSenha !== this.confirmacaoNovaSenha) {
        this.$q.notify({ type: 'warning', message: 'As senhas informadas não conferem.' })
        return
      }

      this.loadingRedefinicao = true
      try {
        await RedefinirSenha(this.$route.query.tokenSetup, this.novaSenha)
        this.$q.notify({ type: 'positive', message: 'Senha redefinida. Faça login com a nova senha.' })
        this.cancelarNovaSenha()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'O link é inválido ou expirou. Solicite uma nova redefinição de senha.'
        })
      } finally {
        this.loadingRedefinicao = false
      }
    },
    cancelarNovaSenha () {
      this.modalNovaSenha = false
      this.novaSenha = ''
      this.confirmacaoNovaSenha = ''
      this.$router.replace({ name: 'login' })
    },
    clear () {
      this.form.email = ''
      this.form.password = ''
      this.v$.form.$reset()
    }
  },
  mounted () {
    this.modalNovaSenha = !!this.$route.query.tokenSetup
  }
}
</script>
<style scoped>
#login-app {
  background: none;
}

.index {
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  text-align: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.index h1 {
  height: 150px;
}

.index h1 img {
  height: 100%;
}

.index h2 {
  color: #666;
  margin-bottom: 200px;
}

.index h2 p {
  margin: 0 0 50px;
}

.index .ivu-row-flex {
  height: 100%;
}

#indexLizi {
  position: absolute;
  width: 100%;
  top: 0;
  bottom: 0;
  overflow: hidden;
}

.bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card {
  width: 100%;
  max-width: 430px;
}

.signup-dialog {
  min-height: 100vh;
}

.plan-card {
  border-radius: 8px;
  min-height: 135px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.plan-card--active {
  border-color: #3E72AF;
  box-shadow: 0 0 0 2px rgba(62, 114, 175, 0.16);
}

.login-layout {
  background: linear-gradient(rgba(7, 20, 38, 0.32), rgba(7, 20, 38, 0.46)), url('/ncprogrammers-login-background.png') center / cover no-repeat;
}

.q-img__image {
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
