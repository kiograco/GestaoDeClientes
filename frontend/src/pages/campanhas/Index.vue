<template>
  <div class="app-page campanhas-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Campanhas</h1>
        <div class="app-page-subtitle">Monitore disparos, contatos, entregas e leitura das campanhas.</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          flat
          class="app-icon-btn"
          icon="refresh"
          @click="listarCampanhas"
        >
          <q-tooltip>Atualizar listagem</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          icon="mdi-plus"
          label="Nova campanha"
          @click="campanhaEdicao = {}; modalCampanha = true"
        />
      </div>
    </div>

    <section class="campanhas-kpis q-mb-md">
      <q-card flat bordered class="app-card campanhas-kpi-card">
        <div class="app-kpi-label">Total</div>
        <div class="app-kpi-value">{{ campanhas.length }}</div>
        <div class="app-kpi-context">campanhas cadastradas</div>
      </q-card>
      <q-card flat bordered class="app-card campanhas-kpi-card">
        <div class="app-kpi-label">Programadas</div>
        <div class="app-kpi-value">{{ campanhasPorStatus.scheduled }}</div>
        <div class="app-kpi-context">aguardando envio</div>
      </q-card>
      <q-card flat bordered class="app-card campanhas-kpi-card">
        <div class="app-kpi-label">Processando</div>
        <div class="app-kpi-value">{{ campanhasPorStatus.processing }}</div>
        <div class="app-kpi-context">em andamento</div>
      </q-card>
      <q-card flat bordered class="app-card campanhas-kpi-card">
        <div class="app-kpi-label">Leitura</div>
        <div class="app-kpi-value">{{ taxaLeitura }}%</div>
        <div class="app-kpi-context">mensagens lidas sobre recebidas</div>
      </q-card>
    </section>

    <q-table
      flat
      hide-bottom
      class="app-card my-sticky-dynamic"
      :rows="campanhas"
      :columns="columns"
      :loading="loading"
      row-key="id"
      v-model:pagination="pagination"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top>
        <div>
          <div class="app-chart-title">Lista de campanhas</div>
          <div class="app-chart-subtitle">Acompanhe status, contatos e resultados operacionais</div>
        </div>
        <q-space />
      </template>
      <template v-slot:body-cell-status="props">
        <q-td class="text-center">
          <q-badge :color="statusColor(props.row.status)">
            {{ status[props.row.status] || props.row.status }}
          </q-badge>
        </q-td>
      </template>
      <template v-slot:body-cell-color="props">
        <q-td class="text-center">
          <div
            class="q-pa-sm rounded-borders"
            :style="`background: ${props.row.color}`"
          >
            {{ props.row.color }}
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-isActive="props">
        <q-td class="text-center">
          <q-icon
            size="24px"
            :name="props.value ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
            :color="props.value ? 'positive' : 'negative'"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-acoes="props">
        <q-td class="text-center">
          <q-btn
            flat
            round
            icon="mdi-account-details-outline"
            @click="contatosCampanha(props.row)"
          >
            <q-tooltip>
              Lista de Contatos da Campanha
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            v-if="['pending', 'canceled'].includes(props.row.status)"
            icon="mdi-calendar-clock"
            @click="iniciarCampanha(props.row)"
          >
            <q-tooltip>
              Programar Envio
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            v-if="['scheduled', 'processing'].includes(props.row.status)"
            icon="mdi-close-box-multiple"
            @click="cancelarCampanha(props.row)"
          >
            <q-tooltip>
              Cancelar Campanha
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="edit"
            @click="editarCampanha(props.row)"
          >
            <q-tooltip>
              Editar Campanha
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="mdi-delete"
            @click="deletarCampanha(props.row)"
          >
            <q-tooltip>
              Excluir Campanha
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
    <ModalCampanha
      v-if="modalCampanha"
      v-model:modalCampanha="modalCampanha"
      v-model:campanhaEdicao="campanhaEdicao"
      @modal-campanha:criada="campanhaCriada"
      @modal-campanha:editada="campanhaEditada"
    />
  </div>
</template>

<script>
import { CancelarCampanha, DeletarCampanha, IniciarCampanha, ListarCampanhas } from 'src/service/campanhas'
import ModalCampanha from './ModalCampanha'
import { format, parseISO, startOfDay } from 'date-fns'

export default {
  name: 'CampanhasIndex',
  components: {
    ModalCampanha
  },
  data () {
    return {
      campanhaEdicao: {},
      modalCampanha: false,
      campanhas: [],
      pagination: {
        rowsPerPage: 40,
        rowsNumber: 0,
        lastIndex: 0
      },
      loading: false,
      columns: [
        { name: 'id', label: '#', field: 'id', align: 'left' },
        { name: 'name', label: 'Campanha', field: 'name', align: 'left' },
        { name: 'start', label: 'Início', field: 'start', align: 'center', format: (v) => format(parseISO(v), 'dd/MM/yyyy HH:mm') },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center',
          format: (v) => v ? this.status[v] : ''
        },
        { name: 'contactsCount', label: 'Qtd. Contatos', field: 'contactsCount', align: 'center' },
        { name: 'pendentesEnvio', label: 'À Enviar', field: 'pendentesEnvio', align: 'center' },
        { name: 'pendentesEntrega', label: 'À Entregar', field: 'pendentesEntrega', align: 'center' },
        { name: 'recebidas', label: 'Recebidas', field: 'recebidas', align: 'center' },
        { name: 'lidas', label: 'Lidas', field: 'lidas', align: 'center' },
        { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' }
      ],
      status: {
        pending: 'Pendente',
        scheduled: 'Programada',
        processing: 'Processando',
        canceled: 'Cancelada',
        finished: 'Finalizada'
      }
    }
  },
  computed: {
    campanhasPorStatus () {
      return this.campanhas.reduce((acc, campanha) => {
        acc[campanha.status] = (acc[campanha.status] || 0) + 1
        return acc
      }, { pending: 0, scheduled: 0, processing: 0, canceled: 0, finished: 0 })
    },
    taxaLeitura () {
      const recebidas = this.campanhas.reduce((acc, campanha) => acc + Number(campanha.recebidas || 0), 0)
      const lidas = this.campanhas.reduce((acc, campanha) => acc + Number(campanha.lidas || 0), 0)
      if (!recebidas) return 0
      return Math.round((lidas / recebidas) * 100)
    }
  },
  methods: {
    async listarCampanhas () {
      const { data } = await ListarCampanhas()
      this.campanhas = data
    },
    isValidDate (v) {
      return startOfDay(new Date(parseISO(v))).getTime() >= startOfDay(new Date()).getTime()
    },
    statusColor (status) {
      return {
        pending: 'grey',
        scheduled: 'primary',
        processing: 'warning',
        canceled: 'negative',
        finished: 'positive'
      }[status] || 'grey'
    },
    campanhaCriada (campanha) {
      this.listarCampanhas()
    },
    campanhaEditada (campanha) {
      this.listarCampanhas()
    },
    editarCampanha (campanha) {
      if (campanha.status !== 'pending' && campanha.status !== 'canceled') {
        this.$notificarErro('Só é permitido editar campanhas que estejam pendentes ou canceladas.')
      }
      this.campanhaEdicao = {
        ...campanha,
        start: campanha.start, // format(parseISO(campanha.start), 'yyyy-MM-dd'),
        end: campanha.start // format(parseISO(campanha.start), 'yyyy-MM-dd')
      }
      this.modalCampanha = true
    },
    deletarCampanha (campanha) {
      if (campanha.status !== 'pending' && campanha.status !== 'canceled' && campanha.contactsCount) {
        this.$notificarErro('Só é permitido deletar campanhas que estejam pendentes ou canceladas e não possuam contatos vinculados.')
      }
      this.$q.dialog({
        title: 'Atenção!!',
        message: `Deseja realmente deletar a Campanha "${campanha.tag}"?`,
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(() => {
        this.loading = true
        DeletarCampanha(campanha)
          .then(res => {
            let newCampanhas = [...this.campanhas]
            newCampanhas = newCampanhas.filter(f => f.id !== campanha.id)
            this.campanhas = [...newCampanhas]
            this.$notificarSucesso(`Campanha ${campanha.tag} deletada!`)
          })
        this.loading = false
      })
    },
    contatosCampanha (campanha) {
      this.$router.push({
        name: 'contatos-campanha',
        params: {
          campanhaId: campanha.id,
          campanha
        }
      })
    },
    cancelarCampanha (campanha) {
      this.$q.dialog({
        title: 'Atenção!!',
        message: `Deseja realmente deletar a Campanha "${campanha.name}"?`,
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(() => {
        CancelarCampanha(campanha.id)
          .then(res => {
            this.$notificarSucesso('Campanha cancelada.')
            this.listarCampanhas()
          }).catch(err => {
            this.$notificarErro('Não foi possível cancelar a campanha.', err)
          })
      })
    },
    iniciarCampanha (campanha) {
      if (!this.isValidDate(campanha.start)) {
        this.$notificarErro('Não é possível programar campanha com data menor que a atual')
      }

      if (campanha.contactsCount === 0) {
        this.$notificarErro('Necessário ter contatos vinculados para programar a campanha.')
      }

      if (campanha.status !== 'pending' && campanha.status !== 'canceled') {
        this.$notificarErro('Só é permitido programar campanhas que estejam pendentes ou canceladas.')
      }

      IniciarCampanha(campanha.id).then(res => {
        this.$notificarSucesso('Campanha iniciada.')
        this.listarCampanhas()
      }).catch(err => {
        this.$notificarErro('Não foi possível iniciar a campanha.', err)
      })
    }
  },
  mounted () {
    this.listarCampanhas()
  }
}

</script>

<style lang="scss" scoped>
.campanhas-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 16px;
}

.campanhas-kpi-card {
  padding: 18px;
}

@media (max-width: 900px) {
  .campanhas-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .campanhas-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
