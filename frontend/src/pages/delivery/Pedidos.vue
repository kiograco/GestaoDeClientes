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
              @click="abrirPedido(pedido)"
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
    <q-dialog v-model="modalPedido">
      <q-card v-if="pedidoSelecionado" style="width: 620px; max-width: 95vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Pedido #{{ pedidoSelecionado.id }}</div>
          <q-space />
          <q-btn flat round icon="mdi-close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div><strong>Cliente:</strong> {{ pedidoSelecionado.contact && pedidoSelecionado.contact.name }}</div>
          <div><strong>Modalidade:</strong> {{ pedidoSelecionado.deliveryType === 'delivery' ? 'Entrega' : 'Retirada' }}</div>
          <div v-if="pedidoSelecionado.notes"><strong>Observacoes:</strong> {{ pedidoSelecionado.notes }}</div>
          <q-list bordered separator class="q-mt-md">
            <q-item v-for="item in pedidoSelecionado.items" :key="item.id">
              <q-item-section>
                <q-item-label>{{ item.quantity }}x {{ item.productNameSnapshot }}</q-item-label>
                <q-item-label caption>{{ item.options.map(opcao => opcao.optionNameSnapshot).join(', ') }}</q-item-label>
                <q-item-label v-if="item.notes" caption>Obs.: {{ item.notes }}</q-item-label>
              </q-item-section>
              <q-item-section side>{{ formatarMoeda(item.total) }}</q-item-section>
            </q-item>
          </q-list>
          <div class="text-right text-h6 q-mt-md">Total: {{ formatarMoeda(pedidoSelecionado.total) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded icon="mdi-printer" label="Imprimir cozinha" @click="imprimirCozinha" />
        </q-card-actions>
        <div ref="cozinha" class="cozinha-print">
          <h2>Pedido #{{ pedidoSelecionado.id }}</h2>
          <p><strong>Cliente:</strong> {{ pedidoSelecionado.contact && pedidoSelecionado.contact.name }}</p>
          <p v-if="pedidoSelecionado.notes"><strong>Observacoes:</strong> {{ pedidoSelecionado.notes }}</p>
          <hr>
          <div v-for="item in pedidoSelecionado.items" :key="`print-${item.id}`">
            <p><strong>{{ item.quantity }}x {{ item.productNameSnapshot }}</strong></p>
            <p v-if="item.options.length">{{ item.options.map(opcao => opcao.optionNameSnapshot).join(', ') }}</p>
            <p v-if="item.notes">Obs.: {{ item.notes }}</p>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { AlterarStatusPedidoDelivery, ListarPedidosDelivery } from 'src/service/delivery'
import { socketIO } from 'src/utils/socket'
import { Printd } from 'printd'

const socket = socketIO()

export default {
  name: 'DeliveryPedidos',
  data () {
    return {
      pedidos: [],
      pedidoSelecionado: null,
      modalPedido: false,
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
    abrirPedido (pedido) {
      this.pedidoSelecionado = pedido
      this.modalPedido = true
    },
    imprimirCozinha () {
      const printd = new Printd()
      printd.print(this.$refs.cozinha, ['body { font-family: Arial, sans-serif; font-size: 14px; }'])
    },
    async soltarPedido (status) {
      if (!this.pedidoArrastado || this.pedidoArrastado.status === status) return
      await AlterarStatusPedidoDelivery(this.pedidoArrastado.id, status)
      this.pedidoArrastado = null
    },
    atualizarPedido ({ action, order }) {
      if (!order.contact || !order.items) {
        this.carregar()
        return
      }
      const index = this.pedidos.findIndex(pedido => pedido.id === order.id)
      if (index >= 0) this.pedidos[index] = order
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
  beforeUnmount () {
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

.cozinha-print {
  display: none;
}
</style>
