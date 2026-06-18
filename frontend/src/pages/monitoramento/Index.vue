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
        <q-tab name="catalogos" icon="mdi-checkbox-marked-outline" label="Situações e Ações" />
        <q-tab name="pontos" icon="mdi-map-marker-radius-outline" label="Pontos" />
        <q-tab name="inspecao" icon="mdi-clipboard-check-outline" label="Inspeção Rápida" />
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
            <template v-slot:body-cell-pests="props">
              <q-td :props="props">
                {{ pragasTipo(props.row) }}
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

        <q-tab-panel name="catalogos">
          <div class="catalog-grid">
            <q-card flat bordered>
              <q-card-section class="row items-center">
                <div>
                  <div class="text-subtitle1 text-weight-medium">Situações da armadilha</div>
                  <div class="text-caption text-grey-7">Opções usadas nas inspeções de campo.</div>
                </div>
                <q-space />
                <q-btn outline color="primary" icon="mdi-plus" label="Situação" @click="abrirCatalogo('condition')" />
              </q-card-section>
              <q-table flat :data="condicoes" :columns="colunasCatalogo" row-key="id">
                <template v-slot:body-cell-active="props">
                  <q-td :props="props">
                    <q-badge :color="props.value ? 'positive' : 'grey'">{{ props.value ? 'Ativo' : 'Inativo' }}</q-badge>
                  </q-td>
                </template>
                <template v-slot:body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn flat round dense icon="mdi-pencil" @click="abrirCatalogo('condition', props.row)" />
                  </q-td>
                </template>
              </q-table>
            </q-card>

            <q-card flat bordered>
              <q-card-section class="row items-center">
                <div>
                  <div class="text-subtitle1 text-weight-medium">Ações tomadas</div>
                  <div class="text-caption text-grey-7">Procedimentos executados pelo técnico.</div>
                </div>
                <q-space />
                <q-btn outline color="primary" icon="mdi-plus" label="Ação" @click="abrirCatalogo('action')" />
              </q-card-section>
              <q-table flat :data="acoes" :columns="colunasCatalogo" row-key="id">
                <template v-slot:body-cell-active="props">
                  <q-td :props="props">
                    <q-badge :color="props.value ? 'positive' : 'grey'">{{ props.value ? 'Ativo' : 'Inativo' }}</q-badge>
                  </q-td>
                </template>
                <template v-slot:body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn flat round dense icon="mdi-pencil" @click="abrirCatalogo('action', props.row)" />
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>
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
                <q-btn flat round dense color="primary" icon="mdi-clipboard-check-outline" @click="abrirInspecao(props.row)">
                  <q-tooltip>Inspecionar armadilha</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="negative" icon="mdi-delete-outline" @click="removerPonto(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="inspecao">
          <div class="inspection-mobile">
            <q-select v-model="inspecao.monitoringPointId" :options="opcoesPontosInspecao" emit-value map-options outlined label="Armadilha *" />
            <q-input v-model="inspecao.inspectionDate" outlined type="datetime-local" label="Data e hora da inspeção" />
            <q-select v-model="inspecao.conditionIds" :options="opcoesCondicoes" emit-value map-options multiple use-chips outlined label="Situações identificadas" />
            <q-select v-model="inspecao.actionIds" :options="opcoesAcoes" emit-value map-options multiple use-chips outlined label="Ações tomadas" />
            <q-input v-model.trim="inspecao.notes" outlined type="textarea" autogrow label="Observações" />
            <q-btn unelevated color="primary" icon="mdi-content-save-check-outline" label="Salvar inspeção" :disable="!inspecaoValida" :loading="saving" @click="salvarInspecao" />
          </div>

          <q-table class="q-mt-md" flat :data="inspecoes" :columns="colunasInspecoes" row-key="id">
            <template v-slot:body-cell-monitoringPoint="props">
              <q-td :props="props">{{ props.row.monitoringPoint?.label || '-' }}</q-td>
            </template>
            <template v-slot:body-cell-conditions="props">
              <q-td :props="props">{{ (props.row.conditions || []).map(item => item.name).join(', ') || '-' }}</q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">{{ (props.row.actions || []).map(item => item.name).join(', ') || '-' }}</q-td>
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
          </div>

          <floor-plan-trap-map
            :floor-plan-id="mapa.floorPlanId"
            :client-id="mapa.clientId"
            :address-id="mapa.addressId"
            :floor-plan="plantaSelecionada"
            :monitoring-points="pontos"
            :selected-point-id="mapa.pointId"
            :marker-mode="mapa.markerMode"
            @select="mapa.pointId = $event"
            @marker-mode="mapa.markerMode = $event"
            @position="salvarPosicaoMapa"
            @remove-position="removerPosicaoMapa"
          />
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
            <q-input v-model.trim="tipo.code" outlined label="Sigla *" class="col-12 col-md-3" />
            <q-input v-model.trim="tipo.type" outlined label="Tipo" class="col-12 col-md-3" />
            <q-select v-model="tipo.pestIds" :options="opcoesPragas" emit-value map-options multiple use-chips outlined label="Pragas vinculadas" class="col-12" />
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

    <q-dialog v-model="modalCatalogo" persistent>
      <q-card class="monitoramento-modal app-card">
        <q-card-section class="monitoramento-modal__header">
          <div class="monitoramento-modal__title">{{ catalogo.id ? 'Editar' : 'Novo' }} {{ catalogo.type === 'condition' ? 'situação' : 'ação' }}</div>
          <q-btn flat round dense icon="mdi-close" @click="modalCatalogo = false" />
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <q-input v-model.trim="catalogo.name" outlined label="Nome *" class="col-12" />
          <q-toggle v-model="catalogo.active" label="Ativo" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="modalCatalogo = false" />
          <q-btn unelevated color="primary" label="Salvar" :disable="!catalogo.name" :loading="saving" @click="salvarCatalogo" />
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
            <q-input v-model="ponto.markerColor" outlined label="Cor da armadilha" class="col-12 col-md-3">
              <template v-slot:append>
                <q-icon name="mdi-palette" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-color v-model="ponto.markerColor" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-model.trim="ponto.markerIconUrl" outlined label="URL da imagem da armadilha" class="col-12 col-md-5" />
            <q-select
              v-model="ponto.markerType"
              :options="[
                { label: 'Cor', value: 'color' },
                { label: 'Imagem', value: 'icon' }
              ]"
              emit-value
              map-options
              outlined
              label="Visual no mapa"
              class="col-12 col-md-4"
            />
            <q-input v-model.trim="ponto.notes" outlined label="Observacoes" class="col-12" />
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
  AlterarAcaoArmadilha,
  AlterarSituacaoArmadilha,
  AlterarTipoArmadilha,
  CriarAcaoArmadilha,
  CriarInspecaoArmadilha,
  CriarPlantaCliente,
  CriarPontosMonitoramento,
  CriarSituacaoArmadilha,
  CriarTipoArmadilha,
  ExcluirPontoMonitoramento,
  ExcluirPosicaoPontoMonitoramento,
  ExcluirTipoArmadilha,
  ListarAcoesArmadilha,
  ListarInspecoesArmadilha,
  ListarPlantasCliente,
  ListarPontosMonitoramento,
  ListarSituacoesArmadilha,
  ListarTiposArmadilha,
  PosicionarPontoMonitoramento
} from 'src/service/monitoramento'
import { ListarPragasServico } from 'src/service/ordensServico'
import FloorPlanTrapMap from 'src/components/monitoramento/FloorPlanTrapMap.vue'

const hoje = () => new Date().toISOString().slice(0, 10)

const tipoVazio = () => ({
  name: '',
  code: '',
  acronym: '',
  type: 'monitoramento',
  description: '',
  pestIds: [],
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
  markerColor: '#2563eb',
  markerIconUrl: '',
  markerType: 'color',
  notes: ''
})

export default {
  name: 'MonitoramentoIndex',
  components: { FloorPlanTrapMap },
  data () {
    return {
      tab: 'pontos',
      loading: false,
      saving: false,
      tipos: [],
      pontos: [],
      plantas: [],
      clientes: [],
      pragas: [],
      condicoes: [],
      acoes: [],
      inspecoes: [],
      mapa: { clientId: null, addressId: null, floorPlanId: null, pointId: null, markerMode: 'color' },
      planta: { name: '', clientId: null, addressId: null, file: null, notes: '' },
      inspecao: { monitoringPointId: null, inspectionDate: '', conditionIds: [], actionIds: [], notes: '' },
      catalogo: { type: 'condition', name: '', active: true },
      filtros: { clientId: null },
      tipo: tipoVazio(),
      ponto: pontoVazio(),
      movimento: {},
      modalTipo: false,
      modalPontos: false,
      modalPlanta: false,
      modalMovimentacao: false,
      modalCatalogo: false,
      colunasTipos: [
        { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
        { name: 'code', label: 'Sigla', field: row => row.acronym || row.code, align: 'left' },
        { name: 'pests', label: 'Pragas', field: 'pests', align: 'left' },
        { name: 'active', label: 'Status', field: 'active', align: 'left' },
        { name: 'actions', label: 'Acoes', field: 'actions', align: 'right' }
      ],
      colunasCatalogo: [
        { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
        { name: 'active', label: 'Status', field: 'active', align: 'left' },
        { name: 'actions', label: 'Ações', field: 'actions', align: 'right' }
      ],
      colunasInspecoes: [
        { name: 'inspectionDate', label: 'Data', field: row => this.formatarData(row.inspectionDate), align: 'left' },
        { name: 'monitoringPoint', label: 'Armadilha', field: 'monitoringPoint', align: 'left' },
        { name: 'technician', label: 'Técnico', field: row => row.technician?.name || '-', align: 'left' },
        { name: 'conditions', label: 'Situações', field: 'conditions', align: 'left' },
        { name: 'actions', label: 'Ações', field: 'actions', align: 'left' },
        { name: 'notes', label: 'Observações', field: 'notes', align: 'left' }
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
      return !!(this.tipo.name && this.tipo.code)
    },
    inspecaoValida () {
      return Boolean(
        this.inspecao.monitoringPointId &&
        (this.inspecao.conditionIds.length || this.inspecao.actionIds.length || this.inspecao.notes)
      )
    },
    pontoValido () {
      return !!(
        this.ponto.clientId &&
        this.ponto.addressId &&
        this.ponto.areaId &&
        this.ponto.sectorId &&
        this.ponto.trapTypeId &&
        this.ponto.initialNumber &&
        this.ponto.finalNumber >= this.ponto.initialNumber &&
        (this.ponto.markerType !== 'icon' || this.ponto.markerIconUrl)
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
    opcoesPragas () {
      return this.pragas.map(praga => ({ label: `${praga.commonName} — ${praga.scientificName}`, value: praga.id }))
    },
    opcoesCondicoes () {
      return this.condicoes.filter(item => item.active).map(item => ({ label: item.name, value: item.id }))
    },
    opcoesAcoes () {
      return this.acoes.filter(item => item.active).map(item => ({ label: item.name, value: item.id }))
    },
    opcoesPontosInspecao () {
      return this.pontos.map(ponto => ({
        label: `${ponto.label} - ${ponto.trapType?.name || 'Tipo'} - ${ponto.sector?.name || 'Setor'}`,
        value: ponto.id
      }))
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
        const [tipos, clientes, pragas, condicoes, acoes, inspecoes] = await Promise.all([
          ListarTiposArmadilha(),
          ListarClientes(),
          ListarPragasServico(),
          ListarSituacoesArmadilha(),
          ListarAcoesArmadilha(),
          ListarInspecoesArmadilha()
        ])
        this.tipos = tipos.data
        this.clientes = clientes.data
        this.pragas = pragas.data
        this.condicoes = condicoes.data
        this.acoes = acoes.data
        this.inspecoes = inspecoes.data
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
    async carregarInspecoes () {
      const { data } = await ListarInspecoesArmadilha()
      this.inspecoes = data
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
    async salvarPosicaoMapa ({ pointId, coords }) {
      if (!this.mapa.floorPlanId || !pointId) return
      await PosicionarPontoMonitoramento(pointId, {
        floorPlanId: this.mapa.floorPlanId,
        positionX: Number(coords.x.toFixed(4)),
        positionY: Number(coords.y.toFixed(4))
      })
      await this.carregarPontos()
    },
    async removerPosicaoMapa (point) {
      if (!point) return
      await ExcluirPosicaoPontoMonitoramento(point.id, { notes: 'Removido da planta baixa' })
      await this.carregarPontos()
    },
    abrirTipo (tipo = null) {
      const pestIds = tipo ? (tipo.trapTypePests || []).map(item => item.pestId) : []
      this.tipo = tipo ? { ...tipo, code: tipo.acronym || tipo.code, pestIds } : tipoVazio()
      this.modalTipo = true
    },
    async salvarTipo () {
      this.saving = true
      try {
        const action = this.tipo.id ? AlterarTipoArmadilha : CriarTipoArmadilha
        await action({ ...this.tipo, acronym: this.tipo.code })
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
    abrirCatalogo (type, item = null) {
      this.catalogo = item ? { ...item, type } : { type, name: '', active: true }
      this.modalCatalogo = true
    },
    async salvarCatalogo () {
      this.saving = true
      try {
        const action = this.catalogo.type === 'condition'
          ? (this.catalogo.id ? AlterarSituacaoArmadilha : CriarSituacaoArmadilha)
          : (this.catalogo.id ? AlterarAcaoArmadilha : CriarAcaoArmadilha)
        await action(this.catalogo)
        this.modalCatalogo = false
        this.$q.notify({ type: 'positive', message: 'Cadastro salvo.' })
        await this.carregarTudo()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o cadastro.', error)
      } finally {
        this.saving = false
      }
    },
    abrirInspecao (ponto) {
      this.inspecao = {
        monitoringPointId: ponto.id,
        inspectionDate: new Date().toISOString().slice(0, 16),
        conditionIds: [],
        actionIds: [],
        notes: ''
      }
      this.tab = 'inspecao'
    },
    async salvarInspecao () {
      this.saving = true
      try {
        await CriarInspecaoArmadilha(this.inspecao)
        this.$q.notify({ type: 'positive', message: 'Inspeção registrada.' })
        this.inspecao = { monitoringPointId: null, inspectionDate: '', conditionIds: [], actionIds: [], notes: '' }
        await Promise.all([this.carregarPontos(), this.carregarInspecoes()])
      } catch (error) {
        this.$notificarErro('Não foi possível registrar a inspeção.', error)
      } finally {
        this.saving = false
      }
    },
    pragasTipo (tipo) {
      return (tipo.trapTypePests || [])
        .map(item => item.pest?.scientificName || item.pest?.commonName)
        .filter(Boolean)
        .join(', ') || '-'
    },
    formatarData (value) {
      return value ? new Date(value).toLocaleString('pt-BR') : '-'
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

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.inspection-mobile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 980px;
}

.inspection-mobile .q-textarea,
.inspection-mobile .q-btn {
  grid-column: 1 / -1;
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
  grid-template-columns: repeat(4, minmax(160px, 1fr)) auto;
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

  .catalog-grid,
  .inspection-mobile {
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
