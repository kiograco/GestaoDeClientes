<template>
  <q-page padding class="service-orders-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-medium">Ordens de Serviço</div>
        <div class="text-caption text-grey-7">Agenda de visitas, técnicos e histórico operacional</div>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn unelevated color="primary" icon="mdi-package-variant-closed" label="Produto" @click="abrirEstoque()" />
        <q-btn unelevated color="primary" icon="mdi-format-list-bulleted-type" label="Tipo" @click="abrirTipoServico()" />
        <q-btn unelevated color="primary" icon="mdi-account-hard-hat-outline" label="Técnico" @click="abrirAtendente()" />
        <q-btn unelevated color="primary" icon="mdi-calendar-plus" label="Nova ordem" @click="abrirOrdem()" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <q-select dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Técnico" v-model="filtros.attendantId" :options="opcoesAtendentes" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Status" v-model="filtros.status" :options="statusOptions" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Prioridade" v-model="filtros.priority" :options="priorityOptions" @input="carregarOrdens" />
        <q-input dense outlined clearable class="col-12 col-md-3" label="Tipo de serviço" v-model="filtros.serviceType" @keyup.enter="carregarOrdens" />
        <q-btn flat color="primary" icon="mdi-refresh" class="col-12 col-md-auto" label="Atualizar" @click="carregarTudo" />
      </q-card-section>
    </q-card>

    <q-tabs v-model="aba" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md">
      <q-tab name="agenda" icon="mdi-calendar-clock" label="Agenda" />
      <q-tab name="dashboard" icon="mdi-chart-box-outline" label="Dashboard" />
      <q-tab name="estoque" icon="mdi-package-variant-closed" label="Estoque" />
      <q-tab name="tipos" icon="mdi-format-list-bulleted-type" label="Tipos de serviço" />
    </q-tabs>

    <div v-if="aba === 'dashboard'" class="dashboard-grid q-mb-md">
      <q-card v-for="card in dashboardCards" :key="card.label" flat bordered>
        <q-card-section>
          <div class="text-caption text-grey-7">{{ card.label }}</div>
          <div class="text-h5 text-weight-medium">{{ card.value }}</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Por status</div>
          <div v-for="item in dashboardList(dashboard.byStatus)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Técnicos com mais visitas</div>
          <div v-for="item in dashboardList(dashboard.byAttendant)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Serviços mais solicitados</div>
          <div v-for="item in dashboardList(dashboard.byServiceType)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Serviços executados</div>
          <div v-for="item in dashboardList(dashboard.servicesByQuantity)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Produtos mais usados</div>
          <div v-for="item in dashboardList(dashboard.productsByQuantity)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Receita por serviço</div>
          <div v-for="item in dashboardMoneyList(dashboard.servicesByValue)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Receita por produto</div>
          <div v-for="item in dashboardMoneyList(dashboard.productsByValue)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else-if="aba === 'estoque'" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Estoque de produtos</div>
            <div class="text-caption text-grey-7">Itens usados nas ordens de serviço</div>
          </div>
          <q-space />
          <q-toggle v-model="filtrarEstoqueBaixo" label="Somente baixo estoque" class="q-mr-sm" />
          <q-btn v-if="podeGerenciarEstoque" unelevated color="primary" icon="mdi-plus" label="Novo produto" @click="abrirEstoque()" />
        </q-card-section>
        <q-banner v-if="baixoEstoque.length" dense class="bg-orange-1 text-orange-10 q-mx-md q-mb-md">
          <template v-slot:avatar>
            <q-icon name="mdi-alert-outline" color="orange-10" />
          </template>
          {{ baixoEstoque.length }} produto(s) com saldo igual ou abaixo do estoque mínimo.
        </q-banner>
        <q-table
          flat
          :data="estoqueFiltrado"
          :columns="colunasEstoque"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-quantity="props">
            <q-td :props="props">
              <q-badge :color="Number(props.row.quantity) <= Number(props.row.minQuantity) ? 'negative' : 'positive'">
                {{ props.row.quantity }} {{ props.row.unit }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-active="props">
            <q-td :props="props">
              <q-badge :color="props.row.active ? 'positive' : 'grey'" :label="props.row.active ? 'Ativo' : 'Inativo'" />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn v-if="podeGerenciarEstoque" flat round dense icon="mdi-swap-vertical" color="primary" @click="abrirAjusteEstoque(props.row)">
                <q-tooltip>Ajustar estoque</q-tooltip>
              </q-btn>
              <q-btn v-if="podeGerenciarEstoque" flat round dense icon="mdi-pencil" color="primary" @click="abrirEstoque(props.row)">
                <q-tooltip>Editar produto</q-tooltip>
              </q-btn>
              <q-btn v-if="podeGerenciarEstoque" flat round dense icon="mdi-delete" color="negative" @click="confirmarExcluirEstoque(props.row)">
                <q-tooltip>Excluir produto</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Histórico de movimentações</div>
          <div class="text-caption text-grey-7">Últimas baixas automáticas de estoque</div>
        </q-card-section>
        <q-table
          flat
          :data="movimentacoesEstoque"
          :columns="colunasMovimentacoesEstoque"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-quantity="props">
            <q-td :props="props">
              <q-badge :color="Number(props.row.quantity) < 0 ? 'negative' : 'positive'">{{ props.row.quantity }}</q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-serviceOrderId="props">
            <q-td :props="props">
              <span v-if="props.row.serviceOrder">#{{ props.row.serviceOrder.id }} {{ props.row.serviceOrder.title }}</span>
              <span v-else>-</span>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <div v-else-if="aba === 'tipos'" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Tipos de serviço</div>
            <div class="text-caption text-grey-7">Opções usadas no cadastro das ordens</div>
          </div>
          <q-space />
          <q-btn unelevated color="primary" icon="mdi-plus" label="Novo tipo" @click="abrirTipoServico()" />
        </q-card-section>
        <q-table
          flat
          :data="tiposServico"
          :columns="colunasTiposServico"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-active="props">
            <q-td :props="props">
              <q-badge :color="props.row.active ? 'positive' : 'grey'" :label="props.row.active ? 'Ativo' : 'Inativo'" />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirTipoServico(props.row)">
                <q-tooltip>Editar tipo</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-delete" color="negative" @click="confirmarExcluirTipoServico(props.row)">
                <q-tooltip>Excluir tipo</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <div v-else class="agenda-workspace">
      <q-card flat bordered class="agenda-card">
        <q-card-section class="agenda-toolbar">
          <q-tabs v-model="visao" dense active-color="primary" indicator-color="primary" align="left" @input="carregarTudo">
            <q-tab name="dia" icon="mdi-calendar-today" label="Dia" />
            <q-tab name="semana" icon="mdi-calendar-week" label="Semana" />
            <q-tab name="mes" icon="mdi-calendar-month" label="Mês" />
          </q-tabs>
          <q-space />
          <q-btn flat round dense icon="mdi-chevron-left" @click="alterarDataAgenda(-1)">
            <q-tooltip>Dia anterior</q-tooltip>
          </q-btn>
          <q-input dense outlined type="date" class="agenda-date" v-model="dataAgenda" @input="carregarTudo" />
          <q-btn flat round dense icon="mdi-chevron-right" @click="alterarDataAgenda(1)">
            <q-tooltip>Próximo dia</q-tooltip>
          </q-btn>
          <q-btn flat color="primary" icon="mdi-calendar-today" label="Hoje" @click="irParaHoje" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div v-if="visao === 'dia'" class="technician-schedule">
            <div class="schedule-grid schedule-header" :style="gridAgendaStyle">
              <div class="technician-heading">Técnico</div>
              <div v-for="hour in agendaHours" :key="hour" class="hour-heading">{{ hourLabel(hour) }}</div>
            </div>
            <div v-if="!linhasTecnicos.length" class="empty-state">
              <q-icon name="mdi-calendar-blank-outline" size="42px" color="grey-6" />
              <div>Nenhum técnico ativo para exibir na agenda.</div>
            </div>
            <div
              v-for="linha in linhasTecnicos"
              :key="linha.id || 'sem-tecnico'"
              class="schedule-grid schedule-row"
              :style="gridAgendaStyle"
            >
              <div class="technician-name" :style="{ backgroundColor: linha.color }">
                <strong>{{ linha.name }}</strong>
                <span>{{ ordensDaLinha(linha.id).length }} ordem(ns)</span>
              </div>
              <div
                v-for="hour in agendaHours"
                :key="`${linha.id || 'sem'}-${hour}`"
                class="hour-cell"
                role="button"
                :aria-label="`Reservar ${linha.name} ${hourLabel(hour)}`"
                @contextmenu="prepararMenuHorario(linha, hour)"
                @dblclick="reservarHorario(linha, hour)"
                @dragover.prevent
                @drop="soltarOrdem(linha, hour)"
              >
                <q-menu context-menu>
                  <q-list dense style="min-width: 220px">
                    <q-item clickable v-close-popup @click="reservarHorario(linha, hour)">
                      <q-item-section avatar><q-icon name="mdi-calendar-plus" /></q-item-section>
                      <q-item-section>Reservar horário</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="abrirOrdemNoHorario(linha, hour)">
                      <q-item-section avatar><q-icon name="mdi-clipboard-plus-outline" /></q-item-section>
                      <q-item-section>Nova ordem neste horário</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
              <button
                v-for="ordem in ordensDaLinha(linha.id)"
                :key="ordem.occurrenceKey || ordem.id"
                class="schedule-order"
                :aria-label="`#${ordem.id} ${ordem.title}`"
                :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
                :style="estiloOrdemAgenda(ordem)"
                draggable="true"
                @dragstart="arrastarOrdem(ordem)"
                @click="selecionarOrdem(ordem)"
                @contextmenu="prepararMenuOrdem(ordem)"
              >
                <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
                <span>{{ formatarHora(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</span>
                <span>{{ ordem.contact ? ordem.contact.name : 'Sem cliente' }}</span>
                <q-menu
                  anchor="center right"
                  self="center left"
                  :offset="[10, 0]"
                  content-class="order-details-popover"
                  @before-show="selecionarOrdem(ordem)"
                >
                  <div class="order-popover">
                    <div class="row items-start no-wrap q-mb-sm">
                      <div>
                        <div class="text-subtitle2 text-weight-medium">Detalhes da ordem #{{ ordem.id }}</div>
                        <div class="text-caption text-grey-7">{{ ordem.title }}</div>
                      </div>
                      <q-space />
                      <q-badge outline color="primary" :label="ordem.status" />
                    </div>
                    <div class="order-popover-grid">
                      <div><strong>Cliente:</strong> {{ ordem.contact ? ordem.contact.name : 'Sem cliente' }}</div>
                      <div><strong>Técnico:</strong> {{ ordem.attendant ? ordem.attendant.name : 'Sem técnico' }}</div>
                      <div><strong>Horário:</strong> {{ formatarData(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</div>
                      <div><strong>Recorrência:</strong> {{ formatarRecorrencia(ordem) }}</div>
                      <div v-if="ordem.address"><strong>Endereço:</strong> {{ ordem.address }} {{ ordem.city }}/{{ ordem.state }}</div>
                      <div v-if="ordem.description"><strong>Descrição:</strong> {{ ordem.description }}</div>
                      <div v-if="ordem.publicObservation"><strong>Observação cliente:</strong> {{ ordem.publicObservation }}</div>
                      <div v-if="ordem.internalObservation"><strong>Observação interna:</strong> {{ ordem.internalObservation }}</div>
                    </div>
                    <q-separator class="q-my-sm" />
                    <div class="order-popover-actions">
                      <q-btn dense flat color="primary" icon="mdi-pencil" label="Editar" v-close-popup @click="abrirOrdem(ordem)" />
                      <q-btn dense flat color="amber-9" icon="mdi-play" label="Iniciar" v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')" />
                      <q-btn dense flat color="positive" icon="mdi-check" label="Concluir" v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')" />
                      <q-btn dense flat color="negative" icon="mdi-cancel" label="Cancelar" v-close-popup @click="cancelarOrdem(ordem)" />
                      <q-btn dense flat color="primary" icon="mdi-file-pdf-box" label="PDF cliente" v-close-popup @click="abrirPdfOrdem(ordem, false)" />
                      <q-btn v-if="podeVerObservacaoInterna" dense flat color="primary" icon="mdi-file-document-alert-outline" label="PDF interno" v-close-popup @click="abrirPdfOrdem(ordem, true)" />
                      <q-btn dense flat color="primary" icon="mdi-send" label="Notificar" v-close-popup @click="abrirNotificacao(ordem)" />
                    </div>
                    <q-separator class="q-my-sm" />
                    <div class="text-caption text-grey-7 q-mb-xs">Trocar técnico</div>
                    <div class="order-popover-actions">
                      <q-btn
                        v-for="tecnico in atendentes"
                        :key="tecnico.id"
                        dense
                        flat
                        color="primary"
                        icon="mdi-account-hard-hat-outline"
                        :label="tecnico.name"
                        :disable="tecnico.id === ordem.attendantId"
                        v-close-popup
                        @click="moverOrdemParaTecnico(ordem, tecnico)"
                      />
                    </div>
                  </div>
                </q-menu>
                <q-menu context-menu>
                  <q-list dense style="min-width: 260px">
                    <q-item-label header>Ordem #{{ ordem.id }}</q-item-label>
                    <q-item clickable v-close-popup @click="abrirOrdem(ordem)">
                      <q-item-section avatar><q-icon name="mdi-pencil" /></q-item-section>
                      <q-item-section>Editar ordem</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')">
                      <q-item-section avatar><q-icon name="mdi-play" /></q-item-section>
                      <q-item-section>Iniciar atendimento</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')">
                      <q-item-section avatar><q-icon name="mdi-check" /></q-item-section>
                      <q-item-section>Concluir</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="cancelarOrdem(ordem)">
                      <q-item-section avatar><q-icon name="mdi-cancel" /></q-item-section>
                      <q-item-section>Cancelar</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item-label header>Trocar técnico</q-item-label>
                    <q-item
                      v-for="tecnico in atendentes"
                      :key="tecnico.id"
                      clickable
                      v-close-popup
                      :disable="tecnico.id === ordem.attendantId"
                      @click="moverOrdemParaTecnico(ordem, tecnico)"
                    >
                      <q-item-section avatar><q-icon name="mdi-account-hard-hat-outline" /></q-item-section>
                      <q-item-section>{{ tecnico.name }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </button>
            </div>
          </div>
          <div v-else class="calendar-board">
            <div class="calendar-weekdays">
              <div v-for="day in weekdayLabels" :key="day" class="calendar-weekday">{{ day }}</div>
            </div>
            <div class="calendar-grid">
              <div
                v-for="day in calendarDays"
                :key="day.key"
                class="calendar-day"
                :class="{ outside: !day.currentPeriod, today: day.key === hojeKey }"
              >
                <div class="calendar-day-header">
                  <strong>{{ day.label }}</strong>
                  <span>{{ ordensDoDia(day.key).length }} OS</span>
                </div>
                <div class="calendar-day-orders">
                  <button
                    v-for="ordem in ordensDoDia(day.key)"
                    :key="ordem.occurrenceKey || ordem.id"
                    class="calendar-item"
                    :class="[`status-${ordem.status}`, { urgente: ordem.priority === 'urgente' }]"
                    @click="selecionarOrdem(ordem)"
                    @contextmenu.prevent="prepararMenuOrdem(ordem)"
                  >
                    <strong>#{{ ordem.id }} {{ ordem.title }}</strong>
                    <span>{{ formatarHora(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</span>
                    <span>{{ ordem.contact ? ordem.contact.name : '' }}</span>
                    <q-menu
                      anchor="center right"
                      self="center left"
                      :offset="[10, 0]"
                      content-class="order-details-popover"
                      @before-show="selecionarOrdem(ordem)"
                    >
                      <div class="order-popover">
                        <div class="row items-start no-wrap q-mb-sm">
                          <div>
                            <div class="text-subtitle2 text-weight-medium">Detalhes da ordem #{{ ordem.id }}</div>
                            <div class="text-caption text-grey-7">{{ ordem.title }}</div>
                          </div>
                          <q-space />
                          <q-badge outline color="primary" :label="ordem.status" />
                        </div>
                        <div class="order-popover-grid">
                          <div><strong>Cliente:</strong> {{ ordem.contact ? ordem.contact.name : 'Sem cliente' }}</div>
                          <div><strong>Técnico:</strong> {{ ordem.attendant ? ordem.attendant.name : 'Sem técnico' }}</div>
                          <div><strong>Horário:</strong> {{ formatarData(ordem.scheduledStart) }} - {{ formatarHora(ordem.scheduledEnd) }}</div>
                          <div><strong>Recorrência:</strong> {{ formatarRecorrencia(ordem) }}</div>
                          <div v-if="ordem.address"><strong>Endereço:</strong> {{ ordem.address }} {{ ordem.city }}/{{ ordem.state }}</div>
                          <div v-if="ordem.description"><strong>Descrição:</strong> {{ ordem.description }}</div>
                        </div>
                        <q-separator class="q-my-sm" />
                        <div class="order-popover-actions">
                          <q-btn dense flat color="primary" icon="mdi-pencil" label="Editar" v-close-popup @click="abrirOrdem(ordem)" />
                          <q-btn dense flat color="amber-9" icon="mdi-play" label="Iniciar" v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')" />
                          <q-btn dense flat color="positive" icon="mdi-check" label="Concluir" v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')" />
                          <q-btn dense flat color="negative" icon="mdi-cancel" label="Cancelar" v-close-popup @click="cancelarOrdem(ordem)" />
                          <q-btn dense flat color="primary" icon="mdi-file-pdf-box" label="PDF cliente" v-close-popup @click="abrirPdfOrdem(ordem, false)" />
                          <q-btn v-if="podeVerObservacaoInterna" dense flat color="primary" icon="mdi-file-document-alert-outline" label="PDF interno" v-close-popup @click="abrirPdfOrdem(ordem, true)" />
                          <q-btn dense flat color="primary" icon="mdi-send" label="Notificar" v-close-popup @click="abrirNotificacao(ordem)" />
                        </div>
                        <q-separator class="q-my-sm" />
                        <div class="text-caption text-grey-7 q-mb-xs">Trocar tecnico</div>
                        <div class="order-popover-actions">
                          <q-btn
                            v-for="tecnico in atendentes"
                            :key="tecnico.id"
                            dense
                            flat
                            color="primary"
                            icon="mdi-account-hard-hat-outline"
                            :label="tecnico.name"
                            :disable="tecnico.id === ordem.attendantId"
                            v-close-popup
                            @click="moverOrdemParaTecnico(ordem, tecnico)"
                          />
                        </div>
                      </div>
                    </q-menu>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="modalOrdem" persistent>
      <q-card style="width: 920px; max-width: 96vw">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ form.id ? 'Editar ordem' : 'Nova ordem' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-sm">
          <q-select
            dense outlined use-input fill-input hide-selected input-debounce="300"
            class="col-12 col-md-6"
            label="Cliente"
            v-model="form.contactId"
            emit-value map-options
            :options="clientes"
            @filter="filtrarClientes"
          >
            <template v-slot:before-options>
              <q-item clickable @click.stop="abrirCadastroCliente">
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-account-plus-outline" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-primary text-weight-medium">Cadastrar novo cliente</q-item-label>
                  <q-item-label caption>Abre o cadastro sem fechar esta ordem</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
            <template v-slot:no-option>
              <q-item clickable @click.stop="abrirCadastroCliente">
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-account-plus-outline" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-primary text-weight-medium">Cadastrar novo cliente</q-item-label>
                  <q-item-label caption>Nenhum cliente encontrado para a busca</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select dense outlined emit-value map-options class="col-12 col-md-6" label="Técnico" v-model="form.attendantId" :options="opcoesAtendentes" />
          <q-input dense outlined class="col-12 col-md-6" label="Título" v-model="form.title" />
          <q-select
            dense outlined use-input fill-input hide-selected input-debounce="0"
            class="col-12 col-md-6"
            label="Tipo de serviço"
            v-model="form.serviceType"
            :input-value="form.serviceType"
            :options="opcoesTiposServico"
            @input-value="atualizarTipoServicoDigitado"
            @new-value="criarValorTipoServico"
          />
          <q-select dense outlined class="col-12 col-md-3" label="Prioridade" v-model="form.priority" :options="priorityOptions" />
          <q-select dense outlined class="col-12 col-md-3" label="Status" v-model="form.status" :options="statusOptions" />
          <q-input dense outlined type="date" class="col-12 col-md-4" label="Data" v-model="form.scheduledDate" />
          <q-select
            dense outlined emit-value map-options
            class="col-12 col-md-4"
            label="Hora início"
            v-model="form.scheduledStartTime"
            :options="timeOptions"
          />
          <q-select
            dense outlined emit-value map-options
            class="col-12 col-md-4"
            label="Hora fim"
            v-model="form.scheduledEndTime"
            :options="timeOptions"
          />
          <div class="col-12">
            <q-toggle
              v-model="form.recurrenceActive"
              label="Ordem recorrente"
              @input="alternarRecorrencia"
            />
          </div>
          <q-select
            v-if="form.recurrenceActive"
            dense outlined emit-value map-options
            class="col-12 col-md-6"
            label="Tipo de recorrência"
            v-model="form.recurrenceType"
            :options="recurrenceOptions"
          />
          <q-input
            v-if="form.recurrenceActive && form.recurrenceType === 'monthly_fixed_day'"
            dense outlined type="number"
            class="col-12 col-md-3"
            label="Dia fixo do mês"
            v-model.number="form.recurrenceDayOfMonth"
            min="1"
            max="31"
          />
          <q-input
            v-if="form.recurrenceActive && form.recurrenceType === 'custom_interval'"
            dense outlined type="number"
            class="col-12 col-md-3"
            label="A cada (dias)"
            v-model.number="form.recurrenceIntervalDays"
            min="1"
            max="365"
          />
          <q-input dense outlined class="col-12 col-md-6" label="Endereço" v-model="form.address" />
          <q-input dense outlined class="col-12 col-md-3" label="Cidade" v-model="form.city" />
          <q-input dense outlined maxlength="2" class="col-12 col-md-1" label="UF" v-model="form.state" />
          <q-input dense outlined mask="#####-###" class="col-12 col-md-2" label="CEP" v-model="form.zipCode" />
          <q-input dense outlined type="textarea" class="col-12" label="Descrição" v-model="form.description" />
          <div class="col-12">
            <q-separator class="q-my-sm" />
            <div class="row items-center q-col-gutter-sm">
              <div class="col-12 col-md">
                <div class="text-subtitle1 text-weight-medium">Produtos e serviços da ordem</div>
                <div class="text-caption text-grey-7">Itens cobrados ou usados nesta OS</div>
              </div>
              <q-select
                dense outlined emit-value map-options clearable
                class="col-12 col-md-3"
                label="Serviço"
                v-model="servicoOrdemSelecionado"
                :options="opcoesTiposServicoOrdem"
              />
              <q-btn flat color="primary" icon="mdi-plus" label="Serviço" :disable="!servicoOrdemSelecionado" @click="adicionarServicoNaOrdem" />
              <q-select
                dense outlined emit-value map-options clearable
                class="col-12 col-md-3"
                label="Produto"
                v-model="produtoOrdemSelecionado"
                :options="opcoesProdutosOrdem"
              />
              <q-btn flat color="primary" icon="mdi-plus" label="Produto" :disable="!produtoOrdemSelecionado" @click="adicionarProdutoNaOrdem" />
            </div>
            <q-markup-table v-if="form.items.length" flat bordered dense class="q-mt-sm service-order-items-table">
              <thead>
                <tr>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">Descrição</th>
                  <th class="text-right">Qtd.</th>
                  <th class="text-right">Valor unit.</th>
                  <th class="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.items" :key="item.key">
                  <td>{{ item.itemType === 'service' ? 'Serviço' : 'Produto' }}</td>
                  <td>
                    <q-input dense borderless v-model="item.description" />
                  </td>
                  <td class="quantity-cell">
                    <q-input dense borderless type="number" min="1" step="1" v-model.number="item.quantity" @blur="normalizarQuantidadeItemOrdem(item)" />
                  </td>
                  <td class="money-cell">
                    <q-input dense borderless inputmode="decimal" prefix="R$" v-model="item.unitPrice" @blur="normalizarMoedaItemOrdem(item)" />
                  </td>
                  <td class="text-right text-weight-medium">{{ totalItemOrdem(item) }}</td>
                  <td class="text-right">
                    <q-btn flat round dense color="negative" icon="mdi-delete" @click="removerItemOrdem(index)">
                      <q-tooltip>Remover item</q-tooltip>
                    </q-btn>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
            <div v-else class="text-caption text-grey-7 q-mt-sm">Nenhum produto ou serviço inserido nesta ordem.</div>
            <div class="row justify-end q-mt-sm">
              <div class="text-subtitle2">Total dos itens: {{ totalItensOrdem }}</div>
            </div>
          </div>
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observação para o cliente" v-model="form.publicObservation" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observação interna" v-model="form.internalObservation" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar rascunho" color="primary" :loading="salvando" @click="salvarOrdem('rascunho')" />
          <q-btn unelevated label="Agendar" color="positive" :loading="salvando" @click="salvarOrdem('agendada')" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalAtendente">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ atendente.id ? 'Editar técnico' : 'Novo técnico' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input dense outlined label="Nome" v-model="atendente.name" />
          <q-input dense outlined label="E-mail" v-model="atendente.email" />
          <q-input dense outlined mask="(##) #####-####" label="Telefone" v-model="atendente.phone" />
          <q-input dense outlined label="Especialidade" v-model="atendente.specialty" />
          <q-toggle label="Ativo" v-model="atendente.active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarAtendente" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalEstoque">
      <q-card style="width: 620px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ itemEstoque.id ? 'Editar produto' : 'Novo produto' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12 col-md-8" label="Nome" v-model="itemEstoque.name" />
          <q-input dense outlined class="col-12 col-md-4" label="SKU" v-model="itemEstoque.sku" />
          <q-input dense outlined class="col-12" type="textarea" label="Descrição" v-model="itemEstoque.description" />
          <q-select dense outlined emit-value map-options class="col-6 col-md-3" label="Unidade" v-model="itemEstoque.unit" :options="unitOptions" />
          <q-input dense outlined class="col-6 col-md-3" type="number" step="1" min="0" label="Quantidade" v-model.number="itemEstoque.quantity" @blur="normalizarInteiroEstoque('quantity')" />
          <q-input dense outlined class="col-6 col-md-3" type="number" step="1" min="0" label="Estoque mínimo" v-model.number="itemEstoque.minQuantity" @blur="normalizarInteiroEstoque('minQuantity')" />
          <q-input dense outlined class="col-6 col-md-3" inputmode="decimal" label="Preço venda" v-model="itemEstoque.salePrice" prefix="R$" @blur="normalizarMoedaEstoque('salePrice')" />
          <q-input dense outlined class="col-6 col-md-3" inputmode="decimal" label="Custo" v-model="itemEstoque.costPrice" prefix="R$" @blur="normalizarMoedaEstoque('costPrice')" />
          <q-toggle class="col-12" label="Ativo" v-model="itemEstoque.active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarEstoque" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalTipoServico">
      <q-card style="width: 560px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ tipoServico.id ? 'Editar tipo' : 'Novo tipo' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12 col-md-8" label="Nome" v-model="tipoServico.name" />
          <q-input dense outlined class="col-12 col-md-4" inputmode="decimal" label="Preço padrão" v-model="tipoServico.defaultPrice" prefix="R$" @blur="normalizarMoedaTipoServico" />
          <q-input dense outlined class="col-12" type="textarea" label="Descrição" v-model="tipoServico.description" />
          <q-toggle class="col-12" label="Ativo" v-model="tipoServico.active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarTipoServico" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalAjusteEstoque">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Ajustar estoque</div>
          <div class="text-caption text-grey-7">{{ ajusteEstoque.item ? ajusteEstoque.item.name : '' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-select
            dense outlined emit-value map-options
            class="col-12 col-md-6"
            label="Movimento"
            v-model="ajusteEstoque.movementType"
            :options="movementOptions"
          />
          <q-input
            dense outlined type="number" min="0" step="1"
            class="col-12 col-md-6"
            :label="ajusteEstoque.movementType === 'set' ? 'Novo saldo' : 'Quantidade'"
            v-model.number="ajusteEstoque.quantity"
          />
          <q-input dense outlined type="textarea" class="col-12" label="Observação" v-model="ajusteEstoque.observation" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar ajuste" color="primary" :loading="salvando" @click="salvarAjusteEstoque" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalNotificacao">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Notificar cliente</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-option-group
            v-model="notificacao.channels"
            type="checkbox"
            :options="notificationOptions"
          />
          <q-input dense outlined type="textarea" label="Mensagem pública" v-model="notificacao.message" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Enviar" color="primary" :loading="salvando" @click="enviarNotificacao" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ClienteModal
      v-model="modalCliente"
      :contactId="selectedContactId"
      @saved="clienteSalvo"
    />
  </q-page>
</template>

<script>
import { socketIO } from 'src/utils/socket'
import { ListarClientes } from 'src/service/clientes'
import ClienteModal from 'src/pages/clientes/ClienteModal'
import {
  ListarAtendentesServico,
  CriarAtendenteServico,
  AlterarAtendenteServico,
  ListarEstoqueServico,
  ListarEstoqueBaixoServico,
  ListarMovimentacoesEstoqueServico,
  CriarItemEstoqueServico,
  AlterarItemEstoqueServico,
  ExcluirItemEstoqueServico,
  AjustarItemEstoqueServico,
  ListarTiposServico,
  CriarTipoServico,
  AlterarTipoServico,
  ExcluirTipoServico,
  ListarOrdensServico,
  DashboardOrdensServico,
  CriarOrdemServico,
  AlterarOrdemServico,
  DocumentoOrdemServico,
  DocumentoInternoOrdemServico,
  NotificarOrdemServico
} from 'src/service/ordensServico'

const socket = socketIO()

const localDateInput = (value = new Date()) => {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

const emptyForm = () => ({
  contactId: null,
  attendantId: null,
  title: '',
  description: '',
  serviceType: '',
  priority: 'baixa',
  status: 'rascunho',
  recurrenceActive: false,
  recurrenceType: 'single',
  recurrenceDayOfMonth: null,
  recurrenceIntervalDays: 30,
  scheduledDate: '',
  scheduledStartTime: '',
  scheduledEndTime: '',
  scheduledStart: '',
  scheduledEnd: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  publicObservation: '',
  internalObservation: '',
  items: []
})

export default {
  name: 'OrdensServico',
  components: { ClienteModal },
  data () {
    return {
      visao: 'dia',
      aba: 'agenda',
      salvando: false,
      dataAgenda: localDateInput(),
      modalOrdem: false,
      modalAtendente: false,
      modalEstoque: false,
      modalAjusteEstoque: false,
      modalTipoServico: false,
      modalNotificacao: false,
      modalCliente: false,
      selectedContactId: null,
      form: emptyForm(),
      atendente: { active: true },
      itemEstoque: { active: true, unit: 'unidade', quantity: 0, minQuantity: 0 },
      ajusteEstoque: { item: null, movementType: 'entry', quantity: 0, observation: '' },
      tipoServico: { active: true },
      servicoOrdemSelecionado: null,
      produtoOrdemSelecionado: null,
      notificacao: { channels: ['internal'], message: '' },
      ordens: [],
      atendentes: [],
      estoque: [],
      baixoEstoque: [],
      filtrarEstoqueBaixo: false,
      movimentacoesEstoque: [],
      tiposServico: [],
      clientes: [],
      ordemSelecionada: null,
      ordemArrastada: null,
      contextHorario: null,
      dashboard: {},
      filtros: {},
      priorityOptions: ['baixa', 'media', 'alta', 'urgente'],
      statusOptions: ['rascunho', 'agendada', 'em_atendimento', 'concluida', 'cancelada', 'reagendada'],
      recurrenceOptions: [
        { label: 'Dia fixo todo mês', value: 'monthly_fixed_day' },
        { label: 'Intervalo em dias', value: 'custom_interval' }
      ],
      timeOptions: Array.from({ length: 24 }, (_, hour) => {
        const value = `${String(hour).padStart(2, '0')}:00`
        return { label: value, value }
      }),
      notificationOptions: [
        { label: 'Interna', value: 'internal' },
        { label: 'E-mail', value: 'email' },
        { label: 'WhatsApp', value: 'whatsapp' }
      ],
      unitOptions: [
        { label: 'Unidade', value: 'unidade' },
        { label: 'Litros', value: 'litros' }
      ],
      movementOptions: [
        { label: 'Entrada', value: 'entry' },
        { label: 'Saída', value: 'exit' },
        { label: 'Definir saldo', value: 'set' }
      ],
      colunasEstoque: [
        { name: 'name', label: 'Produto', field: 'name', align: 'left', sortable: true },
        { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
        { name: 'quantity', label: 'Saldo', field: 'quantity', align: 'left', sortable: true },
        { name: 'salePrice', label: 'Preço venda', field: row => this.formatarMoeda(row.salePrice), align: 'right', sortable: true },
        { name: 'active', label: 'Status', field: 'active', align: 'center' },
        { name: 'actions', label: '', field: 'actions', align: 'right' }
      ],
      colunasMovimentacoesEstoque: [
        { name: 'createdAt', label: 'Data', field: row => this.formatarData(row.createdAt), align: 'left', sortable: true },
        { name: 'inventoryItem', label: 'Produto', field: row => row.inventoryItem ? row.inventoryItem.name : '-', align: 'left', sortable: true },
        { name: 'quantity', label: 'Qtd.', field: 'quantity', align: 'center', sortable: true },
        { name: 'serviceOrderId', label: 'OS', field: 'serviceOrderId', align: 'left' },
        { name: 'user', label: 'Usuário', field: row => row.user ? row.user.name : '-', align: 'left' },
        { name: 'observation', label: 'Observação', field: 'observation', align: 'left' }
      ],
      colunasTiposServico: [
        { name: 'name', label: 'Tipo', field: 'name', align: 'left', sortable: true },
        { name: 'defaultPrice', label: 'Preço padrão', field: row => this.formatarMoeda(row.defaultPrice), align: 'right', sortable: true },
        { name: 'active', label: 'Status', field: 'active', align: 'center' },
        { name: 'actions', label: '', field: 'actions', align: 'right' }
      ],
      agendaStartHour: 0,
      agendaEndHour: 23,
      weekdayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    }
  },
  computed: {
    opcoesAtendentes () {
      return this.atendentes.map(item => ({ label: item.name, value: item.id }))
    },
    opcoesTiposServico () {
      return this.tiposServico
        .filter(item => item.active)
        .map(item => item.name)
    },
    opcoesTiposServicoOrdem () {
      return this.tiposServico
        .filter(item => item.active)
        .map(item => ({ label: `${item.name} - ${this.formatarMoeda(item.defaultPrice)}`, value: item.id }))
    },
    opcoesProdutosOrdem () {
      return this.estoque
        .filter(item => item.active)
        .map(item => ({ label: `${item.name} - ${this.formatarMoeda(item.salePrice)}`, value: item.id }))
    },
    estoqueFiltrado () {
      if (!this.filtrarEstoqueBaixo) return this.estoque
      const baixoEstoqueIds = new Set(this.baixoEstoque.map(item => item.id))
      return this.estoque.filter(item => baixoEstoqueIds.has(item.id))
    },
    totalItensOrdem () {
      const total = this.form.items.reduce((sum, item) => {
        const quantity = this.parseInteiro(item.quantity) || 1
        const unitPrice = this.parseMoeda(item.unitPrice) || 0
        return sum + (quantity * unitPrice)
      }, 0)
      return this.formatarMoeda(total)
    },
    agendaHours () {
      return Array.from(
        { length: this.agendaEndHour - this.agendaStartHour + 1 },
        (_, index) => index + this.agendaStartHour
      )
    },
    gridAgendaStyle () {
      return {
        gridTemplateColumns: `150px repeat(${this.agendaHours.length}, minmax(48px, 1fr))`
      }
    },
    hojeKey () {
      return localDateInput()
    },
    calendarDays () {
      return this.visao === 'semana' ? this.diasDaSemanaAgenda() : this.diasDoMesAgenda()
    },
    linhasTecnicos () {
      const colors = ['#bae6fd', '#bbf7d0', '#fed7aa', '#fde68a', '#99f6e4', '#fbcfe8', '#ddd6fe', '#fecaca']
      const linhas = this.atendentes.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }))
      if (this.ordens.some(ordem => this.mesmoDiaAgenda(ordem.scheduledStart) && !ordem.attendantId)) {
        linhas.push({ id: null, name: 'Sem técnico', color: '#e5e7eb' })
      }
      return linhas
    },
    dashboardCards () {
      return [
        { label: 'Total', value: this.dashboard.total || 0 },
        { label: 'Agendadas', value: this.dashboard.scheduled || 0 },
        { label: 'Concluídas', value: this.dashboard.completed || 0 },
        { label: 'Canceladas', value: this.dashboard.canceled || 0 },
        { label: 'Atrasadas', value: this.dashboard.late || 0 },
        { label: 'Tempo médio', value: `${this.dashboard.averageServiceMinutes || 0} min` },
        { label: 'Taxa cancelamento', value: `${this.dashboard.cancellationRate || 0}%` },
        { label: 'Total itens', value: this.formatarMoeda(this.dashboard.totalItemsValue) },
        { label: 'Serviços', value: this.formatarMoeda(this.dashboard.serviceItemsValue) },
        { label: 'Produtos', value: this.formatarMoeda(this.dashboard.productItemsValue) }
      ]
    },
    podeVerObservacaoInterna () {
      return ['admin', 'superadmin', 'supervisor', 'atendente', 'tecnico'].includes(localStorage.getItem('profile'))
    },
    podeGerenciarEstoque () {
      return ['admin', 'superadmin', 'supervisor'].includes(localStorage.getItem('profile'))
    }
  },
  methods: {
    async carregarTudo () {
      await Promise.all([
        this.carregarAtendentes(),
        this.carregarEstoque(),
        this.carregarEstoqueBaixo(),
        this.carregarMovimentacoesEstoque(),
        this.carregarTiposServico(),
        this.carregarOrdens(),
        this.carregarDashboard()
      ])
    },
    async carregarAtendentes () {
      const { data } = await ListarAtendentesServico()
      this.atendentes = data
    },
    async carregarEstoque () {
      const { data } = await ListarEstoqueServico()
      this.estoque = data
    },
    async carregarEstoqueBaixo () {
      const { data } = await ListarEstoqueBaixoServico()
      this.baixoEstoque = data
    },
    async carregarMovimentacoesEstoque () {
      const { data } = await ListarMovimentacoesEstoqueServico()
      this.movimentacoesEstoque = data
    },
    async carregarTiposServico () {
      const { data } = await ListarTiposServico()
      this.tiposServico = data
    },
    async carregarOrdens () {
      const params = { ...this.filtros }
      const { start, end } = this.periodoAgenda()
      params.start = start.toISOString()
      params.end = end.toISOString()
      const { data } = await ListarOrdensServico(params)
      this.ordens = data
      await this.carregarDashboard()
    },
    async carregarDashboard () {
      const { data } = await DashboardOrdensServico(this.filtros)
      this.dashboard = data
    },
    async filtrarClientes (val, update) {
      const { data } = await ListarClientes({ searchParam: val })
      update(() => {
        this.clientes = data.map(this.formatarOpcaoCliente)
      })
    },
    formatarOpcaoCliente (cliente) {
      return {
        label: `${cliente.name} - ${cliente.number || cliente.email || ''}`,
        value: cliente.id
      }
    },
    abrirCadastroCliente () {
      this.selectedContactId = null
      this.modalCliente = true
    },
    clienteSalvo (cliente) {
      const opcao = this.formatarOpcaoCliente(cliente)
      const index = this.clientes.findIndex(item => item.value === opcao.value)
      if (index === -1) this.clientes.unshift(opcao)
      else this.$set(this.clientes, index, opcao)
      this.form.contactId = opcao.value
    },
    abrirOrdem (ordem) {
      this.form = ordem
        ? {
          ...emptyForm(),
          ...ordem,
          recurrenceActive: Boolean(ordem.recurrenceActive || (ordem.recurrenceType && ordem.recurrenceType !== 'single')),
          recurrenceType: ordem.recurrenceType || 'single',
          recurrenceDayOfMonth: ordem.recurrenceDayOfMonth || null,
          recurrenceIntervalDays: ordem.recurrenceIntervalDays || 30,
          scheduledDate: this.toInputDate(ordem.scheduledStart).slice(0, 10),
          scheduledStartTime: this.toInputTime(ordem.scheduledStart),
          scheduledEndTime: this.toInputTime(ordem.scheduledEnd),
          scheduledStart: this.toInputDate(ordem.scheduledStart),
          scheduledEnd: this.toInputDate(ordem.scheduledEnd),
          items: this.normalizarItensOrdemParaFormulario(ordem.items || [])
        }
        : emptyForm()
      this.servicoOrdemSelecionado = null
      this.produtoOrdemSelecionado = null
      this.modalOrdem = true
    },
    abrirAtendente (atendente) {
      this.atendente = atendente ? { ...atendente } : { active: true }
      this.modalAtendente = true
    },
    async salvarAtendente () {
      this.salvando = true
      try {
        if (this.atendente.id) await AlterarAtendenteServico(this.atendente)
        else await CriarAtendenteServico(this.atendente)
        this.$q.notify({ type: 'positive', message: 'Técnico salvo.' })
        this.modalAtendente = false
        await this.carregarAtendentes()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o técnico', error)
      } finally {
        this.salvando = false
      }
    },
    abrirEstoque (item) {
      this.itemEstoque = item
        ? {
          ...item,
          unit: item.unit || 'unidade',
          quantity: this.parseInteiro(item.quantity),
          minQuantity: this.parseInteiro(item.minQuantity),
          salePrice: this.formatarMoedaCampo(item.salePrice),
          costPrice: this.formatarMoedaCampo(item.costPrice)
        }
        : { active: true, unit: 'unidade', quantity: 0, minQuantity: 0, salePrice: '0,00', costPrice: '0,00' }
      this.modalEstoque = true
    },
    async salvarEstoque () {
      this.salvando = true
      try {
        const payload = this.normalizarPayloadEstoque(this.itemEstoque)
        if (payload.id) await AlterarItemEstoqueServico(payload)
        else await CriarItemEstoqueServico(payload)
        this.$q.notify({ type: 'positive', message: 'Produto salvo.' })
        this.modalEstoque = false
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o produto', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarExcluirEstoque (item) {
      this.$q.dialog({
        title: 'Excluir produto',
        message: `Confirma excluir ${item.name}?`,
        cancel: true,
        persistent: true
      }).onOk(() => this.excluirEstoque(item))
    },
    async excluirEstoque (item) {
      try {
        await ExcluirItemEstoqueServico(item.id)
        this.$q.notify({ type: 'positive', message: 'Produto excluído.' })
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
      } catch (error) {
        this.$notificarErro('Não foi possível excluir o produto', error)
      }
    },
    abrirAjusteEstoque (item) {
      this.ajusteEstoque = {
        item,
        movementType: 'entry',
        quantity: 0,
        observation: ''
      }
      this.modalAjusteEstoque = true
    },
    async salvarAjusteEstoque () {
      if (!this.ajusteEstoque.item) return
      this.salvando = true
      try {
        await AjustarItemEstoqueServico(this.ajusteEstoque.item.id, {
          movementType: this.ajusteEstoque.movementType,
          quantity: this.parseInteiro(this.ajusteEstoque.quantity),
          observation: this.ajusteEstoque.observation
        })
        this.$q.notify({ type: 'positive', message: 'Estoque ajustado.' })
        this.modalAjusteEstoque = false
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
        await this.carregarMovimentacoesEstoque()
      } catch (error) {
        this.$notificarErro('Não foi possível ajustar o estoque', error)
      } finally {
        this.salvando = false
      }
    },
    abrirTipoServico (tipo) {
      this.tipoServico = tipo
        ? { ...tipo, defaultPrice: this.formatarMoedaCampo(tipo.defaultPrice) }
        : { active: true, defaultPrice: '0,00' }
      this.modalTipoServico = true
    },
    async salvarTipoServico () {
      this.salvando = true
      try {
        const payload = this.normalizarPayloadTipoServico(this.tipoServico)
        if (payload.id) await AlterarTipoServico(payload)
        else await CriarTipoServico(payload)
        this.$q.notify({ type: 'positive', message: 'Tipo de serviço salvo.' })
        this.modalTipoServico = false
        await this.carregarTiposServico()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o tipo de serviço', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarExcluirTipoServico (tipo) {
      this.$q.dialog({
        title: 'Excluir tipo de serviço',
        message: `Confirma excluir ${tipo.name}?`,
        cancel: true,
        persistent: true
      }).onOk(() => this.excluirTipoServico(tipo))
    },
    async excluirTipoServico (tipo) {
      try {
        await ExcluirTipoServico(tipo.id)
        this.$q.notify({ type: 'positive', message: 'Tipo de serviço excluído.' })
        await this.carregarTiposServico()
      } catch (error) {
        this.$notificarErro('Não foi possível excluir o tipo de serviço', error)
      }
    },
    criarValorTipoServico (value, done) {
      this.form.serviceType = value
      done(value, 'add-unique')
    },
    atualizarTipoServicoDigitado (value) {
      this.form.serviceType = value
    },
    parseInteiro (value) {
      const parsed = parseInt(value, 10)
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    },
    parseMoeda (value) {
      if (value === null || value === undefined || value === '') return null
      const cleaned = String(value)
        .replace(/[^\d,.-]/g, '')
      const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned
      const parsed = Number(normalized)
      return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null
    },
    formatarMoedaCampo (value) {
      const parsed = this.parseMoeda(value)
      return parsed === null ? '' : parsed.toFixed(2).replace('.', ',')
    },
    formatarMoeda (value) {
      const parsed = this.parseMoeda(value)
      if (parsed === null) return '-'
      return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    normalizarInteiroEstoque (field) {
      this.itemEstoque[field] = this.parseInteiro(this.itemEstoque[field])
    },
    normalizarMoedaEstoque (field) {
      this.itemEstoque[field] = this.formatarMoedaCampo(this.itemEstoque[field])
    },
    normalizarMoedaTipoServico () {
      this.tipoServico.defaultPrice = this.formatarMoedaCampo(this.tipoServico.defaultPrice)
    },
    normalizarPayloadEstoque (item) {
      return {
        ...item,
        unit: item.unit || 'unidade',
        quantity: this.parseInteiro(item.quantity),
        minQuantity: this.parseInteiro(item.minQuantity),
        costPrice: this.parseMoeda(item.costPrice),
        salePrice: this.parseMoeda(item.salePrice)
      }
    },
    normalizarPayloadTipoServico (tipo) {
      return {
        ...tipo,
        defaultPrice: this.parseMoeda(tipo.defaultPrice)
      }
    },
    criarItemOrdemBase (overrides) {
      return {
        key: `${Date.now()}-${Math.random()}`,
        itemType: 'service',
        serviceTypeId: null,
        inventoryItemId: null,
        description: '',
        quantity: 1,
        unitPrice: '0,00',
        ...overrides
      }
    },
    adicionarServicoNaOrdem () {
      const serviceType = this.tiposServico.find(item => item.id === this.servicoOrdemSelecionado)
      if (!serviceType) return
      this.form.items.push(this.criarItemOrdemBase({
        itemType: 'service',
        serviceTypeId: serviceType.id,
        description: serviceType.name,
        unitPrice: this.formatarMoedaCampo(serviceType.defaultPrice)
      }))
      this.servicoOrdemSelecionado = null
    },
    adicionarProdutoNaOrdem () {
      const product = this.estoque.find(item => item.id === this.produtoOrdemSelecionado)
      if (!product) return
      this.form.items.push(this.criarItemOrdemBase({
        itemType: 'product',
        inventoryItemId: product.id,
        description: product.name,
        unitPrice: this.formatarMoedaCampo(product.salePrice)
      }))
      this.produtoOrdemSelecionado = null
    },
    removerItemOrdem (index) {
      this.form.items.splice(index, 1)
    },
    normalizarQuantidadeItemOrdem (item) {
      item.quantity = Math.max(1, this.parseInteiro(item.quantity))
    },
    normalizarMoedaItemOrdem (item) {
      item.unitPrice = this.formatarMoedaCampo(item.unitPrice)
    },
    totalItemOrdem (item) {
      const quantity = this.parseInteiro(item.quantity) || 1
      const unitPrice = this.parseMoeda(item.unitPrice) || 0
      return this.formatarMoeda(quantity * unitPrice)
    },
    normalizarItensOrdemParaFormulario (items) {
      return items.map(item => this.criarItemOrdemBase({
        ...item,
        quantity: this.parseInteiro(item.quantity) || 1,
        unitPrice: this.formatarMoedaCampo(item.unitPrice)
      }))
    },
    normalizarItensOrdemPayload (items) {
      return (items || [])
        .filter(item => item.description)
        .map(item => ({
          itemType: item.itemType,
          serviceTypeId: item.itemType === 'service' ? item.serviceTypeId : null,
          inventoryItemId: item.itemType === 'product' ? item.inventoryItemId : null,
          description: item.description,
          quantity: Math.max(1, this.parseInteiro(item.quantity)),
          unitPrice: this.parseMoeda(item.unitPrice) || 0
        }))
    },
    async salvarOrdem (status) {
      this.salvando = true
      try {
        const payload = this.normalizarDatasPayload({ ...this.form, status })
        const response = payload.id ? await AlterarOrdemServico(payload) : await CriarOrdemServico(payload)
        this.$q.notify({ type: 'positive', message: 'Ordem de serviço salva.' })
        this.modalOrdem = false
        this.ordemSelecionada = response.data
        await this.carregarOrdens()
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
        await this.carregarMovimentacoesEstoque()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar a ordem de serviço', error)
      } finally {
        this.salvando = false
      }
    },
    selecionarOrdem (ordem) {
      this.ordemSelecionada = ordem
    },
    async alterarStatus (status) {
      if (!this.ordemSelecionada) return
      await this.salvarStatus({ ...this.ordemSelecionada, status })
    },
    async alterarStatusOrdem (ordem, status) {
      this.ordemSelecionada = ordem
      await this.salvarStatus({ ...ordem, status })
    },
    confirmarCancelamento () {
      this.$q.dialog({
        title: 'Cancelar ordem',
        message: 'Confirma o cancelamento desta ordem de serviço?',
        cancel: true,
        persistent: true
      }).onOk(() => this.salvarStatus({ ...this.ordemSelecionada, status: 'cancelada' }))
    },
    cancelarOrdem (ordem) {
      this.ordemSelecionada = ordem
      this.confirmarCancelamento()
    },
    async salvarStatus (payload) {
      try {
        const { data } = await AlterarOrdemServico(this.normalizarDatasPayload(payload))
        this.ordemSelecionada = data
        await this.carregarOrdens()
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
        await this.carregarMovimentacoesEstoque()
      } catch (error) {
        this.$notificarErro('Não foi possível alterar o status', error)
      }
    },
    async abrirPdf (interno) {
      if (!this.ordemSelecionada) return
      await this.abrirPdfOrdem(this.ordemSelecionada, interno)
    },
    async abrirPdfOrdem (ordem, interno) {
      if (!ordem) return
      this.ordemSelecionada = ordem
      try {
        const { data } = interno
          ? await DocumentoInternoOrdemServico(ordem.id)
          : await DocumentoOrdemServico(ordem.id)
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        window.open(url, '_blank')
      } catch (error) {
        this.$notificarErro('Não foi possível gerar o PDF', error)
      }
    },
    abrirNotificacao (ordem) {
      this.ordemSelecionada = ordem
      this.modalNotificacao = true
    },
    async enviarNotificacao () {
      if (!this.ordemSelecionada) return
      this.salvando = true
      try {
        const { data } = await NotificarOrdemServico(this.ordemSelecionada.id, this.notificacao)
        const falhas = Object.keys(data.failed || {})
        this.$q.notify({
          type: falhas.length ? 'warning' : 'positive',
          message: falhas.length ? `Notificação parcial. Falhas: ${falhas.join(', ')}` : 'Notificação enviada.'
        })
        this.modalNotificacao = false
      } catch (error) {
        this.$notificarErro('Não foi possível enviar a notificação', error)
      } finally {
        this.salvando = false
      }
    },
    arrastarOrdem (ordem) {
      this.ordemArrastada = ordem
    },
    async soltarOrdem (linha, hour) {
      if (!this.ordemArrastada) return
      const originalStart = new Date(this.ordemArrastada.scheduledStart)
      const originalEnd = new Date(this.ordemArrastada.scheduledEnd)
      const duration = originalEnd - originalStart
      const nextStart = this.dataHoraAgenda(hour)
      const nextEnd = new Date(nextStart.getTime() + duration)
      await this.salvarStatus({
        ...this.ordemArrastada,
        attendantId: linha.id,
        scheduledStart: this.toInputDate(nextStart),
        scheduledEnd: this.toInputDate(nextEnd),
        status: this.ordemArrastada.status === 'agendada' ? 'reagendada' : this.ordemArrastada.status
      })
      this.ordemArrastada = null
    },
    async moverOrdemParaTecnico (ordem, tecnico) {
      await this.salvarStatus({
        ...ordem,
        attendantId: tecnico.id,
        attendant: tecnico,
        status: ordem.status === 'agendada' ? 'reagendada' : ordem.status
      })
    },
    prepararMenuHorario (linha, hour) {
      this.contextHorario = { linha, hour }
      this.ordemSelecionada = null
    },
    prepararMenuOrdem (ordem) {
      this.ordemSelecionada = ordem
    },
    reservarHorario (linha, hour) {
      this.abrirOrdemNoHorario(linha, hour, {
        title: 'Reserva de horário',
        serviceType: 'Reserva',
        status: 'rascunho'
      })
    },
    abrirOrdemNoHorario (linha, hour, overrides = {}) {
      const start = this.dataHoraAgenda(hour)
      const end = new Date(start.getTime())
      end.setHours(end.getHours() + 1)
      this.form = {
        ...emptyForm(),
        ...overrides,
        attendantId: linha.id,
        scheduledDate: this.toInputDate(start).slice(0, 10),
        scheduledStartTime: this.toInputTime(start),
        scheduledEndTime: this.toInputTime(end),
        scheduledStart: this.toInputDate(start),
        scheduledEnd: this.toInputDate(end)
      }
      this.modalOrdem = true
    },
    async redimensionarOrdem (ordem, minutes) {
      const end = new Date(ordem.scheduledEnd)
      end.setMinutes(end.getMinutes() + minutes)
      if (end <= new Date(ordem.scheduledStart)) return
      await this.salvarStatus({ ...ordem, scheduledEnd: this.toInputDate(end) })
    },
    dashboardList (source) {
      return Object.entries(source || {})
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    },
    dashboardMoneyList (source) {
      return Object.entries(source || {})
        .map(([label, value]) => ({
          label,
          rawValue: Number(value || 0),
          value: this.formatarMoeda(value)
        }))
        .sort((a, b) => b.rawValue - a.rawValue)
        .slice(0, 8)
    },
    mesmoDiaAgenda (value) {
      if (!value) return false
      return localDateInput(value) === this.dataAgenda
    },
    mesmoDiaCalendario (value, dateKey) {
      if (!value) return false
      return localDateInput(value) === dateKey
    },
    ordensDaLinha (attendantId) {
      return this.ordens.filter(ordem => (
        this.mesmoDiaAgenda(ordem.scheduledStart) &&
        (ordem.attendantId || null) === (attendantId || null)
      ))
    },
    ordensDoDia (dateKey) {
      return this.ordens
        .filter(ordem => this.mesmoDiaCalendario(ordem.scheduledStart, dateKey))
        .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    },
    estiloOrdemAgenda (ordem) {
      const start = new Date(ordem.scheduledStart)
      const end = new Date(ordem.scheduledEnd)
      const startHour = start.getHours() + (start.getMinutes() / 60)
      const durationHours = Math.max(0.5, (end - start) / 3600000)
      const clampedStart = Math.max(this.agendaStartHour, Math.floor(startHour))
      const offset = Math.max(0, startHour - clampedStart)
      const span = Math.max(1, Math.ceil(offset + durationHours))
      return {
        gridColumn: `${clampedStart - this.agendaStartHour + 2} / span ${span}`,
        marginLeft: `${offset * 100}%`
      }
    },
    dataHoraAgenda (hour) {
      const date = new Date(`${this.dataAgenda}T00:00:00`)
      date.setHours(hour, 0, 0, 0)
      return date
    },
    inicioDiaAgenda () {
      const date = new Date(`${this.dataAgenda}T00:00:00`)
      date.setHours(0, 0, 0, 0)
      return date
    },
    inicioSemanaAgenda () {
      const date = this.inicioDiaAgenda()
      date.setDate(date.getDate() - date.getDay())
      return date
    },
    inicioMesAgenda () {
      const date = this.inicioDiaAgenda()
      date.setDate(1)
      return date
    },
    periodoAgenda () {
      if (this.visao === 'semana') {
        const start = this.inicioSemanaAgenda()
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        return { start, end }
      }
      if (this.visao === 'mes') {
        const start = this.inicioMesAgenda()
        const end = new Date(start)
        end.setMonth(end.getMonth() + 1)
        return { start, end }
      }
      return {
        start: this.dataHoraAgenda(this.agendaStartHour),
        end: this.dataHoraAgenda(this.agendaEndHour + 1)
      }
    },
    diasDaSemanaAgenda () {
      const start = this.inicioSemanaAgenda()
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        return this.descreverDiaCalendario(date, true)
      })
    },
    diasDoMesAgenda () {
      const monthStart = this.inicioMesAgenda()
      const gridStart = new Date(monthStart)
      gridStart.setDate(gridStart.getDate() - gridStart.getDay())
      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + index)
        return this.descreverDiaCalendario(
          date,
          date.getMonth() === monthStart.getMonth()
        )
      })
    },
    descreverDiaCalendario (date, currentPeriod) {
      return {
        key: localDateInput(date),
        label: String(date.getDate()).padStart(2, '0'),
        currentPeriod
      }
    },
    alterarDataAgenda (days) {
      const date = new Date(`${this.dataAgenda}T00:00:00`)
      if (this.visao === 'mes') date.setMonth(date.getMonth() + days)
      else if (this.visao === 'semana') date.setDate(date.getDate() + (days * 7))
      else date.setDate(date.getDate() + days)
      this.dataAgenda = localDateInput(date)
      this.carregarTudo()
    },
    irParaHoje () {
      this.dataAgenda = localDateInput()
      this.carregarTudo()
    },
    hourLabel (hour) {
      return `${String(hour).padStart(2, '0')}:00`
    },
    formatarHora (value) {
      if (!value) return ''
      return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    },
    formatarData (value) {
      if (!value) return ''
      return new Date(value).toLocaleString('pt-BR')
    },
    formatarRecorrencia (ordem) {
      if (!ordem || !ordem.recurrenceActive || ordem.recurrenceType === 'single') return 'Avulsa'
      if (ordem.recurrenceType === 'monthly_fixed_day') return `Todo mês no dia ${ordem.recurrenceDayOfMonth}`
      if (ordem.recurrenceType === 'custom_interval') return `A cada ${ordem.recurrenceIntervalDays} dia(s)`
      return 'Avulsa'
    },
    alternarRecorrencia (active) {
      if (!active) {
        this.form.recurrenceType = 'single'
        this.form.recurrenceDayOfMonth = null
        this.form.recurrenceIntervalDays = null
        return
      }
      if (this.form.recurrenceType === 'single') this.form.recurrenceType = 'monthly_fixed_day'
      if (!this.form.recurrenceDayOfMonth) {
        const start = this.form.scheduledDate ? new Date(`${this.form.scheduledDate}T00:00:00`) : new Date()
        this.form.recurrenceDayOfMonth = start.getDate()
      }
      if (!this.form.recurrenceIntervalDays) this.form.recurrenceIntervalDays = 30
    },
    toInputDate (value) {
      if (!value) return ''
      const date = new Date(value)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      return date.toISOString().slice(0, 16)
    },
    toInputTime (value) {
      if (!value) return ''
      const date = new Date(value)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      if (date.getMinutes() >= 30) date.setHours(date.getHours() + 1)
      date.setMinutes(0, 0, 0)
      return date.toISOString().slice(11, 16)
    },
    toApiDate (value) {
      if (!value) return null
      return new Date(value).toISOString()
    },
    toApiScheduleDate (payload, field, timeField) {
      if (payload.scheduledDate && payload[timeField]) {
        return this.toApiDate(`${payload.scheduledDate}T${payload[timeField]}`)
      }
      return this.toApiDate(payload[field])
    },
    normalizarDatasPayload (payload) {
      return {
        ...payload,
        ...this.normalizarRecorrenciaPayload(payload),
        items: this.normalizarItensOrdemPayload(payload.items),
        scheduledStart: this.toApiScheduleDate(payload, 'scheduledStart', 'scheduledStartTime'),
        scheduledEnd: this.toApiScheduleDate(payload, 'scheduledEnd', 'scheduledEndTime')
      }
    },
    normalizarRecorrenciaPayload (payload) {
      if (!payload.recurrenceActive || payload.recurrenceType === 'single') {
        return {
          recurrenceActive: false,
          recurrenceType: 'single',
          recurrenceDayOfMonth: null,
          recurrenceIntervalDays: null
        }
      }
      if (payload.recurrenceType === 'custom_interval') {
        return {
          recurrenceActive: true,
          recurrenceType: 'custom_interval',
          recurrenceDayOfMonth: null,
          recurrenceIntervalDays: Number(payload.recurrenceIntervalDays)
        }
      }
      return {
        recurrenceActive: true,
        recurrenceType: 'monthly_fixed_day',
        recurrenceDayOfMonth: Number(payload.recurrenceDayOfMonth),
        recurrenceIntervalDays: null
      }
    },
    conectarSocket () {
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      if (!usuario?.tenantId) return
      socket.on(`${usuario.tenantId}:serviceOrders`, () => this.carregarOrdens())
    }
  },
  async mounted () {
    await this.carregarTudo()
    this.conectarSocket()
  },
  destroyed () {
    socket.disconnect()
  }
}
</script>

<style scoped>
.empty-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 8px;
  color: #6b7280;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}
.dashboard-panel {
  min-height: 190px;
}
.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #eef2f7;
}
.agenda-workspace {
  display: grid;
  gap: 16px;
}
.agenda-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.agenda-date {
  width: 168px;
}
.agenda-card {
  overflow: hidden;
}
.technician-schedule {
  overflow-x: auto;
  border: 1px solid #d7dde7;
  border-radius: 8px;
}
.schedule-grid {
  display: grid;
  min-width: 1280px;
}
.schedule-header {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #f8fafc;
  border-bottom: 1px solid #cbd5e1;
}
.technician-heading,
.hour-heading {
  min-height: 36px;
  padding: 8px;
  border-right: 1px solid #d7dde7;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.technician-heading {
  text-align: left;
}
.schedule-row {
  min-height: 82px;
  border-bottom: 1px solid #d7dde7;
}
.technician-name {
  grid-column: 1;
  grid-row: 1;
  display: grid;
  align-content: center;
  gap: 2px;
  padding: 10px;
  border-right: 1px solid #cbd5e1;
  color: #111827;
}
.technician-name span {
  color: #475569;
  font-size: 12px;
}
.hour-cell {
  grid-row: 1;
  min-height: 82px;
  border-right: 1px solid #d7dde7;
  background: #fff;
  cursor: context-menu;
}
.hour-cell:nth-child(even) {
  background: #f8fafc;
}
.visit-block,
.calendar-item,
.schedule-order {
  width: 100%;
  text-align: left;
  border: 0;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
  padding: 8px;
  display: grid;
  gap: 2px;
  background: #eff6ff;
  cursor: pointer;
}
.schedule-order {
  grid-row: 1;
  z-index: 3;
  align-self: center;
  min-height: 54px;
  max-height: 72px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .12);
}
.resize-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}
.calendar-board {
  border: 1px solid #d7dde7;
  border-radius: 8px;
  overflow: hidden;
}
.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(140px, 1fr));
}
.calendar-weekday {
  padding: 10px;
  border-right: 1px solid #d7dde7;
  border-bottom: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.calendar-day {
  min-height: 150px;
  padding: 8px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}
.calendar-day.outside {
  background: #f8fafc;
  color: #94a3b8;
}
.calendar-day.today {
  box-shadow: inset 0 0 0 2px #2563eb;
}
.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: #334155;
  font-size: 12px;
}
.calendar-day-header span {
  color: #64748b;
}
.calendar-day-orders {
  display: grid;
  gap: 5px;
}
.order-popover {
  width: min(440px, calc(100vw - 32px));
  padding: 12px;
  background: #fff;
}
.order-popover-grid {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  line-height: 1.35;
}
.order-popover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}
.service-order-items-table {
  overflow-x: auto;
}
.service-order-items-table .quantity-cell {
  width: 90px;
}
.service-order-items-table .money-cell {
  width: 150px;
}
.status-em_atendimento { border-left-color: #d97706; background: #fffbeb; }
.status-concluida { border-left-color: #16a34a; background: #f0fdf4; }
.status-cancelada { border-left-color: #dc2626; background: #fef2f2; }
.status-reagendada { border-left-color: #7c3aed; background: #f5f3ff; }
.urgente {
  box-shadow: inset 0 0 0 2px #dc2626;
}
@media (max-width: 700px) {
  .agenda-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .agenda-date {
    width: 100%;
  }
  .calendar-board {
    overflow-x: auto;
  }
  .calendar-weekdays,
  .calendar-grid {
    min-width: 980px;
  }
}
</style>

<style>
.order-details-popover {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, .18);
}
</style>
