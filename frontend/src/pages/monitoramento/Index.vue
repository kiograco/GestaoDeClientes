<template>
  <div class="app-page monitoramento-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Monitoramento</h1>
        <div class="app-page-subtitle">
          Controle de tipos de armadilhas, pontos instalados e historico operacional.
        </div>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="mdi-plus"
        :label="tab === 'tipos' ? 'Novo tipo' : 'Gerar pontos'"
        @click="tab === 'tipos' ? abrirTipo() : abrirPontos()"
      />
    </div>

    <q-card flat bordered class="app-card">
      <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary">
        <q-tab name="tipos" icon="mdi-toy-brick-marker-outline" label="Tipos de Armadilhas" />
        <q-tab name="pontos" icon="mdi-map-marker-radius-outline" label="Pontos" />
        <q-tab name="mapa" icon="mdi-floor-plan" label="Mapa" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="tipos">
          <q-table flat :data="tipos" :columns="colunasTipos" row-key="id" :loading="loading">
            <template v-slot:body-cell-active="props">
              <q-td :props="props">
                <q-badge :color="props.value ? 'positive' : 'grey'">
                  {{ props.value ? 'Ativo' : 'Inativo' }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat round dense icon="mdi-pencil" @click="abrirTipo(props.row)" />
                <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="excluirTipo(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="pontos">
          <div class="monitoramento-filtros">
            <q-select
              v-model="filtros.clientId"
              :options="opcoesClientes"
              emit-value
              map-options
              outlined
              dense
              clearable
              label="Cliente"
              @input="carregarPontos"
            />
          </div>
          <q-table flat :data="pontos" :columns="colunasPontos" row-key="id" :loading="loading">
            <template v-slot:body-cell-label="props">
              <q-td :props="props">
                <div class="monitoramento-name">{{ props.row.label }}</div>
                <div class="monitoramento-caption">{{ props.row.trapType?.name || 'Tipo nao informado' }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-location="props">
              <q-td :props="props">
                {{ props.row.area?.name || '-' }} / {{ props.row.sector?.name || '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-owner="props">
              <q-td :props="props">{{ props.value === 'client' ? 'Cliente' : 'Empresa' }}</q-td>
            </template>
            <template v-slot:body-cell-active="props">
              <q-td :props="props">
                <q-badge :color="props.value ? 'positive' : 'grey'">
                  {{ props.value ? 'Instalado' : 'Removido' }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat round dense icon="mdi-swap-horizontal" @click="abrirMovimentacao(props.row)">
                  <q-tooltip>Registrar troca ou mudanca</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="removerPonto(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="mapa">
          <div class="map-toolbar">
            <q-select v-model="mapa.clientId" :options="opcoesClientes" emit-value map-options outlined dense label="Cliente" />
            <q-select v-model="mapa.addressId" :options="opcoesEnderecosMapa" emit-value map-options outlined dense label="Endereco" @input="carregarPlantas" />
            <q-select v-model="mapa.floorPlanId" :options="opcoesPlantas" emit-value map-options outlined dense label="Planta" />
            <q-select v-model="mapa.pointId" :options="opcoesPontosMapa" emit-value map-options outlined dense label="Armadilha para posicionar" />
            <q-btn outline color="primary" icon="mdi-upload" label="Planta" @click="modalPlanta = true" />
            <q-btn flat round icon="mdi-magnify-plus-outline" @click="zoom = Math.min(zoom + 0.1, 2.5)" />
            <q-btn flat round icon="mdi-magnify-minus-outline" @click="zoom = Math.max(zoom - 0.1, 0.5)" />
            <q-btn flat round icon="mdi-fit-to-page-outline" @click="resetMapa" />
            <q-btn flat round icon="mdi-fullscreen" @click="fullscreen = !fullscreen" />
          </div>

          <div :class="['map-shell', { 'map-shell--fullscreen': fullscreen }]">
            <div
              ref="mapCanvas"
              class="map-canvas"
              :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
              @click="posicionarPorClique"
              @mousedown="iniciarPan"
              @mousemove="moverPan"
              @mouseup="encerrarPan"
              @mouseleave="encerrarPan"
            >
              <iframe v-if="plantaSelecionada?.fileType === 'application/pdf'" class="map-media" :src="urlArquivo(plantaSelecionada.fileUrl)" />
              <img v-else-if="plantaSelecionada" class="map-media" :src="urlArquivo(plantaSelecionada.fileUrl)" alt="Planta baixa" draggable="false">
              <div v-else class="map-empty">Selecione ou envie uma planta baixa.</div>

              <button
                v-for="ponto in pontosDaPlanta"
                :key="ponto.id"
                class="map-marker"
                :class="classeMarcador(ponto)"
                :style="{ left: `${ponto.positionX}%`, top: `${ponto.positionY}%` }"
                draggable="true"
                @dragstart="pontoArrastado = ponto"
                @dragend="arrastarMarcador"
                @click.stop="mapa.pointId = ponto.id"
              >
                {{ ponto.mapLabel || ponto.pointNumber }}
                <q-tooltip>
                  {{ ponto.label }} - {{ ponto.trapType?.name || 'Tipo' }} - {{ ponto.area?.name || '-' }} / {{ ponto.sector?.name || '-' }}
                </q-tooltip>
              </button>
            </div>
          </div>

          <div class="map-legend">
            <span><i class="legend-dot legend-dot--bait" /> Porta Isca</span>
            <span><i class="legend-dot legend-dot--glue" /> Cola</span>
            <span><i class="legend-dot legend-dot--light" /> Armadilha Luminosa</span>
            <span><i class="legend-dot legend-dot--maintenance" /> Necessita manutenção</span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="modalTipo" persistent>
      <q-card class="monitoramento-modal app-card">
        <q-card-section class="monitoramento-modal__header">
          <div class="monitoramento-modal__title">{{ tipo.id ? 'Editar tipo' : 'Novo tipo de armadilha' }}</div>
          <q-btn flat round dense icon="mdi-close" @click="modalTipo = false" />
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="tipo.name" outlined label="Nome *" class="col-12 col-md-6" />
            <q-input v-model.trim="tipo.code" outlined label="Codigo *" class="col-12 col-md-3" />
            <q-input v-model.trim="tipo.type" outlined label="Tipo *" class="col-12 col-md-3" />
            <q-input v-model.trim="tipo.description" outlined type="textarea" autogrow label="Descricao" class="col-12" />
            <q-toggle v-model="tipo.active" label="Ativo" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="modalTipo = false" />
          <q-btn unelevated color="primary" label="Salvar" :disable="!tipoValido" :loading="saving" @click="salvarTipo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalPontos" persistent>
      <q-card class="monitoramento-modal app-card">
        <q-card-section class="monitoramento-modal__header">
          <div class="monitoramento-modal__title">Gerar pontos de monitoramento</div>
          <q-btn flat round dense icon="mdi-close" @click="modalPontos = false" />
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <q-select v-model="ponto.clientId" :options="opcoesClientes" emit-value map-options outlined label="Cliente *" class="col-12 col-md-6" />
            <q-select v-model="ponto.addressId" :options="opcoesEnderecos" emit-value map-options outlined label="Endereco *" class="col-12 col-md-6" />
            <q-select v-model="ponto.areaId" :options="opcoesAreas" emit-value map-options outlined label="Area *" class="col-12 col-md-6" />
            <q-select v-model="ponto.sectorId" :options="opcoesSetores" emit-value map-options outlined label="Setor *" class="col-12 col-md-6" />
            <q-select v-model="ponto.trapTypeId" :options="opcoesTipos" emit-value map-options outlined label="Tipo de Armadilha *" class="col-12 col-md-6" />
            <q-select v-model="ponto.owner" :options="opcoesProprietario" emit-value map-options outlined label="Proprietario *" class="col-12 col-md-3" />
            <q-input v-model="ponto.installedAt" outlined type="date" label="Data de Instalacao *" class="col-12 col-md-3" />
            <q-input v-model.number="ponto.initialNumber" outlined type="number" min="1" label="Numero Inicial *" class="col-12 col-md-3" />
            <q-input v-model.number="ponto.finalNumber" outlined type="number" min="1" label="Numero Final *" class="col-12 col-md-3" />
            <q-input v-model.trim="ponto.notes" outlined label="Observacoes" class="col-12 col-md-6" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="modalPontos = false" />
          <q-btn unelevated color="primary" label="Gerar" :disable="!pontoValido" :loading="saving" @click="gerarPontos" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalMovimentacao" persistent>
      <q-card class="monitoramento-modal app-card">
        <q-card-section class="monitoramento-modal__header">
          <div class="monitoramento-modal__title">Atualizar ponto</div>
          <q-btn flat round dense icon="mdi-close" @click="modalMovimentacao = false" />
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <q-select v-model="movimento.historyAction" :options="opcoesAcao" emit-value map-options outlined label="Acao *" class="col-12 col-md-4" />
            <q-select v-model="movimento.areaId" :options="opcoesAreasMovimento" emit-value map-options outlined label="Nova area" class="col-12 col-md-4" />
            <q-select v-model="movimento.sectorId" :options="opcoesSetoresMovimento" emit-value map-options outlined label="Novo setor" class="col-12 col-md-4" />
            <q-input v-model.trim="movimento.historyNotes" outlined type="textarea" autogrow label="Observacoes do historico" class="col-12" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="modalMovimentacao = false" />
          <q-btn unelevated color="primary" label="Salvar" :loading="saving" @click="salvarMovimentacao" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalPlanta" persistent>
      <q-card class="monitoramento-modal app-card">
        <q-card-section class="monitoramento-modal__header">
          <div class="monitoramento-modal__title">Enviar planta baixa</div>
          <q-btn flat round dense icon="mdi-close" @click="modalPlanta = false" />
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <q-input v-model.trim="planta.name" outlined label="Nome da Planta *" class="col-12 col-md-6" />
            <q-select v-model="planta.clientId" :options="opcoesClientes" emit-value map-options outlined label="Cliente *" class="col-12 col-md-6" />
            <q-select v-model="planta.addressId" :options="opcoesEnderecosPlanta" emit-value map-options outlined label="Endereco *" class="col-12" />
            <q-file v-model="planta.file" outlined accept=".pdf,.jpg,.jpeg,.png,.webp" label="PDF, JPG, PNG ou WEBP *" class="col-12" />
            <q-input v-model.trim="planta.notes" outlined label="Observacoes" class="col-12" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="modalPlanta = false" />
          <q-btn unelevated color="primary" label="Enviar" :disable="!plantaValida" :loading="saving" @click="enviarPlanta" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ListarClientes } from 'src/service/clientes'
import {
  AlterarPontoMonitoramento,
  AlterarTipoArmadilha,
  CriarPlantaCliente,
  CriarPontosMonitoramento,
  CriarTipoArmadilha,
  ExcluirPontoMonitoramento,
  ExcluirTipoArmadilha,
  ListarPlantasCliente,
  ListarPontosMonitoramento,
  ListarTiposArmadilha,
  PosicionarPontoMonitoramento
} from 'src/service/monitoramento'

const hoje = () => new Date().toISOString().slice(0, 10)

const tipoVazio = () => ({
  name: '',
  code: '',
  type: '',
  description: '',
  active: true
})

const pontoVazio = () => ({
  clientId: null,
  addressId: null,
  areaId: null,
  sectorId: null,
  trapTypeId: null,
  owner: 'company',
  installedAt: hoje(),
  initialNumber: 1,
  finalNumber: 1,
  notes: ''
})

export default {
  name: 'MonitoramentoIndex',
  data () {
    return {
      tab: 'pontos',
      loading: false,
      saving: false,
      tipos: [],
      pontos: [],
      plantas: [],
      clientes: [],
      mapa: { clientId: null, addressId: null, floorPlanId: null, pointId: null },
      planta: { name: '', clientId: null, addressId: null, file: null, notes: '' },
      zoom: 1,
      pan: { x: 0, y: 0 },
      panning: false,
      lastPan: null,
      fullscreen: false,
      pontoArrastado: null,
      filtros: { clientId: null },
      tipo: tipoVazio(),
      ponto: pontoVazio(),
      movimento: {},
      modalTipo: false,
      modalPontos: false,
      modalPlanta: false,
      modalMovimentacao: false,
      colunasTipos: [
        { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
        { name: 'code', label: 'Codigo', field: 'code', align: 'left' },
        { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
        { name: 'active', label: 'Status', field: 'active', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ],
      colunasPontos: [
        { name: 'label', label: 'Ponto', field: 'label', align: 'left', sortable: true },
        { name: 'client', label: 'Cliente', field: row => row.client?.legalName, align: 'left' },
        { name: 'location', label: 'Area / Setor', field: 'location', align: 'left' },
        { name: 'owner', label: 'Proprietario', field: 'owner', align: 'left' },
        { name: 'active', label: 'Status', field: 'active', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ],
      opcoesProprietario: [
        { label: 'Empresa', value: 'company' },
        { label: 'Cliente', value: 'client' }
      ],
      opcoesAcao: [
        { label: 'Troca', value: 'replacement' },
        { label: 'Remocao', value: 'removal' },
        { label: 'Mudanca de setor', value: 'sector_change' },
        { label: 'Mudanca de area', value: 'area_change' }
      ]
    }
  },
  computed: {
    tipoValido () {
      return !!(this.tipo.name && this.tipo.code && this.tipo.type)
    },
    pontoValido () {
      return !!(
        this.ponto.clientId &&
        this.ponto.addressId &&
        this.ponto.areaId &&
        this.ponto.sectorId &&
        this.ponto.trapTypeId &&
        this.ponto.initialNumber &&
        this.ponto.finalNumber >= this.ponto.initialNumber
      )
    },
    opcoesClientes () {
      return this.clientes.map(cliente => ({ label: cliente.legalName, value: cliente.id }))
    },
    clienteSelecionado () {
      return this.clientes.find(cliente => cliente.id === this.ponto.clientId)
    },
    opcoesEnderecos () {
      return (this.clienteSelecionado?.addresses || []).map(endereco => ({
        label: `${endereco.addressType || 'Endereco'} - ${endereco.street || endereco.city || endereco.id}`,
        value: endereco.id
      }))
    },
    enderecoSelecionado () {
      return (this.clienteSelecionado?.addresses || []).find(endereco => endereco.id === this.ponto.addressId)
    },
    opcoesAreas () {
      return (this.enderecoSelecionado?.areas || []).map(area => ({ label: area.name, value: area.id }))
    },
    areaSelecionada () {
      return (this.enderecoSelecionado?.areas || []).find(area => area.id === this.ponto.areaId)
    },
    opcoesSetores () {
      return (this.areaSelecionada?.sectors || []).map(setor => ({ label: setor.name, value: setor.id }))
    },
    opcoesTipos () {
      return this.tipos.filter(tipo => tipo.active).map(tipo => ({ label: `${tipo.name} (${tipo.code})`, value: tipo.id }))
    },
    plantaValida () {
      return !!(this.planta.name && this.planta.clientId && this.planta.addressId && this.planta.file)
    },
    clienteMapa () {
      return this.clientes.find(cliente => cliente.id === this.mapa.clientId)
    },
    opcoesEnderecosMapa () {
      return (this.clienteMapa?.addresses || []).map(endereco => ({
        label: `${endereco.addressType || 'Endereco'} - ${endereco.street || endereco.city || endereco.id}`,
        value: endereco.id
      }))
    },
    opcoesEnderecosPlanta () {
      const cliente = this.clientes.find(item => item.id === this.planta.clientId)
      return (cliente?.addresses || []).map(endereco => ({
        label: `${endereco.addressType || 'Endereco'} - ${endereco.street || endereco.city || endereco.id}`,
        value: endereco.id
      }))
    },
    opcoesPlantas () {
      return this.plantas.map(planta => ({ label: planta.name, value: planta.id }))
    },
    plantaSelecionada () {
      return this.plantas.find(planta => planta.id === this.mapa.floorPlanId)
    },
    opcoesPontosMapa () {
      return this.pontos
        .filter(ponto => !this.mapa.addressId || ponto.addressId === this.mapa.addressId)
        .map(ponto => ({ label: `${ponto.label} - ${ponto.sector?.name || 'Setor'}`, value: ponto.id }))
    },
    pontosDaPlanta () {
      return this.pontos.filter(ponto => ponto.floorPlanId === this.mapa.floorPlanId && ponto.isPositioned)
    },
    clienteMovimento () {
      return this.clientes.find(cliente => cliente.id === this.movimento.clientId)
    },
    enderecoMovimento () {
      return (this.clienteMovimento?.addresses || []).find(endereco => endereco.id === this.movimento.addressId)
    },
    opcoesAreasMovimento () {
      return (this.enderecoMovimento?.areas || []).map(area => ({ label: area.name, value: area.id }))
    },
    areaMovimento () {
      return (this.enderecoMovimento?.areas || []).find(area => area.id === this.movimento.areaId)
    },
    opcoesSetoresMovimento () {
      return (this.areaMovimento?.sectors || []).map(setor => ({ label: setor.name, value: setor.id }))
    }
  },
  watch: {
    'ponto.clientId' () {
      this.ponto.addressId = null
      this.ponto.areaId = null
      this.ponto.sectorId = null
    },
    'ponto.addressId' () {
      this.ponto.areaId = null
      this.ponto.sectorId = null
    },
    'ponto.areaId' () {
      this.ponto.sectorId = null
    },
    'mapa.clientId' () {
      this.mapa.addressId = null
      this.mapa.floorPlanId = null
      this.mapa.pointId = null
      this.plantas = []
    },
    'movimento.areaId' () {
      if (!this.opcoesSetoresMovimento.some(setor => setor.value === this.movimento.sectorId)) {
        this.movimento.sectorId = null
      }
    }
  },
  mounted () {
    this.carregarTudo()
  },
  methods: {
    async carregarTudo () {
      this.loading = true
      try {
        const [tipos, clientes] = await Promise.all([ListarTiposArmadilha(), ListarClientes()])
        this.tipos = tipos.data
        this.clientes = clientes.data
        await this.carregarPontos()
      } catch (error) {
        this.$notificarErro('Nao foi possivel carregar o monitoramento.', error)
      } finally {
        this.loading = false
      }
    },
    async carregarPontos () {
      const { data } = await ListarPontosMonitoramento({
        clientId: this.filtros.clientId || undefined
      })
      this.pontos = data
    },
    urlArquivo (fileUrl) {
      return `${process.env.VUE_URL_API || ''}${fileUrl}`
    },
    async carregarPlantas () {
      if (!this.mapa.addressId) return
      const { data } = await ListarPlantasCliente({
        clientId: this.mapa.clientId,
        addressId: this.mapa.addressId
      })
      this.plantas = data
      this.mapa.floorPlanId = data[0]?.id || null
    },
    async enviarPlanta () {
      const formData = new FormData()
      formData.append('name', this.planta.name)
      formData.append('clientId', this.planta.clientId)
      formData.append('addressId', this.planta.addressId)
      formData.append('notes', this.planta.notes || '')
      formData.append('file', this.planta.file)
      this.saving = true
      try {
        await CriarPlantaCliente(formData)
        this.modalPlanta = false
        this.mapa.clientId = this.planta.clientId
        this.mapa.addressId = this.planta.addressId
        this.planta = { name: '', clientId: null, addressId: null, file: null, notes: '' }
        await this.carregarPlantas()
        this.$q.notify({ type: 'positive', message: 'Planta enviada.' })
      } catch (error) {
        this.$notificarErro('Nao foi possivel enviar a planta.', error)
      } finally {
        this.saving = false
      }
    },
    coordenadasDoEvento (event) {
      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      return {
        x: Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 0), 100),
        y: Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 100, 0), 100)
      }
    },
    async salvarPosicao (pointId, coords) {
      if (!this.mapa.floorPlanId || !pointId) return
      await PosicionarPontoMonitoramento(pointId, {
        floorPlanId: this.mapa.floorPlanId,
        positionX: Number(coords.x.toFixed(4)),
        positionY: Number(coords.y.toFixed(4))
      })
      await this.carregarPontos()
    },
    async posicionarPorClique (event) {
      if (this.panning || !this.mapa.pointId || !this.plantaSelecionada) return
      await this.salvarPosicao(this.mapa.pointId, this.coordenadasDoEvento(event))
    },
    async arrastarMarcador (event) {
      if (!this.pontoArrastado || !this.plantaSelecionada) return
      const coords = this.coordenadasDoEvento(event)
      await this.salvarPosicao(this.pontoArrastado.id, coords)
      this.pontoArrastado = null
    },
    iniciarPan (event) {
      if (event.target.classList?.contains('map-marker')) return
      this.panning = true
      this.lastPan = { x: event.clientX, y: event.clientY }
    },
    moverPan (event) {
      if (!this.panning || !this.lastPan) return
      this.pan.x += event.clientX - this.lastPan.x
      this.pan.y += event.clientY - this.lastPan.y
      this.lastPan = { x: event.clientX, y: event.clientY }
    },
    encerrarPan () {
      this.panning = false
      this.lastPan = null
    },
    resetMapa () {
      this.zoom = 1
      this.pan = { x: 0, y: 0 }
    },
    classeMarcador (ponto) {
      const name = (ponto.trapType?.name || '').toLowerCase()
      if (!ponto.active) return 'map-marker--maintenance'
      if (name.includes('luminosa')) return 'map-marker--light'
      if (name.includes('cola')) return 'map-marker--glue'
      return 'map-marker--bait'
    },
    abrirTipo (tipo = null) {
      this.tipo = tipo ? { ...tipo } : tipoVazio()
      this.modalTipo = true
    },
    async salvarTipo () {
      this.saving = true
      try {
        const action = this.tipo.id ? AlterarTipoArmadilha : CriarTipoArmadilha
        await action(this.tipo)
        this.modalTipo = false
        this.$q.notify({ type: 'positive', message: 'Tipo de armadilha salvo.' })
        await this.carregarTudo()
      } catch (error) {
        this.$notificarErro('Nao foi possivel salvar o tipo de armadilha.', error)
      } finally {
        this.saving = false
      }
    },
    excluirTipo (tipo) {
      this.$q.dialog({ title: 'Excluir tipo', message: `Excluir ${tipo.name}?`, cancel: true }).onOk(async () => {
        try {
          await ExcluirTipoArmadilha(tipo.id)
          await this.carregarTudo()
        } catch (error) {
          this.$notificarErro('Nao foi possivel excluir o tipo.', error)
        }
      })
    },
    abrirPontos () {
      this.ponto = pontoVazio()
      this.modalPontos = true
    },
    async gerarPontos () {
      this.saving = true
      try {
        await CriarPontosMonitoramento(this.ponto)
        this.modalPontos = false
        this.$q.notify({ type: 'positive', message: 'Pontos gerados.' })
        await this.carregarPontos()
      } catch (error) {
        this.$notificarErro('Nao foi possivel gerar os pontos.', error)
      } finally {
        this.saving = false
      }
    },
    abrirMovimentacao (ponto) {
      this.movimento = {
        id: ponto.id,
        clientId: ponto.clientId,
        addressId: ponto.addressId,
        areaId: ponto.areaId,
        sectorId: ponto.sectorId,
        historyAction: 'replacement',
        historyNotes: ''
      }
      this.modalMovimentacao = true
    },
    async salvarMovimentacao () {
      this.saving = true
      try {
        await AlterarPontoMonitoramento(this.movimento)
        this.modalMovimentacao = false
        this.$q.notify({ type: 'positive', message: 'Historico registrado.' })
        await this.carregarPontos()
      } catch (error) {
        this.$notificarErro('Nao foi possivel atualizar o ponto.', error)
      } finally {
        this.saving = false
      }
    },
    removerPonto (ponto) {
      this.$q.dialog({ title: 'Remover ponto', message: `Remover ${ponto.label}?`, cancel: true }).onOk(async () => {
        try {
          await ExcluirPontoMonitoramento(ponto.id)
          await this.carregarPontos()
        } catch (error) {
          this.$notificarErro('Nao foi possivel remover o ponto.', error)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.monitoramento-filtros {
  display: grid;
  grid-template-columns: minmax(220px, 320px);
  gap: 12px;
  margin-bottom: 16px;
}

.monitoramento-name {
  color: var(--text-primary);
  font-weight: 700;
}

.monitoramento-caption {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 18px;
}

.monitoramento-modal {
  width: 920px;
  max-width: 96vw;
}

.monitoramento-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.monitoramento-modal__title {
  color: var(--text-primary);
  font-size: 18px;
  line-height: 26px;
  font-weight: 750;
}

.map-toolbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) repeat(5, auto);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.map-shell {
  height: 620px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
  position: relative;
}

.map-shell--fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 7000;
  height: auto;
  background: var(--surface);
}

.map-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center center;
  cursor: grab;
}

.map-canvas:active {
  cursor: grabbing;
}

.map-media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  border: 0;
  background: #fff;
}

.map-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 30px;
  height: 30px;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  line-height: 24px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(15, 23, 42, .24);
  cursor: move;
}

.map-marker--bait { background: #16a34a; }
.map-marker--glue { background: #0ea5e9; }
.map-marker--light { background: #f59e0b; }
.map-marker--maintenance { background: #ef4444; }

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot--bait { background: #16a34a; }
.legend-dot--glue { background: #0ea5e9; }
.legend-dot--light { background: #f59e0b; }
.legend-dot--maintenance { background: #ef4444; }

@media (max-width: 700px) {
  .monitoramento-filtros {
    grid-template-columns: 1fr;
  }

  .map-toolbar {
    grid-template-columns: 1fr;
  }

  .map-shell {
    height: 420px;
  }
}
</style>
