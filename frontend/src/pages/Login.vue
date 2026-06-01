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
              @blur="$v.form.email.$touch(); consultarIdentidadeVisual()"
              :error="$v.form.email.$error"
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
              <span slot="loading">
                <q-spinner-puff class="on-left" />Logando...
              </span>
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
              :error="$v.emailRedefinicao.$error"
              error-message="Informe um e-mail válido."
              @blur="$v.emailRedefinicao.$touch"
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
import { required, email } from 'vuelidate/lib/validators'
import { ConsultarIdentidadeVisual, RedefinirSenha, SolicitarRedefinicaoSenha } from 'src/service/login'

export default {
  name: 'Login',
  data () {
    return {
      modalEsqueciSenha: false,
      modalNovaSenha: false,
      emailRedefinicao: null,
      novaSenha: '',
      confirmacaoNovaSenha: '',
      isPwdNovaSenha: true,
      loadingRedefinicao: false,
      logoUrl: localStorage.getItem('tenantLogoUrl') || '/ncprogrammers-logo.svg',
      form: {
        email: null,
        password: null
      },
      contasCliente: {},
      isPwd: true,
      loading: false
    }
  },
  validations: {
    form: {
      email: { required, email },
      password: { required }
    },
    emailRedefinicao: { required, email }
  },
  methods: {
    async consultarIdentidadeVisual () {
      if (!this.form.email || this.$v.form.email.$invalid) return
      try {
        const { data } = await ConsultarIdentidadeVisual(this.form.email)
        this.logoUrl = data.logoUrl || '/ncprogrammers-logo.svg'
      } catch (error) {
        this.logoUrl = '/ncprogrammers-logo.svg'
      }
    },
    fazerLogin () {
      this.$v.form.$touch()
      if (this.$v.form.$error) {
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
      this.$v.emailRedefinicao.$touch()
      if (this.$v.emailRedefinicao.$error) return

      this.loadingRedefinicao = true
      try {
        await SolicitarRedefinicaoSenha(this.emailRedefinicao)
        this.modalEsqueciSenha = false
        this.emailRedefinicao = null
        this.$v.emailRedefinicao.$reset()
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
      this.$v.form.$reset()
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

.login-layout {
  background: linear-gradient(rgba(7, 20, 38, 0.32), rgba(7, 20, 38, 0.46)), url('/ncprogrammers-login-background.png') center / cover no-repeat;
}

.q-img__image {
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
