<template>
  <div>
    <div class="floor-plan-actions">
      <q-btn-toggle
        v-model="localMarkerMode"
        dense
        unelevated
        toggle-color="primary"
        :options="[
          { label: 'Cores', value: 'color' },
          { label: 'Icones', value: 'icon' }
        ]"
        @input="$emit('marker-mode', localMarkerMode)"
      />
      <q-btn flat round icon="mdi-magnify-plus-outline" @click="zoom = Math.min(zoom + 0.1, 2.5)">
        <q-tooltip>Aumentar zoom</q-tooltip>
      </q-btn>
      <q-btn flat round icon="mdi-magnify-minus-outline" @click="zoom = Math.max(zoom - 0.1, 0.5)">
        <q-tooltip>Diminuir zoom</q-tooltip>
      </q-btn>
      <q-btn flat round icon="mdi-fit-to-page-outline" @click="resetMap">
        <q-tooltip>Ajustar mapa</q-tooltip>
      </q-btn>
      <q-btn flat round icon="mdi-fullscreen" @click="fullscreen = !fullscreen">
        <q-tooltip>Tela cheia</q-tooltip>
      </q-btn>
    </div>

    <div
      :class="['floor-plan-shell', { 'floor-plan-shell--fullscreen': fullscreen }]"
      @dragover.prevent
      @drop.prevent="dropSelectedPoint"
    >
      <div
        ref="mapCanvas"
        class="floor-plan-canvas"
        :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
        @click="positionSelectedPoint"
        @mousedown="startPan"
        @mousemove="movePan"
        @mouseup="stopPan"
        @mouseleave="stopPan"
      >
        <iframe
          v-if="floorPlan && floorPlan.fileType === 'application/pdf'"
          class="floor-plan-media"
          :src="fileUrl(floorPlan.fileUrl)"
        />
        <img
          v-else-if="floorPlan"
          class="floor-plan-media"
          :src="fileUrl(floorPlan.fileUrl)"
          alt="Planta baixa"
          draggable="false"
        >
        <div v-else class="floor-plan-empty">Selecione ou envie uma planta baixa.</div>

        <button
          v-for="point in positionedPoints"
          :key="point.id"
          type="button"
          class="floor-plan-marker"
          :style="markerStyle(point)"
          draggable="true"
          @dragstart="draggedPoint = point"
          @dragend="moveMarker"
          @click.stop="openDetails(point)"
        >
          <img
            v-if="showIcon(point)"
            :src="fileUrl(point.markerIconUrl)"
            alt=""
            class="floor-plan-marker__icon"
          >
          <span v-else>{{ point.mapLabel || point.pointNumber }}</span>
          <q-tooltip>
            {{ point.label }} - {{ point.trapType?.name || 'Tipo' }} - {{ point.area?.name || '-' }} / {{ point.sector?.name || '-' }}
          </q-tooltip>
        </button>
      </div>
    </div>

    <div class="floor-plan-draggable">
      <q-chip
        v-for="point in unpositionedPoints"
        :key="point.id"
        draggable="true"
        outline
        color="primary"
        icon="mdi-crosshairs-gps"
        @dragstart.native="draggedPoint = point"
      >
        {{ point.label }}
      </q-chip>
    </div>

    <div class="floor-plan-legend">
      <span><i style="background:#2563eb" /> Porta-isca</span>
      <span><i style="background:#22c55e" /> Adesiva</span>
      <span><i style="background:#f59e0b" /> Luminosa</span>
      <span><i style="background:#ef4444" /> Avariada/Pendente</span>
      <span><i style="background:#6b7280" /> Sem acesso/Extraviada</span>
    </div>

    <q-dialog v-model="detailsOpen">
      <q-card class="floor-plan-dialog">
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ selectedPoint?.label }}</div>
            <div class="text-caption text-grey-7">{{ selectedPoint?.trapType?.name || 'Tipo nao informado' }}</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="detailsOpen = false" />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="selectedPoint" class="floor-plan-details">
          <div><b>Numero:</b> {{ selectedPoint.pointNumber }}</div>
          <div><b>Sigla:</b> {{ selectedPoint.trapType?.acronym || selectedPoint.trapType?.code || '-' }}</div>
          <div><b>Cliente:</b> {{ selectedPoint.client?.legalName || '-' }}</div>
          <div><b>Endereco:</b> {{ selectedPoint.address?.street || selectedPoint.address?.city || '-' }}</div>
          <div><b>Area:</b> {{ selectedPoint.area?.name || '-' }}</div>
          <div><b>Setor:</b> {{ selectedPoint.sector?.name || '-' }}</div>
          <div><b>Situacao:</b> {{ selectedPoint.active ? 'Instalada' : 'Removida' }}</div>
          <div><b>Acoes recentes:</b> {{ latestActions(selectedPoint) }}</div>
          <div><b>Instalacao:</b> {{ formatDate(selectedPoint.installedAt) }}</div>
          <div><b>Ultima inspecao:</b> {{ latestInspectionDate(selectedPoint) }}</div>
          <div class="floor-plan-details__full"><b>Observacoes:</b> {{ selectedPoint.notes || '-' }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="negative" icon="mdi-map-marker-remove-outline" label="Remover do mapa" @click="removeFromMap" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
export default {
  name: 'FloorPlanTrapMap',
  props: {
    floorPlanId: { type: [Number, String], default: null },
    clientId: { type: [Number, String], default: null },
    addressId: { type: [Number, String], default: null },
    floorPlan: { type: Object, default: null },
    monitoringPoints: { type: Array, default: () => [] },
    selectedPointId: { type: [Number, String], default: null },
    markerMode: { type: String, default: 'color' }
  },
  data () {
    return {
      zoom: 1,
      pan: { x: 0, y: 0 },
      panning: false,
      lastPan: null,
      fullscreen: false,
      draggedPoint: null,
      detailsOpen: false,
      selectedPoint: null,
      localMarkerMode: this.markerMode
    }
  },
  computed: {
    addressPoints () {
      return this.monitoringPoints.filter(point => !this.addressId || point.addressId === this.addressId)
    },
    positionedPoints () {
      return this.addressPoints.filter(point => point.floorPlanId === this.floorPlanId && point.isPositioned)
    },
    unpositionedPoints () {
      return this.addressPoints.filter(point => !point.isPositioned)
    }
  },
  watch: {
    markerMode (value) {
      this.localMarkerMode = value
    }
  },
  methods: {
    fileUrl (value) {
      if (!value) return ''
      if (/^https?:\/\//.test(value)) return value
      return `${process.env.VUE_URL_API || ''}${value}`
    },
    coordsFromEvent (event) {
      const rect = this.$refs.mapCanvas.getBoundingClientRect()
      return {
        x: Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 0), 100),
        y: Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 100, 0), 100)
      }
    },
    positionSelectedPoint (event) {
      if (this.panning || !this.floorPlanId || !this.selectedPointId) return
      this.$emit('position', {
        pointId: this.selectedPointId,
        coords: this.coordsFromEvent(event)
      })
    },
    dropSelectedPoint (event) {
      const pointId = this.draggedPoint?.id || this.selectedPointId
      if (!this.floorPlanId || !pointId) return
      this.$emit('position', { pointId, coords: this.coordsFromEvent(event) })
      this.draggedPoint = null
    },
    moveMarker (event) {
      if (!this.draggedPoint || !this.floorPlanId) return
      this.$emit('position', {
        pointId: this.draggedPoint.id,
        coords: this.coordsFromEvent(event)
      })
      this.draggedPoint = null
    },
    startPan (event) {
      if (event.target.closest?.('.floor-plan-marker')) return
      this.panning = true
      this.lastPan = { x: event.clientX, y: event.clientY }
    },
    movePan (event) {
      if (!this.panning || !this.lastPan) return
      this.pan.x += event.clientX - this.lastPan.x
      this.pan.y += event.clientY - this.lastPan.y
      this.lastPan = { x: event.clientX, y: event.clientY }
    },
    stopPan () {
      this.panning = false
      this.lastPan = null
    },
    resetMap () {
      this.zoom = 1
      this.pan = { x: 0, y: 0 }
    },
    defaultMarkerColor (point) {
      const name = (point.trapType?.name || '').toLowerCase()
      if (!point.active) return '#ef4444'
      if (name.includes('luminosa')) return '#f59e0b'
      if (name.includes('cola') || name.includes('adesiva')) return '#22c55e'
      if (name.includes('avariada') || name.includes('pendente')) return '#ef4444'
      if (name.includes('sem acesso') || name.includes('extraviada')) return '#6b7280'
      return '#2563eb'
    },
    markerStyle (point) {
      return {
        left: `${point.positionX}%`,
        top: `${point.positionY}%`,
        background: this.showIcon(point) ? '#fff' : (point.markerColor || this.defaultMarkerColor(point))
      }
    },
    showIcon (point) {
      return this.localMarkerMode === 'icon' && point.markerType === 'icon' && point.markerIconUrl
    },
    openDetails (point) {
      this.selectedPoint = point
      this.$emit('select', point.id)
      this.detailsOpen = true
    },
    removeFromMap () {
      this.$emit('remove-position', this.selectedPoint)
      this.detailsOpen = false
    },
    latestInspection (point) {
      return [...(point.inspections || [])].sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0]
    },
    latestActions (point) {
      const inspection = this.latestInspection(point)
      return (inspection?.actions || []).map(action => action.name).join(', ') || '-'
    },
    latestInspectionDate (point) {
      const inspection = this.latestInspection(point)
      return inspection ? this.formatDate(inspection.inspectionDate) : '-'
    },
    formatDate (value) {
      return value ? new Date(value).toLocaleString('pt-BR') : '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.floor-plan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.floor-plan-shell {
  height: 620px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
  position: relative;
}

.floor-plan-shell--fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 7000;
  height: auto;
  background: var(--surface);
}

.floor-plan-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center center;
  cursor: grab;
}

.floor-plan-canvas:active {
  cursor: grabbing;
}

.floor-plan-media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  border: 0;
  background: #fff;
}

.floor-plan-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.floor-plan-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 32px;
  height: 32px;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  line-height: 26px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(15, 23, 42, .24);
  cursor: move;
  padding: 0 8px;
}

.floor-plan-marker__icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
}

.floor-plan-draggable,
.floor-plan-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.floor-plan-legend {
  color: var(--text-muted);
  font-size: 12px;
}

.floor-plan-legend i {
  width: 10px;
  height: 10px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 6px;
}

.floor-plan-dialog {
  width: 760px;
  max-width: 96vw;
}

.floor-plan-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.floor-plan-details__full {
  grid-column: 1 / -1;
}

@media (max-width: 700px) {
  .floor-plan-shell {
    height: 420px;
  }

  .floor-plan-details {
    grid-template-columns: 1fr;
  }
}
</style>
