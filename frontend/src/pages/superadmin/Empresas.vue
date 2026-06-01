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
          <q-input v-model.trim="novaEmpresa.adminName" outlined dense label="Nome do administrador" />
          <q-input v-model.trim="novaEmpresa.adminEmail" outlined dense label="E-mail do administrador" type="email" />
          <q-input v-model="novaEmpresa.adminPassword" outlined dense label="Senha temporária" type="password" />
          <div class="row q-col-gutter-md">
            <q-input v-model.number="novaEmpresa.maxUsers" outlined dense label="Limite de usuários" type="number" class="col" />
            <q-input v-model.number="novaEmpresa.maxConnections" outlined dense label="Limite de canais" type="number" class="col" />
          </div>
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
  </q-layout>
</template>

<script>
import { AtualizarStatusEmpresa, CriarEmpresa, ListarEmpresas } from 'src/service/empresas'
import { RealizarLogout } from 'src/service/login'

export default {
  name: 'SuperAdminEmpresas',
  data () {
    return {
      loading: false,
      saving: false,
      modalEmpresa: false,
      novaEmpresa: {
        name: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        maxUsers: 10,
        maxConnections: 5
      },
      empresas: [],
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left' },
        { name: 'name', label: 'Empresa', field: 'name', align: 'left' },
        { name: 'status', label: 'Acesso', field: 'status', align: 'left' },
        { name: 'maxUsers', label: 'Limite de usuários', field: 'maxUsers', align: 'left' },
        { name: 'maxConnections', label: 'Limite de canais', field: 'maxConnections', align: 'left' }
      ]
    }
  },
  computed: {
    cadastroValido () {
      return !!(
        this.novaEmpresa.name &&
        this.novaEmpresa.adminName &&
        this.novaEmpresa.adminEmail &&
        this.novaEmpresa.adminPassword.length >= 6 &&
        this.novaEmpresa.maxUsers > 0 &&
        this.novaEmpresa.maxConnections > 0
      )
    }
  },
  methods: {
    fecharCadastro () {
      this.modalEmpresa = false
      this.novaEmpresa = {
        name: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        maxUsers: 10,
        maxConnections: 5
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
