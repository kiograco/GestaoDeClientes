<template>
  <div class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">Areas de entrega</div>
        <div class="text-caption text-grey-7">Configure taxa e prazo por bairro ou intervalo de CEP.</div>
      </div>
      <q-space />
      <q-btn rounded color="primary" icon="mdi-plus" label="Nova area" @click="abrirZona()" />
    </div>
    <q-card flat bordered>
      <q-table flat :rows="zonas" :columns="colunas" row-key="id" :loading="loading">
        <template v-slot:body-cell-deliveryFee="props">
          <q-td :props="props">{{ formatarMoeda(props.value) }}</q-td>
        </template>
        <template v-slot:body-cell-active="props">
          <q-td :props="props">{{ props.value ? 'Ativa' : 'Inativa' }}</q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round icon="mdi-pencil" @click="abrirZona(props.row)" />
            <q-btn flat round color="negative" icon="mdi-delete" @click="excluirZona(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
    <q-dialog v-model="modal" persistent>
      <q-card style="width: 620px; max-width: 95vw">
        <q-card-section class="text-h6">{{ zona.id ? 'Editar' : 'Nova' }} area de entrega</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="zona.name" outlined dense label="Nome da area" />
          <q-input v-model.trim="zona.district" outlined dense label="Bairro (opcional)" />
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="zona.zipCodeStart" outlined dense mask="########" label="CEP inicial (opcional)" class="col" />
            <q-input v-model.trim="zona.zipCodeEnd" outlined dense mask="########" label="CEP final (opcional)" class="col" />
          </div>
          <div class="row q-col-gutter-md">
            <q-input v-model.number="zona.deliveryFee" outlined dense type="number" min="0" step="0.01" label="Taxa de entrega" class="col" />
            <q-input v-model.number="zona.estimatedMinutes" outlined dense type="number" min="1" label="Prazo estimado (minutos)" class="col" />
          </div>
          <q-toggle v-model="zona.active" label="Area ativa" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modal = false" />
          <q-btn rounded color="primary" label="Salvar" :loading="saving" :disable="!zonaValida" @click="salvar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { AlterarZonaDelivery, CriarZonaDelivery, ExcluirZonaDelivery, ListarZonasDelivery } from 'src/service/delivery'

const zonaVazia = () => ({
  name: '',
  district: null,
  zipCodeStart: null,
  zipCodeEnd: null,
  deliveryFee: 0,
  estimatedMinutes: 30,
  active: true
})

export default {
  name: 'DeliveryZonasEntrega',
  data () {
    return {
      zonas: [],
      zona: zonaVazia(),
      modal: false,
      loading: false,
      saving: false,
      colunas: [
        { name: 'name', label: 'Area', field: 'name', align: 'left' },
        { name: 'district', label: 'Bairro', field: 'district', align: 'left' },
        { name: 'zipCodeStart', label: 'CEP inicial', field: 'zipCodeStart', align: 'left' },
        { name: 'zipCodeEnd', label: 'CEP final', field: 'zipCodeEnd', align: 'left' },
        { name: 'deliveryFee', label: 'Taxa', field: 'deliveryFee', align: 'left' },
        { name: 'estimatedMinutes', label: 'Prazo (min)', field: 'estimatedMinutes', align: 'left' },
        { name: 'active', label: 'Status', field: 'active', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ]
    }
  },
  computed: {
    zonaValida () {
      return !!(
        this.zona.name &&
        (this.zona.district || (this.zona.zipCodeStart && this.zona.zipCodeEnd)) &&
        this.zona.deliveryFee >= 0 &&
        this.zona.estimatedMinutes > 0
      )
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    },
    abrirZona (zona = null) {
      this.zona = zona ? { ...zona } : zonaVazia()
      this.modal = true
    },
    async carregar () {
      this.loading = true
      try {
        const { data } = await ListarZonasDelivery()
        this.zonas = data
      } finally {
        this.loading = false
      }
    },
    async salvar () {
      this.saving = true
      try {
        const action = this.zona.id ? AlterarZonaDelivery : CriarZonaDelivery
        await action(this.zona)
        this.modal = false
        await this.carregar()
      } finally {
        this.saving = false
      }
    },
    excluirZona (zona) {
      this.$q.dialog({
        title: 'Atencao',
        message: `Excluir a area "${zona.name}"?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        await ExcluirZonaDelivery(zona.id)
        await this.carregar()
      })
    }
  },
  mounted () {
    this.carregar()
  }
}
</script>
