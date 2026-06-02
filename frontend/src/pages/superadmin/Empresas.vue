<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-grey-9">
      <q-toolbar>
        <q-toolbar-title>Gestão de empresas</q-toolbar-title>
        <q-btn flat rounded label="Sair" icon="mdi-logout" @click="logout" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page class="q-pa-md">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">Empresas clientes</div>
              <q-space />
              <q-btn
                flat
                rounded
                color="primary"
                icon="mdi-cash-multiple"
                label="Planos"
                class="q-mr-sm"
                @click="$router.push({ name: 'superadmin-planos' })"
              />
              <q-btn
                rounded
                color="primary"
                icon="mdi-plus"
                label="Cadastrar empresa"
                @click="modalEmpresa = true"
              />
            </div>
            <div class="text-caption text-grey-7">
              Suspenda o acesso de empresas inadimplentes ou reative clientes liberados.
            </div>
          </q-card-section>
          <q-table
            row-key="id"
            :data="empresas"
            :columns="columns"
            :loading="loading"
            flat
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-toggle
                  :value="props.row.status === 'active'"
                  checked-icon="check"
                  unchecked-icon="clear"
                  color="positive"
                  :label="props.row.status === 'active' ? 'Acesso ativo' : 'Acesso suspenso'"
                  @input="value => atualizarStatus(props.row, value)"
                />
              </q-td>
            </template>
            <template v-slot:body-cell-accessExpiresAt="props">
              <q-td :props="props">
                {{ formatarVencimento(props.row.accessExpiresAt) }}
              </q-td>
            </template>
            <template v-slot:body-cell-accessDaysRemaining="props">
              <q-td :props="props">
                {{ formatarDiasRestantes(props.row.accessExpiresAt) }}
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  dense
                  flat
                  no-caps
                  color="grey-8"
                  icon="mdi-pencil"
                  label="Editar"
                  @click="abrirEdicao(props.row)"
                />
                <q-btn
                  dense
                  flat
                  no-caps
                  color="primary"
                  icon="mdi-calendar-plus"
                  label="Renovar"
                  @click="abrirRenovacao(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card>
      </q-page>
    </q-page-container>
    <q-dialog v-model="modalEmpresa" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Cadastrar empresa cliente</div>
          <div class="text-caption text-grey-7">
            O administrador inicial poderá configurar logo, canais, filas e usuários da empresa.
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="novaEmpresa.name" outlined dense label="Nome da empresa" />
          <q-input v-model.trim="novaEmpresa.cpfCnpj" outlined dense label="CPF ou CNPJ" />
          <q-input v-model.trim="novaEmpresa.adminName" outlined dense label="Nome do administrador" />
          <q-input v-model.trim="novaEmpresa.adminEmail" outlined dense label="E-mail do administrador" type="email" />
          <q-input v-model="novaEmpresa.adminPassword" outlined dense label="Senha temporária" type="password" />
          <q-select
            v-model="novaEmpresa.businessType"
            :options="tiposEmpresa"
            emit-value
            map-options
            outlined
            dense
            label="Tipo de empresa"
          />
          <div class="row q-col-gutter-md">
            <q-input v-model.number="novaEmpresa.maxUsers" outlined dense label="Limite de usuários" type="number" class="col" />
            <q-input v-model.number="novaEmpresa.maxConnections" outlined dense label="Limite de canais" type="number" class="col" />
          </div>
          <q-input v-model.number="novaEmpresa.paidDays" outlined dense label="Dias pagos inicialmente" type="number" min="1" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" color="negative" @click="fecharCadastro" />
          <q-btn
            rounded
            label="Cadastrar"
            color="primary"
            :loading="saving"
            :disable="!cadastroValido"
            @click="criarEmpresa"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="modalRenovacao" persistent>
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Renovar acesso</div>
          <div class="text-caption text-grey-7">
            Os novos dias serão acrescentados ao prazo ainda disponível de {{ empresaRenovacao.name }}.
          </div>
        </q-card-section>
        <q-card-section>
          <q-input v-model.number="diasRenovacao" outlined dense label="Dias pagos" type="number" min="1" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" color="negative" @click="modalRenovacao = false" />
          <q-btn rounded label="Renovar" color="primary" :loading="saving" :disable="diasRenovacao < 1" @click="renovarAcesso" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="modalEdicao" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Editar empresa cliente</div>
          <div class="text-caption text-grey-7">
            A senha só será alterada se um novo valor for informado.
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="empresaEdicao.name" outlined dense label="Nome da empresa" />
          <q-input v-model.trim="empresaEdicao.cpfCnpj" outlined dense label="CPF ou CNPJ" />
          <q-input v-model.trim="empresaEdicao.adminName" outlined dense label="Nome do administrador" />
          <q-input v-model.trim="empresaEdicao.adminEmail" outlined dense label="E-mail do administrador" type="email" />
          <q-input v-model="empresaEdicao.adminPassword" outlined dense label="Nova senha (opcional)" type="password" />
          <q-select
            v-model="empresaEdicao.businessType"
            :options="tiposEmpresa"
            emit-value
            map-options
            outlined
            dense
            label="Tipo de empresa"
          />
          <div class="row q-col-gutter-md">
            <q-input v-model.number="empresaEdicao.maxUsers" outlined dense label="Limite de usuários" type="number" min="1" class="col" />
            <q-input v-model.number="empresaEdicao.maxConnections" outlined dense label="Limite de canais" type="number" min="1" class="col" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" color="negative" @click="modalEdicao = false" />
          <q-btn rounded label="Salvar" color="primary" :loading="saving" :disable="!edicaoValida" @click="salvarEdicao" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { AtualizarCadastroEmpresa, AtualizarStatusEmpresa, CriarEmpresa, ListarEmpresas, RenovarAcessoEmpresa } from 'src/service/empresas'
import { RealizarLogout } from 'src/service/login'

export default {
  name: 'SuperAdminEmpresas',
  data () {
    return {
      loading: false,
      saving: false,
      modalEmpresa: false,
      modalRenovacao: false,
      modalEdicao: false,
      empresaRenovacao: {},
      empresaEdicao: {},
      diasRenovacao: 30,
      tiposEmpresa: [
        { label: 'CRM padrao', value: 'generic' },
        { label: 'Loja de delivery', value: 'food_delivery' }
      ],
      novaEmpresa: {
        name: '',
        cpfCnpj: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        maxUsers: 10,
        maxConnections: 5,
        paidDays: 30,
        businessType: 'generic'
      },
      empresas: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left' },
        { name: 'name', label: 'Empresa', field: 'name', align: 'left' },
        { name: 'status', label: 'Acesso', field: 'status', align: 'left' },
        { name: 'accessExpiresAt', label: 'Vencimento', field: 'accessExpiresAt', align: 'left' },
        { name: 'accessDaysRemaining', label: 'Prazo restante', field: 'accessDaysRemaining', align: 'left' },
        { name: 'maxUsers', label: 'Limite de usuários', field: 'maxUsers', align: 'left' },
        { name: 'maxConnections', label: 'Limite de canais', field: 'maxConnections', align: 'left' },
        { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
      ]
    }
  },
  computed: {
    cadastroValido () {
      return !!(
        this.novaEmpresa.name &&
        this.documentoValido(this.novaEmpresa.cpfCnpj) &&
        this.novaEmpresa.adminName &&
        this.novaEmpresa.adminEmail &&
        this.novaEmpresa.adminPassword.length >= 6 &&
        this.novaEmpresa.maxUsers > 0 &&
        this.novaEmpresa.maxConnections > 0 &&
        this.novaEmpresa.paidDays > 0
      )
    },
    edicaoValida () {
      return !!(
        this.empresaEdicao.name &&
        this.documentoValido(this.empresaEdicao.cpfCnpj) &&
        this.empresaEdicao.adminName &&
        this.empresaEdicao.adminEmail &&
        (!this.empresaEdicao.adminPassword || this.empresaEdicao.adminPassword.length >= 6) &&
        this.empresaEdicao.maxUsers > 0 &&
        this.empresaEdicao.maxConnections > 0
      )
    }
  },
  methods: {
    fecharCadastro () {
      this.modalEmpresa = false
      this.novaEmpresa = {
        name: '',
        cpfCnpj: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        maxUsers: 10,
        maxConnections: 5,
        paidDays: 30,
        businessType: 'generic'
      }
    },
    formatarVencimento (accessExpiresAt) {
      if (!accessExpiresAt) return 'Sem prazo definido'
      return new Intl.DateTimeFormat('pt-BR').format(new Date(accessExpiresAt))
    },
    documentoValido (value) {
      return [11, 14].includes((value || '').replace(/\D/g, '').length)
    },
    formatarDiasRestantes (accessExpiresAt) {
      if (!accessExpiresAt) return 'Ilimitado'
      const expiration = new Date(accessExpiresAt)
      const today = new Date()
      expiration.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      const days = Math.max(0, Math.ceil((expiration - today) / 86400000) + 1)
      return days === 1 ? '1 dia' : `${days} dias`
    },
    abrirRenovacao (empresa) {
      this.empresaRenovacao = empresa
      this.diasRenovacao = 30
      this.modalRenovacao = true
    },
    abrirEdicao (empresa) {
      this.empresaEdicao = {
        name: empresa.name,
        cpfCnpj: empresa.cpfCnpj || '',
        adminName: empresa.owner?.name || '',
        adminEmail: empresa.owner?.email || '',
        adminPassword: '',
        maxUsers: empresa.maxUsers,
        maxConnections: empresa.maxConnections,
        businessType: empresa.businessType || 'generic'
      }
      this.empresaRenovacao = empresa
      this.modalEdicao = true
    },
    async salvarEdicao () {
      if (!this.empresaRenovacao.id || !this.edicaoValida) return
      this.saving = true
      try {
        const data = { ...this.empresaEdicao }
        if (!data.adminPassword) delete data.adminPassword
        await AtualizarCadastroEmpresa(this.empresaRenovacao.id, data)
        this.modalEdicao = false
        await this.listarEmpresas()
        this.$q.notify({ type: 'positive', message: 'Cadastro da empresa atualizado.' })
      } catch (error) {
        this.$notificarErro('Não foi possível atualizar o cadastro da empresa.', error)
      } finally {
        this.saving = false
      }
    },
    async renovarAcesso () {
      if (!this.empresaRenovacao.id || this.diasRenovacao < 1) return
      this.saving = true
      try {
        await RenovarAcessoEmpresa(this.empresaRenovacao.id, this.diasRenovacao)
        this.modalRenovacao = false
        await this.listarEmpresas()
        this.$q.notify({ type: 'positive', message: 'Prazo de acesso renovado.' })
      } catch (error) {
        this.$notificarErro('Não foi possível renovar o acesso da empresa.', error)
      } finally {
        this.saving = false
      }
    },
    async criarEmpresa () {
      if (!this.cadastroValido) return
      this.saving = true
      try {
        await CriarEmpresa(this.novaEmpresa)
        this.fecharCadastro()
        await this.listarEmpresas()
        this.$q.notify({ type: 'positive', message: 'Empresa cadastrada com acesso ativo.' })
      } catch (error) {
        this.$notificarErro('Não foi possível cadastrar a empresa.', error)
      } finally {
        this.saving = false
      }
    },
    async listarEmpresas () {
      this.loading = true
      try {
        const { data } = await ListarEmpresas()
        this.empresas = data
      } catch (error) {
        this.$notificarErro('Não foi possível carregar as empresas.', error)
      } finally {
        this.loading = false
      }
    },
    async atualizarStatus (empresa, active) {
      const previousStatus = empresa.status
      empresa.status = active ? 'active' : 'inactive'
      try {
        await AtualizarStatusEmpresa(empresa.id, empresa.status)
        this.$q.notify({
          type: 'positive',
          message: active ? 'Acesso da empresa liberado.' : 'Acesso da empresa suspenso.'
        })
      } catch (error) {
        empresa.status = previousStatus
        this.$notificarErro('Não foi possível atualizar o acesso da empresa.', error)
      }
    },
    async logout () {
      try {
        await RealizarLogout()
      } finally {
        localStorage.clear()
        this.$router.replace({ name: 'login' })
      }
    }
  },
  mounted () {
    this.listarEmpresas()
  }
}
</script>
