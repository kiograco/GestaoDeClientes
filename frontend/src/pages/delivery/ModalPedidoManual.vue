<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="width: 920px; max-width: 96vw">
      <q-card-section class="row items-center">
        <div>
          <div class="text-h6">Pedidos de {{ ticket.contact && ticket.contact.name }}</div>
          <div class="text-caption text-grey-7">Monte o pedido sem sair da conversa.</div>
        </div>
        <q-space />
        <q-btn flat round icon="mdi-close" @click="visible = false" />
      </q-card-section>
      <q-separator />
      <q-tabs v-model="aba" dense align="left">
        <q-tab name="novo" label="Novo pedido" />
        <q-tab name="historico" label="Historico" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="aba" animated>
        <q-tab-panel name="novo">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-7">
              <div class="row items-center q-mb-sm">
                <div class="text-subtitle1">Itens</div>
                <q-space />
                <q-btn rounded color="primary" icon="mdi-plus" label="Adicionar produto" @click="abrirProduto" />
              </div>
              <q-list bordered separator>
                <q-item v-for="(item, index) in carrinho" :key="index">
                  <q-item-section>
                    <q-item-label>{{ item.product.name }} x {{ item.quantity }}</q-item-label>
                    <q-item-label caption>
                      {{ item.options.map(opcao => opcao.name).join(', ') || 'Sem adicionais' }}
                    </q-item-label>
                    <q-item-label v-if="item.notes" caption>Obs.: {{ item.notes }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div>{{ formatarMoeda(totalItem(item)) }}</div>
                    <q-btn flat round dense color="negative" icon="mdi-delete" @click="carrinho.splice(index, 1)" />
                  </q-item-section>
                </q-item>
                <q-item v-if="!carrinho.length">
                  <q-item-section class="text-grey-7">Adicione ao menos um produto.</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="col-12 col-md-5 q-gutter-md">
              <q-select
                v-model="pedido.deliveryType"
                :options="tiposEntrega"
                emit-value
                map-options
                outlined
                dense
                label="Modalidade"
              />
              <div v-if="pedido.deliveryType === 'delivery'">
                <div class="row items-center q-mb-xs">
                  <div class="text-subtitle2">Endereco</div>
                  <q-space />
                  <q-btn flat dense color="primary" icon="mdi-plus" label="Novo" @click="modalEndereco = true" />
                </div>
                <q-select
                  v-model="enderecoSelecionado"
                  :options="enderecos"
                  option-label="label"
                  outlined
                  dense
                  label="Endereco de entrega"
                  @input="resolverTaxa"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label caption>{{ formatarEndereco(scope.opt) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <div v-if="zona" class="text-caption text-positive q-mt-xs">
                  Taxa {{ formatarMoeda(zona.deliveryFee) }} | previsao de {{ zona.estimatedMinutes }} minutos
                </div>
              </div>
              <q-input v-model.number="pedido.discount" outlined dense type="number" min="0" step="0.01" label="Desconto" />
              <q-select
                v-model="pedido.paymentMethod"
                :options="metodosPagamento"
                emit-value
                map-options
                outlined
                dense
                label="Pagamento"
              />
              <template v-if="pedido.paymentMethod === 'PIX'">
                <q-input v-model.trim="pedido.customer.email" outlined dense type="email" label="E-mail do pagador" />
                <q-input v-model.trim="pedido.customer.cpfCnpj" outlined dense label="CPF ou CNPJ do pagador" />
              </template>
              <q-input v-model.trim="pedido.notes" outlined dense type="textarea" label="Observacoes do pedido" />
              <q-list bordered>
                <q-item dense><q-item-section>Subtotal</q-item-section><q-item-section side>{{ formatarMoeda(subtotal) }}</q-item-section></q-item>
                <q-item dense><q-item-section>Entrega</q-item-section><q-item-section side>{{ formatarMoeda(taxaEntrega) }}</q-item-section></q-item>
                <q-item dense><q-item-section>Desconto</q-item-section><q-item-section side>{{ formatarMoeda(pedido.discount) }}</q-item-section></q-item>
                <q-item dense class="text-weight-bold"><q-item-section>Total estimado</q-item-section><q-item-section side>{{ formatarMoeda(total) }}</q-item-section></q-item>
              </q-list>
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="historico">
          <q-list bordered separator>
            <q-item v-for="order in historico" :key="order.id">
              <q-item-section>
                <q-item-label>Pedido #{{ order.id }} | {{ rotuloStatus(order.status) }}</q-item-label>
                <q-item-label caption>{{ order.items.map(item => `${item.quantity}x ${item.productNameSnapshot}`).join(', ') }}</q-item-label>
              </q-item-section>
              <q-item-section side>{{ formatarMoeda(order.total) }}</q-item-section>
            </q-item>
            <q-item v-if="!historico.length"><q-item-section>Nenhum pedido nesta conversa.</q-item-section></q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat rounded label="Fechar" @click="visible = false" />
        <q-btn
          v-if="aba === 'novo'"
          rounded
          color="primary"
          label="Criar pedido e enviar resumo"
          :disable="!pedidoValido"
          :loading="saving"
          @click="criarPedido"
        />
      </q-card-actions>
    </q-card>

    <q-dialog v-model="modalProduto" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section class="text-h6">Adicionar produto</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-select v-model="item.product" :options="produtosDisponiveis" option-label="name" outlined dense label="Produto" @input="selecionarProduto" />
          <template v-if="item.product">
            <q-input v-model.number="item.quantity" outlined dense type="number" min="1" label="Quantidade" />
            <div v-for="grupo in item.product.optionGroups" :key="grupo.id">
              <q-select
                v-model="item.optionIdsByGroup[grupo.id]"
                :options="grupo.options.filter(opcao => opcao.available)"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                multiple
                outlined
                dense
                use-chips
                :label="`${grupo.name}${grupo.required ? ' *' : ''}`"
                :hint="`Selecione de ${grupo.minSelections} ate ${grupo.maxSelections}`"
              />
            </div>
            <q-input v-model.trim="item.notes" outlined dense label="Observacao do item" />
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modalProduto = false" />
          <q-btn rounded color="primary" label="Adicionar" :disable="!itemValido" @click="adicionarAoCarrinho" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalEndereco" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section class="text-h6">Novo endereco</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="endereco.label" outlined dense label="Identificacao: casa, trabalho..." />
          <q-input v-model.trim="endereco.street" outlined dense label="Rua" />
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="endereco.number" outlined dense label="Numero" class="col" />
            <q-input v-model.trim="endereco.district" outlined dense label="Bairro" class="col" />
          </div>
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="endereco.city" outlined dense label="Cidade" class="col" />
            <q-input v-model.trim="endereco.state" outlined dense maxlength="2" label="UF" class="col-3" />
            <q-input v-model.trim="endereco.zipCode" outlined dense mask="########" label="CEP" class="col" />
          </div>
          <q-input v-model.trim="endereco.complement" outlined dense label="Complemento" />
          <q-input v-model.trim="endereco.reference" outlined dense label="Referencia" />
          <q-toggle v-model="endereco.isDefault" label="Endereco principal" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modalEndereco = false" />
          <q-btn rounded color="primary" label="Salvar" :disable="!enderecoValido" @click="salvarEndereco" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="modalPix">
      <q-card style="width: 480px; max-width: 95vw">
        <q-card-section class="text-h6">Pix do pedido</q-card-section>
        <q-card-section class="text-center">
          <img v-if="pixPayment.pixQrCode" :src="`data:image/png;base64,${pixPayment.pixQrCode}`" style="max-width: 260px">
          <q-input v-model="pixPayment.pixCopyPaste" outlined readonly type="textarea" label="Pix Copia e Cola" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn rounded color="primary" label="Fechar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script>
import { uid } from 'quasar'
import { EnviarMensagemTexto } from 'src/service/tickets'
import {
  CriarEnderecoDelivery, CriarPagamentoPedidoDelivery, CriarPedidoDelivery, ListarEnderecosDelivery,
  ListarPedidosDelivery, ListarProdutosDelivery, ResolverZonaDelivery
} from 'src/service/delivery'

const enderecoVazio = () => ({
  label: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: '',
  zipCode: '',
  complement: '',
  reference: '',
  isDefault: false
})
const itemVazio = () => ({ product: null, quantity: 1, notes: '', optionIdsByGroup: {} })

export default {
  name: 'ModalPedidoManual',
  props: {
    value: { type: Boolean, default: false },
    ticket: { type: Object, required: true }
  },
  data () {
    return {
      aba: 'novo',
      produtos: [],
      enderecos: [],
      historico: [],
      carrinho: [],
      enderecoSelecionado: null,
      zona: null,
      pedido: {
        deliveryType: 'delivery',
        discount: 0,
        notes: '',
        paymentMethod: 'CASH',
        customer: { email: '', cpfCnpj: '' }
      },
      endereco: enderecoVazio(),
      item: itemVazio(),
      modalProduto: false,
      modalEndereco: false,
      modalPix: false,
      pixPayment: {},
      saving: false,
      tiposEntrega: [
        { label: 'Entrega', value: 'delivery' },
        { label: 'Retirada no local', value: 'pickup' }
      ],
      metodosPagamento: [
        { label: 'Dinheiro na entrega', value: 'CASH' },
        { label: 'Cartao na entrega', value: 'CARD_ON_DELIVERY' },
        { label: 'Pix', value: 'PIX' }
      ]
    }
  },
  computed: {
    visible: {
      get () { return this.value },
      set (value) { this.$emit('input', value) }
    },
    produtosDisponiveis () {
      return this.produtos.filter(produto => produto.available)
    },
    subtotal () {
      return this.carrinho.reduce((total, item) => total + this.totalItem(item), 0)
    },
    taxaEntrega () {
      return this.pedido.deliveryType === 'delivery' ? Number(this.zona && this.zona.deliveryFee) || 0 : 0
    },
    total () {
      return Math.max(0, this.subtotal + this.taxaEntrega - (Number(this.pedido.discount) || 0))
    },
    itemValido () {
      if (!this.item.product || this.item.quantity < 1) return false
      return this.item.product.optionGroups.every(grupo => {
        const selected = this.item.optionIdsByGroup[grupo.id] || []
        return selected.length >= grupo.minSelections &&
          selected.length <= grupo.maxSelections &&
          (!grupo.required || selected.length > 0)
      })
    },
    enderecoValido () {
      return !!(
        this.endereco.label && this.endereco.street && this.endereco.number &&
        this.endereco.district && this.endereco.city &&
        this.endereco.state.length === 2 && this.endereco.zipCode.length === 8
      )
    },
    pedidoValido () {
      return !!(
        this.carrinho.length &&
        (this.pedido.paymentMethod !== 'PIX' || (
          this.pedido.customer.email &&
          [11, 14].includes(this.pedido.customer.cpfCnpj.replace(/\D/g, '').length)
        )) &&
        (this.pedido.deliveryType === 'pickup' || (this.enderecoSelecionado && this.zona))
      )
    }
  },
  watch: {
    value (visible) {
      if (visible) this.carregar()
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    },
    formatarEndereco (endereco) {
      return `${endereco.street}, ${endereco.number} - ${endereco.district}`
    },
    rotuloStatus (status) {
      const labels = {
        NEW: 'Novo',
        WAITING_PAYMENT: 'Aguardando pagamento',
        CONFIRMED: 'Confirmado',
        PREPARING: 'Em preparo',
        READY: 'Pronto',
        OUT_FOR_DELIVERY: 'Saiu para entrega',
        DELIVERED: 'Entregue',
        CANCELLED: 'Cancelado'
      }
      return labels[status] || status
    },
    totalItem (item) {
      return (Number(item.product.basePrice) + item.options.reduce((total, opcao) => total + Number(opcao.price), 0)) * item.quantity
    },
    abrirProduto () {
      this.item = itemVazio()
      this.modalProduto = true
    },
    selecionarProduto () {
      this.item.optionIdsByGroup = {}
      this.item.product.optionGroups.forEach(grupo => {
        this.$set(this.item.optionIdsByGroup, grupo.id, [])
      })
    },
    adicionarAoCarrinho () {
      if (!this.itemValido) return
      const optionIds = Object.values(this.item.optionIdsByGroup).flat()
      const options = this.item.product.optionGroups
        .flatMap(grupo => grupo.options)
        .filter(opcao => optionIds.includes(opcao.id))
      this.carrinho.push({ ...this.item, optionIds, options })
      this.modalProduto = false
    },
    async resolverTaxa () {
      this.zona = null
      if (!this.enderecoSelecionado) return
      try {
        const { data } = await ResolverZonaDelivery({
          district: this.enderecoSelecionado.district,
          zipCode: this.enderecoSelecionado.zipCode
        })
        this.zona = data
      } catch (error) {
        this.$q.notify({ type: 'warning', message: 'Nao existe area de entrega configurada para este endereco.' })
      }
    },
    async salvarEndereco () {
      if (!this.enderecoValido) return
      const { data } = await CriarEnderecoDelivery({ ...this.endereco, contactId: this.ticket.contact.id })
      this.enderecos.push(data)
      this.enderecoSelecionado = data
      this.modalEndereco = false
      this.endereco = enderecoVazio()
      await this.resolverTaxa()
    },
    montarResumo (order, payment) {
      const itens = order.items.map(item => `- ${item.quantity}x ${item.productNameSnapshot}: ${this.formatarMoeda(item.total)}`).join('\n')
      const pix = payment.pixCopyPaste ? `\n\n*Pix Copia e Cola:*\n${payment.pixCopyPaste}` : ''
      return `*Pedido #${order.id} criado*\n${itens}\nEntrega: ${this.formatarMoeda(order.deliveryFee)}\n*Total: ${this.formatarMoeda(order.total)}*${pix}`
    },
    async criarPedido () {
      if (!this.pedidoValido) return
      this.saving = true
      let order
      try {
        const response = await CriarPedidoDelivery({
          contactId: this.ticket.contact.id,
          ticketId: this.ticket.id,
          originChannel: ['whatsapp', 'instagram', 'facebook'].includes(this.ticket.channel) ? this.ticket.channel : 'manual',
          deliveryType: this.pedido.deliveryType,
          discount: Number(this.pedido.discount) || 0,
          deliveryAddressSnapshot: this.pedido.deliveryType === 'delivery' ? { ...this.enderecoSelecionado } : null,
          notes: this.pedido.notes,
          items: this.carrinho.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.notes,
            optionIds: item.optionIds
          }))
        })
        order = response.data
        const { data: payment } = await CriarPagamentoPedidoDelivery(order.id, {
          method: this.pedido.paymentMethod,
          customer: this.pedido.paymentMethod === 'PIX'
            ? {
              name: this.ticket.contact.name,
              email: this.pedido.customer.email,
              cpfCnpj: this.pedido.customer.cpfCnpj
            }
            : null
        })
        try {
          await EnviarMensagemTexto(this.ticket.id, {
            read: 1,
            fromMe: true,
            mediaUrl: '',
            body: this.montarResumo(order, payment),
            id: uid()
          })
        } catch (error) {
          this.$q.notify({ type: 'warning', message: `Pedido #${order.id} criado, mas o resumo nao foi enviado.` })
        }
        if (payment.method === 'PIX') {
          this.pixPayment = payment
          this.modalPix = true
        }
        this.$q.notify({ type: 'positive', message: `Pedido #${order.id} criado.` })
        this.resetarPedido()
        this.aba = 'historico'
        await this.carregarHistorico()
      } catch (error) {
        if (order) {
          this.$q.notify({
            type: 'warning',
            message: `Pedido #${order.id} criado, mas nao foi possivel registrar o pagamento.`
          })
          this.resetarPedido()
          this.aba = 'historico'
          await this.carregarHistorico()
          return
        }
        this.$notificarErro('Nao foi possivel criar o pedido.', error)
      } finally {
        this.saving = false
      }
    },
    resetarPedido () {
      this.carrinho = []
      this.enderecoSelecionado = null
      this.zona = null
      this.pedido = {
        deliveryType: 'delivery',
        discount: 0,
        notes: '',
        paymentMethod: 'CASH',
        customer: { email: '', cpfCnpj: '' }
      }
    },
    async carregarHistorico () {
      const { data } = await ListarPedidosDelivery({ ticketId: this.ticket.id })
      this.historico = data
    },
    async carregar () {
      const [produtos, enderecos] = await Promise.all([
        ListarProdutosDelivery(),
        ListarEnderecosDelivery(this.ticket.contact.id)
      ])
      this.produtos = produtos.data
      this.enderecos = enderecos.data
      this.enderecoSelecionado = this.enderecos.find(endereco => endereco.isDefault) || null
      if (this.enderecoSelecionado) await this.resolverTaxa()
      await this.carregarHistorico()
    }
  }
}
</script>
