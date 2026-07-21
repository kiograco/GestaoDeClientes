<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-grey-9">
      <q-toolbar>
        <q-btn flat round icon="mdi-arrow-left" @click="$router.push({ name: 'superadmin-empresas' })" />
        <q-toolbar-title>Planos comerciais</q-toolbar-title>
        <q-btn rounded color="primary" icon="mdi-plus" label="Novo plano" @click="abrirCadastro" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page class="q-pa-md">
        <q-table row-key="id" :rows="planos" :columns="columns" :loading="loading" flat bordered>
          <template v-slot:body-cell-price="props">
            <q-td :props="props">{{ formatarMoeda(props.row.price) }}</q-td>
          </template>
          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">{{ props.row.isActive ? 'Ativo' : 'Inativo' }}</q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn dense flat no-caps icon="mdi-pencil" label="Editar" color="primary" @click="abrirEdicao(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-page>
    </q-page-container>
    <q-dialog v-model="modalPlano" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ planoEdicao.id ? 'Editar plano' : 'Cadastrar plano' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="planoEdicao.name" outlined dense label="Nome" />
          <q-input v-model.number="planoEdicao.price" outlined dense label="Preço" type="number" min="0.01" step="0.01" />
          <q-input v-model.number="planoEdicao.durationDays" outlined dense label="Duração em dias" type="number" min="1" />
          <div class="row q-col-gutter-md">
            <q-input v-model.number="planoEdicao.maxUsers" outlined dense label="Limite de usuários" type="number" min="1" class="col" />
            <q-input v-model.number="planoEdicao.maxConnections" outlined dense label="Limite de canais" type="number" min="1" class="col" />
          </div>
          <q-toggle v-model="planoEdicao.isActive" label="Plano disponível para contratação" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" color="negative" @click="modalPlano = false" />
          <q-btn rounded label="Salvar" color="primary" :loading="saving" :disable="!planoValido" @click="salvar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { AtualizarPlano, CriarPlano, ListarPlanos } from 'src/service/planos'

const planoVazio = () => ({
  name: '',
  price: null,
  durationDays: 30,
  maxUsers: 10,
  maxConnections: 5,
  isActive: true
})

export default {
  name: 'SuperAdminPlanos',
  data () {
    return {
      loading: false,
      saving: false,
      modalPlano: false,
      planos: [],
      planoEdicao: planoVazio(),
      columns: [
        { name: 'name', label: 'Plano', field: 'name', align: 'left' },
        { name: 'price', label: 'Preço', field: 'price', align: 'left' },
        { name: 'durationDays', label: 'Dias', field: 'durationDays', align: 'left' },
        { name: 'isActive', label: 'Situação', field: 'isActive', align: 'left' },
        { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
      ]
    }
  },
  computed: {
    planoValido () {
      return !!(
        this.planoEdicao.name &&
        this.planoEdicao.price > 0 &&
        this.planoEdicao.durationDays > 0 &&
        this.planoEdicao.maxUsers > 0 &&
        this.planoEdicao.maxConnections > 0
      )
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    },
    abrirCadastro () {
      this.planoEdicao = planoVazio()
      this.modalPlano = true
    },
    abrirEdicao (plano) {
      this.planoEdicao = {
        ...plano,
        maxUsers: plano.limits?.maxUsers || 10,
        maxConnections: plano.limits?.maxConnections || 5
      }
      this.modalPlano = true
    },
    async salvar () {
      if (!this.planoValido) return
      this.saving = true
      const data = {
        name: this.planoEdicao.name,
        price: this.planoEdicao.price,
        durationDays: this.planoEdicao.durationDays,
        limits: {
          maxUsers: this.planoEdicao.maxUsers,
          maxConnections: this.planoEdicao.maxConnections
        },
        isActive: this.planoEdicao.isActive
      }
      try {
        if (this.planoEdicao.id) {
          await AtualizarPlano(this.planoEdicao.id, data)
        } else {
          await CriarPlano(data)
        }
        this.modalPlano = false
        await this.listar()
        this.$q.notify({ type: 'positive', message: 'Plano salvo.' })
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o plano.', error)
      } finally {
        this.saving = false
      }
    },
    async listar () {
      this.loading = true
      try {
        const { data } = await ListarPlanos()
        this.planos = data
      } catch (error) {
        this.$notificarErro('Não foi possível carregar os planos.', error)
      } finally {
        this.loading = false
      }
    }
  },
  mounted () {
    this.listar()
  }
}
</script>
