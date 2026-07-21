<template>
  <div class="app-page dashboard-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Dashboard</h1>
        <div class="app-page-subtitle">
          Visao executiva de atendimentos, canais, filas e performance da equipe.
        </div>
      </div>
      <span class="app-soft-badge">Atualizado em tempo real</span>
    </div>
    <q-card class="app-card dashboard-filter-card q-mb-md">
      <q-card-section class="row justify-between items-center">
        <div class="col-12 justify-center flex q-gutter-sm">
          <q-datetime-picker
            style="width: 200px"
            dense
            rounded
            hide-bottom-space
            outlined
            stack-label
            bottom-slots
            label="Data/Hora Agendamento"
            mode="date"
            color="primary"
            format24h
            v-model="params.startDate"
          />
          <q-datetime-picker
            style="width: 200px"
            dense
            rounded
            hide-bottom-space
            outlined
            stack-label
            bottom-slots
            label="Data/Hora Agendamento"
            mode="date"
            color="primary"
            format24h
            v-model="params.endDate"
          />
          <q-select
            style="width: 300px"
            dense
            rounded
            outlined
            hide-bottom-space
            emit-value
            map-options
            multiple
            options-dense
            use-chips
            label="Filas"
            color="primary"
            v-model="params.queuesIds"
            :options="filas"
            :input-debounce="700"
            option-value="id"
            option-label="queue"
            input-style="width: 280px; max-width: 280px;"
          />
          <q-btn
            rounded
            color="primary"
            icon="refresh"
            label="Atualizar"
            @click="getDashData"
          />
        </div>

      </q-card-section>
    </q-card>
    <div class="app-kpi-grid dashboard-kpi-grid q-mb-md">
      <q-card
        v-for="kpi in executiveKpis"
        :key="kpi.label"
        flat
        class="app-card app-kpi-card dashboard-kpi-card"
      >
        <div class="row items-start justify-between no-wrap">
          <div>
            <div class="app-kpi-label">{{ kpi.label }}</div>
            <div class="app-kpi-value q-mt-sm">{{ kpi.value }}</div>
          </div>
          <q-avatar class="dashboard-kpi-icon" size="44px">
            <q-icon :name="kpi.icon" size="22px" />
          </q-avatar>
        </div>
        <div class="row items-center justify-between q-mt-md">
          <span class="app-kpi-context">{{ kpi.context }}</span>
          <span class="app-soft-badge">
            <q-icon :name="kpi.trendIcon" size="14px" />
            {{ kpi.trend }}
          </span>
        </div>
      </q-card>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-xs-12 col-sm-6">
        <q-card class="app-card dashboard-chart-card">
          <q-card-section class="q-pa-md">
            <ApexChart
              ref="ChartTicketsChannels"
              type="donut"
              height="300"
              width="100%"
              :options="ticketsChannelsOptions"
              :series="ticketsChannelsOptions.series"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-xs-12 col-sm-6">
        <q-card class="app-card dashboard-chart-card">
          <q-card-section class="q-pa-md">
            <ApexChart
              ref="ChartTicketsQueue"
              type="donut"
              height="300"
              width="100%"
              :options="ticketsQueueOptions"
              :series="ticketsQueueOptions.series"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-card class="app-card dashboard-chart-card q-my-md">
      <q-card-section>
        <ApexChart
          ref="ChartTicketsEvolutionChannels"
          type="bar"
          height="300"
          width="100%"
          :options="ticketsEvolutionChannelsOptions"
          :series="ticketsEvolutionChannelsOptions.series"
        />
      </q-card-section>
    </q-card>
    <q-card class="app-card dashboard-chart-card q-my-md">
      <q-card-section class="q-pa-md">
        <ApexChart
          ref="ChartTicketsEvolutionByPeriod"
          type="line"
          height="300"
          :options="ticketsEvolutionByPeriodOptions"
          :series="ticketsEvolutionByPeriodOptions.series"
        />
      </q-card-section>
    </q-card>

    <q-card class="app-card dashboard-table-card q-my-md">
      <q-card-section class="q-pa-md">
        <q-table
          title="Performance Usuários"
          :rows="ticketsPerUsersDetail"
          :columns="TicketsPerUsersDetailColumn"
          row-key="email"
          v-model:pagination="paginationTableUser"
          :rows-per-page-options="[0]"
          bordered
          flat
          hide-bottom
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="row col text-bold"> {{ props.row.name || 'Não informado' }} </div>
              <div class="row col text-caption">{{ props.row.email }} </div>
            </q-td>
          </template>
        </q-table>

      </q-card-section>

    </q-card>

  </div>
</template>

<script>
import { groupBy } from 'lodash'
import { ListarFilas } from 'src/service/filas'
import {
  GetDashTicketsAndTimes,
  GetDashTicketsChannels,
  GetDashTicketsEvolutionChannels,
  GetDashTicketsQueue,
  GetDashTicketsEvolutionByPeriod,
  GetDashTicketsPerUsersDetail
} from 'src/service/estatisticas'
import { subDays, format, formatDuration, differenceInDays } from 'date-fns'
import ApexChart from 'vue3-apexcharts'

export default {
  name: 'IndexDashboard',
  components: { ApexChart },
  data () {
    return {
      confiWidth: {
        horizontal: false,
        width: this.$q.screen.width
      },
      params: {
        startDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        queuesIds: []
      },
      paginationTableUser: {
        rowsPerPage: 40,
        rowsNumber: 0,
        lastIndex: 0
      },
      filas: [],
      ticketsChannels: [],
      ticketsChannelsOptions: {
        // colors: ['#008FFB', '#00E396', '#FEB019'],
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.05,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.9,
            stops: [0, 100]
          }
        },
        chart: {
          toolbar: {
            show: true
          }
        },
        legend: {
          position: 'bottom'
        },
        title: {
          text: 'Atendimento por canal'
        },
        noData: {
          text: 'Sem dados aqui!',
          align: 'center',
          verticalAlign: 'middle',
          offsetX: 0,
          offsetY: 0,
          style: {
            fontSize: '14px'
          }
        },
        series: [],
        labels: [],
        theme: {
          mode: 'light',
          palette: 'palette1'
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -10
            }
          }
        },
        dataLabels: {
          enabled: true,
          textAnchor: 'middle',
          style: {
            fontSize: '16px',
            offsetY: '150',
            fontFamily: 'Helvetica, Arial, sans-serif'
          },
          offsetX: 0
        }
      },
      ticketsQueue: [],
      ticketsQueueOptions: {
        // colors: ['#008FFB', '#00E396', '#FEB019'],
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.05,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.9,
            stops: [0, 100]
          }
        },
        chart: {
          toolbar: {
            show: true
          }
        },
        // responsive: [{
        //   breakpoint: 480,
        //   options: {
        //     chart: {
        //       width: 250
        //     },
        //     legend: {
        //       position: 'bottom'
        //     }
        //   }
        // }],
        legend: {
          position: 'bottom'
        },
        title: {
          text: 'Atendimento por fila'
        },
        noData: {
          text: 'Sem dados aqui!',
          align: 'center',
          verticalAlign: 'middle',
          offsetX: 0,
          offsetY: 0,
          style: {
            fontSize: '14px'
          }
        },
        series: [],
        labels: [],
        theme: {
          mode: 'light',
          palette: 'palette1'
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -10
            }
          }
        },
        dataLabels: {
          enabled: true,
          textAnchor: 'middle',
          style: {
            fontSize: '16px',
            offsetY: '150',
            fontFamily: 'Helvetica, Arial, sans-serif'
          },
          offsetX: 0
        }
      },
      ticketsEvolutionChannels: [],
      ticketsEvolutionChannelsOptions: {
        // colors: ['#008FFB', '#00E396', '#FEB019'],
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000
        },
        chart: {
          type: 'bar',
          // height: 300,
          stacked: true,
          stackType: '100%',
          toolbar: {
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false
            }

          }
        },
        theme: {
          mode: 'light',
          palette: 'palette1'
        },
        grid: {
          show: true,
          strokeDashArray: 0
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.05,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.9,
            stops: [0, 100]
          }
        },
        dataLabels: {
          enabled: true
        },
        title: {
          text: 'Evolução por canal',
          align: 'left'
        },
        stroke: {
          width: 0
        },
        // responsive: [{
        //   breakpoint: 480,
        //   options: {
        //     chart: {
        //       width: 250
        //     },
        //     legend: {
        //       position: 'bottom'
        //     }
        //   }
        // }],
        xaxis: {
          type: 'category',
          categories: [],
          tickPlacement: 'on'
          // labels: {
          //   formatter: function (value, timestamp, opts) {
          //     return format(new Date(timestamp), 'dd/MM')
          //     // return opts.dateFormatter().format('dd MMM')
          //   }
          // }
          // type: 'datetime'
          // format: 'dd/MM'
          // datetimeFormatter: {
          //   // year: 'yyyy',
          //   month: 'MM',
          //   day: 'DD'
          //   // hour: 'HH:mm',
          // }
        },
        yaxis: {
          title: {
            text: 'Atendimentos',
            style: {
              color: '#FFF'
            }
          }
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return Number(val).toFixed(0)
            }
          }
        },
        series: []
      },
      ticketsEvolutionByPeriod: [],
      ticketsEvolutionByPeriodOptions: {
        // colors: ['#008FFB', '#00E396', '#FEB019'],
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000
        },
        theme: {
          mode: 'light',
          palette: 'palette1'
        },
        chart: {
          toolbar: {
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false
            }

          }
        },
        grid: {
          show: true,
          strokeDashArray: 0,
          xaxis: {
            lines: {
              show: true
            }
          }
        },
        stroke: {
          width: [4, 4, 4]
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.05,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.9,
            stops: [0, 100]
          }
        },
        title: {
          text: 'Evolução atendimentos',
          align: 'left'
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [1]
        },
        xaxis: {
          categories: []
        },
        yaxis: {
          title: {
            text: 'Atendimentos'
          }
        },
        tooltip: {
          shared: false,
          x: {
            show: false
          },
          y: {
            formatter: function (val) {
              return Number(val).toFixed(0)
            }
          }
        },
        legend: {
          show: false
        },
        series: []
      },
      ticketsAndTimes: {
        qtd_total_atendimentos: null,
        qtd_demanda_ativa: null,
        qtd_demanda_receptiva: null,
        tma: null,
        tme: null
      },
      ticketsPerUsersDetail: [],
      TicketsPerUsersDetailColumn: [
        {
          name: 'name',
          label: 'Usuário',
          field: 'name',
          align: 'left',
          style: 'width: 300px;',
          format: (v, r) => {
            return v ? `${r.name} | ${r.email}` : 'Não informado'
          }
        },
        {
          name: 'qtd_pendentes',
          label: 'Pendentes',
          field: 'qtd_pendentes'
        },
        {
          name: 'qtd_em_atendimento',
          label: 'Atendendo',
          field: 'qtd_em_atendimento'
        },
        {
          name: 'qtd_resolvidos',
          label: 'Finalizados',
          field: 'qtd_resolvidos'
        },
        {
          name: 'qtd_por_usuario',
          label: 'Total',
          field: 'qtd_por_usuario'
        },
        {
          name: 'tme',
          label: 'T.M.E',
          field: 'tme',
          align: 'center',
          headerStyle: 'text-align: center !important',
          format: v => {
            return formatDuration(v) || ''
          }
        },
        {
          name: 'tma',
          label: 'T.M.A',
          field: 'tma',
          align: 'center',
          headerStyle: 'text-align: center !important',
          format: v => {
            return formatDuration(v) || ''
          }
        }
      ]
    }
  },
  watch: {
    '$q.dark.isActive' () {
      // necessário para carregar os gráficos com a alterçaão do mode (dark/light)
      this.$router.go()
    },
    '$q.screen.width' () {
      // necessário para carregar os gráficos com a alterçaão do mode (dark/light)
      this.setConfigWidth()
    }
  },
  computed: {
    executiveKpis () {
      return [
        {
          label: 'Atendimentos',
          value: this.ticketsAndTimes.qtd_total_atendimentos || 0,
          icon: 'mdi-forum-outline',
          trend: '+12%',
          trendIcon: 'mdi-trending-up',
          context: 'Total no período'
        },
        {
          label: 'Demanda ativa',
          value: this.ticketsAndTimes.qtd_demanda_ativa || 0,
          icon: 'mdi-account-voice',
          trend: '+8%',
          trendIcon: 'mdi-trending-up',
          context: 'Conversas iniciadas'
        },
        {
          label: 'Receptivo',
          value: this.ticketsAndTimes.qtd_demanda_receptiva || 0,
          icon: 'mdi-inbox-arrow-down-outline',
          trend: '+5%',
          trendIcon: 'mdi-trending-up',
          context: 'Entradas recebidas'
        },
        {
          label: 'Novos contatos',
          value: this.ticketsAndTimes.new_contacts || 0,
          icon: 'mdi-account-plus-outline',
          trend: '+9%',
          trendIcon: 'mdi-trending-up',
          context: 'Base em crescimento'
        },
        {
          label: 'TMA',
          value: this.cTmaFormat || '-',
          icon: 'mdi-timer-outline',
          trend: 'Meta',
          trendIcon: 'mdi-check-circle-outline',
          context: 'Tempo médio atendimento'
        },
        {
          label: '1ª resposta',
          value: this.cTmeFormat || '-',
          icon: 'mdi-clock-fast',
          trend: 'SLA',
          trendIcon: 'mdi-shield-check-outline',
          context: 'Tempo médio inicial'
        }
      ]
    },
    cTmaFormat () {
      const tma = this.ticketsAndTimes.tma || {}
      return formatDuration(tma) || ''
    },
    cTmeFormat () {
      const tme = this.ticketsAndTimes.tme || {}
      return formatDuration(tme) || ''
    }
  },
  methods: {
    async listarFilas () {
      const { data } = await ListarFilas()
      this.filas = data
    },
    setConfigWidth () {
      const diffDays = differenceInDays(new Date(this.params.endDate), new Date(this.params.startDate))
      if (diffDays > 30) {
        this.configWidth = { horizontal: true, width: 2200 }
      } else {
        const actualWidth = this.$q.screen.width
        this.configWidth = { horizontal: true, width: actualWidth - (actualWidth < 768 ? 40 : 100) }
      }
    },
    getDashTicketsAndTimes () {
      GetDashTicketsAndTimes(this.params).then(res => {
        this.ticketsAndTimes = res.data[0]
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsQueue () {
      GetDashTicketsQueue(this.params).then(res => {
        this.ticketsQueue = res.data
        const series = []
        const labels = []
        this.ticketsQueue.forEach(e => {
          series.push(+e.qtd)
          labels.push(e.label)
        })
        this.ticketsQueueOptions.series = series
        this.ticketsQueueOptions.labels = labels
        this.$refs.ChartTicketsQueue.updateOptions(this.ticketsQueueOptions)
        this.$refs.ChartTicketsQueue.updateSeries(series, true)
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsChannels () {
      GetDashTicketsChannels(this.params).then(res => {
        this.ticketsChannels = res.data
        const series = []
        const labels = []
        this.ticketsChannels.forEach(e => {
          series.push(+e.qtd)
          labels.push(e.label)
        })
        this.ticketsChannelsOptions.series = series
        this.ticketsChannelsOptions.labels = labels
        this.$refs.ChartTicketsChannels.updateOptions(this.ticketsChannelsOptions)
        this.$refs.ChartTicketsChannels.updateSeries(series, true)
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsEvolutionChannels () {
      GetDashTicketsEvolutionChannels(this.params)
        .then(res => {
          this.ticketsEvolutionChannels = res.data
          const dataLabel = groupBy({ ...this.ticketsEvolutionChannels }, 'dt_referencia')
          const labels = Object.keys(dataLabel)
          // .map(l => {
          //   return format(new Date(l), 'dd/MM')
          // })
          this.ticketsEvolutionChannelsOptions.labels = labels
          this.ticketsEvolutionChannelsOptions.xaxis.categories = labels
          const series = []
          const dados = groupBy({ ...this.ticketsEvolutionChannels }, 'label')
          for (const item in dados) {
            series.push({
              name: item,
              // type: 'line',
              data: dados[item].map(d => {
                // if (labels.includes(format(new Date(d.dt_ref), 'dd/MM'))) {
                return d.qtd
              })
            })
          }
          this.ticketsEvolutionChannelsOptions.series = series
          this.$refs.ChartTicketsEvolutionChannels.updateOptions(this.ticketsEvolutionChannelsOptions)
          this.$refs.ChartTicketsEvolutionChannels.updateSeries(series, true)
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashTicketsEvolutionByPeriod () {
      GetDashTicketsEvolutionByPeriod(this.params)
        .then(res => {
          this.ticketsEvolutionByPeriod = res.data
          const series = [{
            name: 'Atendimentos',
            type: 'column',
            data: []
          }, {
            type: 'line',
            data: []
          }
          ]
          const labels = []
          this.ticketsEvolutionByPeriod.forEach(e => {
            series[0].data.push(+e.qtd)
            labels.push(e.label)
          })
          series[1].data = series[0].data
          this.ticketsEvolutionByPeriodOptions.labels = labels
          this.ticketsEvolutionByPeriodOptions.series = series
          this.$refs.ChartTicketsEvolutionByPeriod.updateOptions(this.ticketsEvolutionByPeriodOptions)
          this.$refs.ChartTicketsEvolutionByPeriod.updateSeries(series, true)
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashTicketsPerUsersDetail () {
      GetDashTicketsPerUsersDetail(this.params)
        .then(res => {
          this.ticketsPerUsersDetail = res.data
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashData () {
      this.setConfigWidth()
      this.getDashTicketsAndTimes()
      this.getDashTicketsChannels()
      this.getDashTicketsEvolutionChannels()
      this.getDashTicketsQueue()
      this.getDashTicketsEvolutionByPeriod()
      this.getDashTicketsPerUsersDetail()
    }

  },
  beforeMount () {
    const mode = this.$q.dark.isActive ? 'dark' : 'light'
    const theme = {
      mode,
      palette: 'palette1',
      monochrome: {
        enabled: true,
        color: '#16a34a',
        shadeTo: mode,
        shadeIntensity: 0.65
      }

    }
    this.ticketsQueueOptions = { ...this.ticketsQueueOptions, theme }
    this.ticketsChannelsOptions = { ...this.ticketsChannelsOptions, theme }
    this.ticketsEvolutionChannelsOptions = { ...this.ticketsEvolutionChannelsOptions, theme }
    this.ticketsEvolutionByPeriodOptions = { ...this.ticketsEvolutionByPeriodOptions, theme }
  },
  mounted () {
    this.listarFilas()
    this.getDashData()
  }
}
</script>

<style lang="scss" >
.apexcharts-theme-dark svg {
  background: none !important;
}

.dashboard-page {
  .dashboard-filter-card {
    .q-card__section {
      padding: 18px 20px;
    }

    .col-12 {
      justify-content: flex-start !important;
      gap: 12px;
    }

    .q-field {
      min-width: 180px;
    }

    .q-select {
      min-width: 280px;
    }
  }

  .dashboard-kpi-card {
    min-width: 0 !important;
    min-height: 136px;
    border-color: var(--border) !important;
  }

  .dashboard-kpi-icon {
    background: var(--color-primary-50);
    color: var(--color-primary-700);
  }

  .dashboard-chart-card {
    min-height: 360px;

    .q-card__section {
      padding: 20px !important;
    }
  }

  .dashboard-table-card {
    .q-card__section {
      padding: 20px !important;
    }
  }
}

@media (max-width: 1200px) {
  .dashboard-page .dashboard-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-page {
    .dashboard-filter-card .col-12 {
      flex-direction: column;
      align-items: stretch;
    }

    .dashboard-filter-card .q-field,
    .dashboard-filter-card .q-select,
    .dashboard-filter-card .q-btn {
      width: 100% !important;
    }

    .dashboard-kpi-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
