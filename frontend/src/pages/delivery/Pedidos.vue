<template>
  <div class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">Pedidos</div>
        <div class="text-caption text-grey-7">Arraste um pedido para atualizar a etapa operacional.</div>
      </div>
      <q-space />
      <q-input v-model.trim="searchParam" outlined dense clearable label="Buscar numero" @keyup.enter="carregar">
        <template v-slot:append><q-icon name="mdi-magnify" /></template>
      </q-input>
      <q-btn flat round icon="mdi-refresh" class="q-ml-sm" @click="carregar" />
    </div>
    <div class="kanban row no-wrap q-col-gutter-md">
      <div v-for="coluna in colunas" :key="coluna.status" class="kanban-column col">
        <q-card flat bordered class="full-height">
          <q-card-section class="row items-center q-py-sm">
            <div class="text-subtitle2">{{ coluna.label }}</div>
            <q-space />
            <q-badge color="primary">{{ pedidosPorStatus(coluna.status).length }}</q-badge>
          </q-card-section>
          <q-separator />
          <q-card-section
            class="drop-area q-pa-sm"
            @dragover.prevent
            @drop="soltarPedido(coluna.status)"
          >
            <q-card
              v-for="pedido in pedidosPorStatus(coluna.status)"
              :key="pedido.id"
              draggable="true"
              bordered
              flat
              class="q-mb-sm cursor-pointer"
              @dragstart="arrastarPedido(pedido)"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center">
                  <strong>#{{ pedido.id }}</strong>
                  <q-space />
                  <span class="text-weight-medium">{{ formatarMoeda(pedido.total) }}</span>
                </div>
                <div class="text-body2">{{ pedido.contact && pedido.contact.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ pedido.deliveryType === 'delivery' ? 'Entrega' : 'Retirada' }} |
                  {{ pedido.items.length }} item(ns)
                </div>
              </q-card-section>
            </q-card>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { AlterarStatusPedidoDelivery, ListarPedidosDelivery } from 'src/service/delivery'
import { socketIO } from 'src/utils/socket'

const socket = socketIO()

export default {
  name: 'DeliveryPedidos',
  data () {
    return {
      pedidos: [],
      pedidoArrastado: null,
      searchParam: '',
      loading: false,
      colunas: [
        { status: 'NEW', label: 'Novo' },
        { status: 'WAITING_PAYMENT', label: 'Aguardando pagamento' },
        { status: 'CONFIRMED', label: 'Confirmado' },
        { status: 'PREPARING', label: 'Em preparo' },
        { status: 'READY', label: 'Pronto' },
        { status: 'OUT_FOR_DELIVERY', label: 'Saiu para entrega' },
        { status: 'DELIVERED', label: 'Entregue' },
        { status: 'CANCELLED', label: 'Cancelado' }
      ]
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    },
    pedidosPorStatus (status) {
      return this.pedidos.filter(pedido => pedido.status === status)
    },
    arrastarPedido (pedido) {
      this.pedidoArrastado = pedido
    },
    async soltarPedido (status) {
      if (!this.pedidoArrastado || this.pedidoArrastado.status === status) return
      await AlterarStatusPedidoDelivery(this.pedidoArrastado.id, status)
      this.pedidoArrastado = null
    },
    atualizarPedido ({ action, order }) {
      const index = this.pedidos.findIndex(pedido => pedido.id === order.id)
      if (index >= 0) this.$set(this.pedidos, index, order)
      if (action === 'create' && index < 0) this.pedidos.unshift(order)
    },
    async carregar () {
      this.loading = true
      try {
        const { data } = await ListarPedidosDelivery({ searchParam: this.searchParam || undefined })
        this.pedidos = data
      } finally {
        this.loading = false
      }
    }
  },
  mounted () {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    socket.on(`${usuario.tenantId}:delivery:order`, this.atualizarPedido)
    this.carregar()
  },
  beforeDestroy () {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    socket.off(`${usuario.tenantId}:delivery:order`, this.atualizarPedido)
  }
}
</script>

<style scoped>
.kanban {
  min-height: calc(100vh - 170px);
  overflow-x: auto;
}

.kanban-column {
  min-width: 230px;
}

.drop-area {
  min-height: calc(100vh - 240px);
}
</style>
