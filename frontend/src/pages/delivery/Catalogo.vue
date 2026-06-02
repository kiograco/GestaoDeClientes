<template>
  <div class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">Cardapio</div>
        <div class="text-caption text-grey-7">Cadastre categorias e produtos disponiveis para pedidos.</div>
      </div>
      <q-space />
      <q-btn color="primary" rounded icon="mdi-plus" label="Nova categoria" class="q-mr-sm" @click="abrirCategoria()" />
      <q-btn color="primary" rounded icon="mdi-plus" label="Novo produto" :disable="!categorias.length" @click="abrirProduto()" />
    </div>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="text-h6">Categorias</q-card-section>
      <q-table flat :data="categorias" :columns="colunasCategorias" row-key="id" :loading="loading">
        <template v-slot:body-cell-isActive="props">
          <q-td :props="props">{{ props.value ? 'Ativa' : 'Inativa' }}</q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round icon="mdi-pencil" @click="abrirCategoria(props.row)" />
            <q-btn flat round color="negative" icon="mdi-delete" @click="excluirCategoria(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-card flat bordered>
      <q-card-section class="text-h6">Produtos</q-card-section>
      <q-table flat :data="produtos" :columns="colunasProdutos" row-key="id" :loading="loading">
        <template v-slot:body-cell-basePrice="props">
          <q-td :props="props">{{ formatarMoeda(props.value) }}</q-td>
        </template>
        <template v-slot:body-cell-available="props">
          <q-td :props="props">{{ props.value ? 'Disponivel' : 'Indisponivel' }}</q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round icon="mdi-pencil" @click="abrirProduto(props.row)" />
            <q-btn flat round color="negative" icon="mdi-delete" @click="excluirProduto(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modalCategoria" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section class="text-h6">{{ categoria.id ? 'Editar' : 'Nova' }} categoria</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.trim="categoria.name" outlined dense label="Nome" />
          <q-input v-model.trim="categoria.description" outlined dense type="textarea" label="Descricao" />
          <q-toggle v-model="categoria.isActive" label="Categoria ativa" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modalCategoria = false" />
          <q-btn rounded color="primary" label="Salvar" :disable="!categoria.name" :loading="saving" @click="salvarCategoria" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalProduto" persistent>
      <q-card style="width: 620px; max-width: 95vw">
        <q-card-section class="text-h6">{{ produto.id ? 'Editar' : 'Novo' }} produto</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-select v-model="produto.categoryId" :options="opcoesCategorias" emit-value map-options outlined dense label="Categoria" />
          <q-input v-model.trim="produto.name" outlined dense label="Nome" />
          <q-input v-model.trim="produto.description" outlined dense type="textarea" label="Descricao" />
          <q-input v-model.trim="produto.imageUrl" outlined dense label="URL da imagem" />
          <div class="row q-col-gutter-md">
            <q-input v-model.number="produto.basePrice" outlined dense type="number" min="0" step="0.01" label="Preco base" class="col" />
            <q-input v-model.trim="produto.saleStartTime" outlined dense mask="time" label="Venda a partir de" class="col" />
            <q-input v-model.trim="produto.saleEndTime" outlined dense mask="time" label="Venda ate" class="col" />
          </div>
          <q-toggle v-model="produto.available" label="Produto disponivel" />
          <q-separator />
          <div class="row items-center">
            <div class="text-subtitle2">Variacoes e adicionais</div>
            <q-space />
            <q-btn flat dense color="primary" icon="mdi-plus" label="Adicionar grupo" @click="adicionarGrupo" />
          </div>
          <q-card v-for="(grupo, grupoIndex) in produto.optionGroups" :key="grupoIndex" flat bordered>
            <q-card-section class="q-gutter-sm">
              <div class="row q-col-gutter-sm items-center">
                <q-input v-model.trim="grupo.name" outlined dense label="Grupo: tamanho, sabor ou adicional" class="col" />
                <q-toggle v-model="grupo.required" label="Obrigatorio" />
                <q-btn flat round color="negative" icon="mdi-delete" @click="removerGrupo(grupoIndex)" />
              </div>
              <div class="row q-col-gutter-sm">
                <q-input v-model.number="grupo.minSelections" outlined dense type="number" min="0" label="Minimo" class="col" />
                <q-input v-model.number="grupo.maxSelections" outlined dense type="number" min="1" label="Maximo" class="col" />
              </div>
              <div v-for="(opcao, opcaoIndex) in grupo.options" :key="opcaoIndex" class="row q-col-gutter-sm items-center">
                <q-input v-model.trim="opcao.name" outlined dense label="Opcao" class="col" />
                <q-input v-model.number="opcao.price" outlined dense type="number" min="0" step="0.01" label="Acrescimo" class="col-3" />
                <q-toggle v-model="opcao.available" label="Ativa" />
                <q-btn flat round color="negative" icon="mdi-delete" @click="removerOpcao(grupo, opcaoIndex)" />
              </div>
              <q-btn flat dense color="primary" icon="mdi-plus" label="Adicionar opcao" @click="adicionarOpcao(grupo)" />
            </q-card-section>
          </q-card>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded label="Cancelar" @click="modalProduto = false" />
          <q-btn rounded color="primary" label="Salvar" :disable="!produtoValido" :loading="saving" @click="salvarProduto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import {
  AlterarCategoriaDelivery, AlterarProdutoDelivery, CriarCategoriaDelivery,
  CriarProdutoDelivery, ExcluirCategoriaDelivery, ExcluirProdutoDelivery,
  ListarCategoriasDelivery, ListarProdutosDelivery
} from 'src/service/delivery'

const categoriaVazia = () => ({
  name: '',
  description: '',
  isActive: true
})
const produtoVazio = () => ({
  categoryId: null,
  name: '',
  description: '',
  imageUrl: '',
  basePrice: 0,
  available: true,
  saleStartTime: null,
  saleEndTime: null,
  optionGroups: []
})

export default {
  name: 'DeliveryCatalogo',
  data () {
    return {
      categorias: [],
      produtos: [],
      categoria: categoriaVazia(),
      produto: produtoVazio(),
      modalCategoria: false,
      modalProduto: false,
      loading: false,
      saving: false,
      colunasCategorias: [
        { name: 'name', label: 'Nome', field: 'name', align: 'left' },
        { name: 'description', label: 'Descricao', field: 'description', align: 'left' },
        { name: 'isActive', label: 'Status', field: 'isActive', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ],
      colunasProdutos: [
        { name: 'name', label: 'Produto', field: 'name', align: 'left' },
        { name: 'category', label: 'Categoria', field: row => row.category?.name, align: 'left' },
        { name: 'basePrice', label: 'Preco', field: 'basePrice', align: 'left' },
        { name: 'available', label: 'Status', field: 'available', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ]
    }
  },
  computed: {
    opcoesCategorias () {
      return this.categorias.map(categoria => ({ label: categoria.name, value: categoria.id }))
    },
    produtoValido () {
      return !!(
        this.produto.categoryId &&
        this.produto.name &&
        this.produto.basePrice >= 0 &&
        this.produto.optionGroups.every(grupo =>
          grupo.name &&
          grupo.minSelections >= 0 &&
          grupo.maxSelections >= Math.max(1, grupo.minSelections) &&
          grupo.options.every(opcao => opcao.name && opcao.price >= 0)
        )
      )
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    },
    abrirCategoria (categoria = null) {
      this.categoria = categoria ? { ...categoria } : categoriaVazia()
      this.modalCategoria = true
    },
    abrirProduto (produto = null) {
      this.produto = produto ? { ...produto, optionGroups: produto.optionGroups || [] } : produtoVazio()
      this.modalProduto = true
    },
    adicionarGrupo () {
      this.produto.optionGroups.push({
        name: '',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        options: []
      })
    },
    removerGrupo (index) {
      this.produto.optionGroups.splice(index, 1)
    },
    adicionarOpcao (grupo) {
      grupo.options.push({ name: '', price: 0, available: true })
    },
    removerOpcao (grupo, index) {
      grupo.options.splice(index, 1)
    },
    async carregar () {
      this.loading = true
      try {
        const [categorias, produtos] = await Promise.all([ListarCategoriasDelivery(), ListarProdutosDelivery()])
        this.categorias = categorias.data
        this.produtos = produtos.data
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar o cardapio.', error)
      } finally {
        this.loading = false
      }
    },
    async salvarCategoria () {
      this.saving = true
      try {
        const action = this.categoria.id ? AlterarCategoriaDelivery : CriarCategoriaDelivery
        await action(this.categoria)
        this.modalCategoria = false
        await this.carregar()
      } finally {
        this.saving = false
      }
    },
    async salvarProduto () {
      this.saving = true
      try {
        const action = this.produto.id ? AlterarProdutoDelivery : CriarProdutoDelivery
        await action(this.produto)
        this.modalProduto = false
        await this.carregar()
      } finally {
        this.saving = false
      }
    },
    excluirCategoria (categoria) {
      this.confirmarExclusao(`Excluir a categoria "${categoria.name}"?`, async () => {
        await ExcluirCategoriaDelivery(categoria.id)
        await this.carregar()
      })
    },
    excluirProduto (produto) {
      this.confirmarExclusao(`Excluir o produto "${produto.name}"?`, async () => {
        await ExcluirProdutoDelivery(produto.id)
        await this.carregar()
      })
    },
    confirmarExclusao (message, action) {
      this.$q.dialog({ title: 'Atencao', message, cancel: true, persistent: true }).onOk(action)
    }
  },
  mounted () {
    this.carregar()
  }
}
</script>
