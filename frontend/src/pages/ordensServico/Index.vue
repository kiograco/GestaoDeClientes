<template>
  <q-page padding class="service-orders-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5 text-weight-medium">Ordens de Serviço</div>
        <div class="text-caption text-grey-7">Agenda de visitas, técnicos e histórico operacional</div>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn v-if="podeOperarOrdens" unelevated color="primary" icon="mdi-calendar-plus" label="Nova ordem" @click="abrirOrdem()" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <q-select dense outlined emit-value map-options clearable class="col-12 col-md-3" label="Técnico" v-model="filtros.attendantId" :options="opcoesAtendentes" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Status" v-model="filtros.status" :options="statusOptions" @input="carregarOrdens" />
        <q-select dense outlined clearable class="col-12 col-md-2" label="Prioridade" v-model="filtros.priority" :options="priorityOptions" @input="carregarOrdens" />
        <q-btn flat color="primary" icon="mdi-refresh" class="col-12 col-md-auto" label="Atualizar" @click="carregarTudo" />
      </q-card-section>
    </q-card>

    <div v-if="false && aba === 'dashboard'" class="dashboard-grid q-mb-md">
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
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Por financeiro</div>
          <div v-for="item in dashboardList(dashboard.byFinancialStatus)" :key="item.label" class="metric-row">
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
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Custo por produto usado</div>
          <div v-for="item in dashboardMoneyList(dashboard.productsByCost)" :key="item.label" class="metric-row">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="dashboard-panel dashboard-panel-wide">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">OS mais rentáveis</div>
          <div v-for="item in dashboardProfitabilityList" :key="item.id" class="metric-row metric-row-profit">
            <span>#{{ item.id }} {{ item.title }}<small>{{ item.contactName }}</small></span>
            <strong>{{ formatarMoeda(item.grossProfit) }} <small>{{ item.grossMarginPercent }}%</small></strong>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else-if="aba === 'financeiro'" class="q-mb-md">
      <div class="dashboard-grid q-mb-md">
        <q-card v-for="card in financeiroCards" :key="card.label" flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">{{ card.label }}</div>
            <div class="text-h5 text-weight-medium">{{ card.value }}</div>
          </q-card-section>
        </q-card>
      </div>
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col-12 col-md">
            <div class="text-subtitle1 text-weight-medium">Fechamento mensal</div>
            <div class="text-caption text-grey-7">Recebidos, abertos, vencidos, custos e lucro bruto do mes</div>
          </div>
          <q-input dense outlined type="month" class="col-12 col-md-2" label="Mes" v-model="mesFechamento" @input="carregarFechamentoMensal" />
          <q-btn flat color="primary" icon="mdi-file-delimited-outline" label="CSV" @click="baixarFechamentoMensal" />
          <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarFechamentoMensal" />
        </q-card-section>
        <q-card-section class="dashboard-grid">
          <q-card v-for="card in fechamentoMensalCards" :key="card.label" flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-7">{{ card.label }}</div>
              <div class="text-h6 text-weight-medium">{{ card.value }}</div>
            </q-card-section>
          </q-card>
        </q-card-section>
      </q-card>
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Contas a receber de OS</div>
            <div class="text-caption text-grey-7">Cobranças vencidas, abertas, parciais e pagas</div>
          </div>
          <q-space />
          <q-btn flat color="primary" icon="mdi-file-delimited-outline" label="CSV" @click="baixarRelatorioFinanceiro" />
          <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarTudo" />
        </q-card-section>
        <q-table
          flat
          :data="ordensFinanceiras"
          :columns="colunasFinanceiro"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-financialStatus="props">
            <q-td :props="props">
              <q-badge :color="corStatusFinanceiro(props.row)" :label="rotuloStatusFinanceiro(props.row.financialStatus)" />
            </q-td>
          </template>
          <template v-slot:body-cell-paymentMethod="props">
            <q-td :props="props">
              <q-select
                dense
                borderless
                emit-value
                map-options
                clearable
                :value="props.row.paymentMethod"
                :options="paymentMethodOptions"
                @input="value => atualizarFinanceiroOrdem(props.row, { paymentMethod: value })"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn flat round dense icon="mdi-file-document-edit-outline" color="primary" @click="marcarComoCobrada(props.row)">
                <q-tooltip>Marcar como cobrada</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-cash-check" color="positive" @click="marcarComoPaga(props.row)">
                <q-tooltip>Marcar como paga</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-cash-plus" color="amber-9" @click="registrarPagamentoParcial(props.row)">
                <q-tooltip>Registrar pagamento parcial</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-calendar-edit" color="primary" @click="alterarVencimentoFinanceiro(props.row)">
                <q-tooltip>Alterar vencimento</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-note-edit-outline" color="primary" @click="alterarObservacaoFinanceira(props.row)">
                <q-tooltip>Observação financeira</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-bell-ring-outline" color="deep-orange" @click="enviarLembreteCobranca(props.row)">
                <q-tooltip>Enviar lembrete de cobranca</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
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
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined clearable class="col-12 col-md-3" label="Buscar por nome ou principio ativo" v-model="filtroEstoqueTexto" />
          <q-select dense outlined clearable emit-value map-options class="col-12 col-md-3" label="Categoria" v-model="filtroEstoqueCategoria" :options="productCategoryOptions" />
          <q-select dense outlined clearable class="col-12 col-md-3" label="Praga" v-model="filtroEstoquePraga" :options="opcoesPragasEstoque" />
          <q-select dense outlined clearable class="col-12 col-md-3" label="Fabricante" v-model="filtroEstoqueFabricante" :options="opcoesFabricantesEstoque" />
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
          <template v-slot:body-cell-batchStatus="props">
            <q-td :props="props">
              <q-badge v-if="props.row.lotControlEnabled" :color="corStatusLoteProduto(props.row)" :label="rotuloStatusLoteProduto(props.row)" />
              <span v-else>-</span>
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

    <div v-else-if="aba === 'pragas'" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Cadastro de pragas</div>
            <div class="text-caption text-grey-7">Cadastro central usado por produtos e serviços</div>
          </div>
          <q-space />
          <q-btn unelevated color="primary" icon="mdi-plus" label="Nova praga" @click="abrirPraga()" />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined clearable class="col-12 col-md-4" label="Pesquisar por nome comum ou científico" v-model="filtroPragas" @keyup.enter="carregarPragas" />
          <q-btn flat color="primary" icon="mdi-magnify" label="Pesquisar" @click="carregarPragas" />
        </q-card-section>
        <q-table
          flat
          :data="pragas"
          :columns="colunasPragas"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-display="props">
            <q-td :props="props">{{ rotuloPraga(props.row) }}</q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirPraga(props.row)">
                <q-tooltip>Editar praga</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-delete" color="negative" @click="confirmarExcluirPraga(props.row)">
                <q-tooltip>Excluir praga</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <div v-else-if="aba === 'auditoria' && podeGerenciarEstoque" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Auditoria de estoque</div>
            <div class="text-caption text-grey-7">Eventos críticos de produtos, ajustes e baixas automáticas</div>
          </div>
          <q-space />
          <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarAuditoriaEstoque" />
        </q-card-section>
        <q-table
          flat
          :data="auditoriaEstoque"
          :columns="colunasAuditoriaEstoque"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-badge color="primary" outline :label="formatarAcaoAuditoriaEstoque(props.row.action)" />
            </q-td>
          </template>
          <template v-slot:body-cell-metadata="props">
            <q-td :props="props">
              <div class="audit-metadata">{{ descreverAuditoriaEstoque(props.row) }}</div>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Auditoria financeira</div>
            <div class="text-caption text-grey-7">AlteraÃ§Ãµes em cobranÃ§a, pagamento, vencimento e observaÃ§Ãµes financeiras</div>
          </div>
          <q-space />
          <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarAuditoriaFinanceira" />
        </q-card-section>
        <q-table
          flat
          :data="auditoriaFinanceira"
          :columns="colunasAuditoriaFinanceira"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-badge color="primary" outline :label="formatarAcaoAuditoriaFinanceira(props.row.action)" />
            </q-td>
          </template>
          <template v-slot:body-cell-metadata="props">
            <q-td :props="props">
              <div class="audit-metadata">{{ descreverAuditoriaFinanceira(props.row) }}</div>
            </q-td>
          </template>
        </q-table>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Auditoria de serviços</div>
            <div class="text-caption text-grey-7">Criação, alteração, duplicação e inativação de serviços cadastrados</div>
          </div>
          <q-space />
          <q-btn flat color="primary" icon="mdi-refresh" label="Atualizar" @click="carregarAuditoriaServicos" />
        </q-card-section>
        <q-table
          flat
          :data="auditoriaServicos"
          :columns="colunasAuditoriaFinanceira"
          row-key="id"
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <q-badge color="primary" outline :label="formatarAcaoAuditoriaServico(props.row.action)" />
            </q-td>
          </template>
          <template v-slot:body-cell-metadata="props">
            <q-td :props="props">
              <div class="audit-metadata">{{ descreverAuditoriaServico(props.row) }}</div>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <div v-else-if="aba === 'tipos'" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-medium">Cadastro de serviços</div>
            <div class="text-caption text-grey-7">Serviços padronizados para OS, garantias e relatórios técnicos</div>
          </div>
          <q-space />
          <q-btn unelevated color="primary" icon="mdi-plus" label="Novo serviço" @click="abrirTipoServico()" />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined clearable class="col-12 col-md-3" label="Pesquisar por nome" v-model="filtrosTiposServico.search" @keyup.enter="carregarTiposServico" />
          <q-select dense outlined clearable emit-value map-options class="col-12 col-md-3" label="Categoria" v-model="filtrosTiposServico.category" :options="serviceCategoryOptions" @input="carregarTiposServico" />
          <q-select dense outlined clearable emit-value map-options class="col-12 col-md-3" label="Praga" v-model="filtrosTiposServico.pest" :options="opcoesPragasNome" @input="carregarTiposServico" />
          <q-select dense outlined clearable emit-value map-options class="col-12 col-md-2" label="Ambiente" v-model="filtrosTiposServico.environment" :options="environmentOptions" @input="carregarTiposServico" />
          <q-btn flat color="primary" icon="mdi-magnify" class="col-12 col-md-auto" label="Filtrar" @click="carregarTiposServico" />
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
          <template v-slot:body-cell-categories="props">
            <q-td :props="props">
              <q-badge v-for="category in props.row.categories || []" :key="category" outline color="primary" class="q-mr-xs q-mb-xs" :label="rotuloOpcao(serviceCategoryOptions, category)" />
            </q-td>
          </template>
          <template v-slot:body-cell-pests="props">
            <q-td :props="props">
              <span>{{ (props.row.pests || []).map(item => rotuloPraga(item.pest)).filter(Boolean).join(', ') || '-' }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn flat round dense icon="mdi-pencil" color="primary" @click="abrirTipoServico(props.row)">
                <q-tooltip>Editar serviço</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-content-copy" color="primary" @click="duplicarTipoServico(props.row)">
                <q-tooltip>Duplicar serviço</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="mdi-delete" color="negative" @click="confirmarExcluirTipoServico(props.row)">
                <q-tooltip>Inativar serviço</q-tooltip>
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
                @contextmenu="podeOperarOrdens && prepararMenuHorario(linha, hour)"
                @dblclick="podeOperarOrdens && reservarHorario(linha, hour)"
                @dragover.prevent
                @drop="podeOperarOrdens && soltarOrdem(linha, hour)"
              >
                <q-menu v-if="podeOperarOrdens" context-menu>
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
                :draggable="podeOperarOrdens"
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
                      <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-pencil" label="Editar" v-close-popup @click="abrirOrdem(ordem)" />
                      <q-btn v-if="podeOperarOrdens" dense flat color="amber-9" icon="mdi-play" label="Iniciar" v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')" />
                      <q-btn v-if="podeOperarOrdens" dense flat color="positive" icon="mdi-check" label="Concluir" v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')" />
                      <q-btn v-if="podeOperarOrdens" dense flat color="negative" icon="mdi-cancel" label="Cancelar" v-close-popup @click="cancelarOrdem(ordem)" />
                      <q-btn dense flat color="primary" icon="mdi-file-pdf-box" label="PDF cliente" v-close-popup @click="abrirPdfOrdem(ordem, false)" />
                      <q-btn v-if="podeVerObservacaoInterna" dense flat color="primary" icon="mdi-file-document-alert-outline" label="PDF interno" v-close-popup @click="abrirPdfOrdem(ordem, true)" />
                      <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-send" label="Notificar" v-close-popup @click="abrirNotificacao(ordem)" />
                      <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-email-sync-outline" label="Reenviar E-mail" v-close-popup @click="abrirNotificacao(ordem, true)" />
                    </div>
                    <q-separator class="q-my-sm" />
                    <div v-if="podeOperarOrdens" class="text-caption text-grey-7 q-mb-xs">Trocar técnico</div>
                    <div v-if="podeOperarOrdens" class="order-popover-actions">
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
                <q-menu v-if="podeOperarOrdens" context-menu>
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
                          <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-pencil" label="Editar" v-close-popup @click="abrirOrdem(ordem)" />
                          <q-btn v-if="podeOperarOrdens" dense flat color="amber-9" icon="mdi-play" label="Iniciar" v-close-popup @click="alterarStatusOrdem(ordem, 'em_atendimento')" />
                          <q-btn v-if="podeOperarOrdens" dense flat color="positive" icon="mdi-check" label="Concluir" v-close-popup @click="alterarStatusOrdem(ordem, 'concluida')" />
                          <q-btn v-if="podeOperarOrdens" dense flat color="negative" icon="mdi-cancel" label="Cancelar" v-close-popup @click="cancelarOrdem(ordem)" />
                          <q-btn dense flat color="primary" icon="mdi-file-pdf-box" label="PDF cliente" v-close-popup @click="abrirPdfOrdem(ordem, false)" />
                          <q-btn v-if="podeVerObservacaoInterna" dense flat color="primary" icon="mdi-file-document-alert-outline" label="PDF interno" v-close-popup @click="abrirPdfOrdem(ordem, true)" />
                          <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-send" label="Notificar" v-close-popup @click="abrirNotificacao(ordem)" />
                          <q-btn v-if="podeOperarOrdens" dense flat color="primary" icon="mdi-email-sync-outline" label="Reenviar E-mail" v-close-popup @click="abrirNotificacao(ordem, true)" />
                        </div>
                        <q-separator class="q-my-sm" />
                        <div v-if="podeOperarOrdens" class="text-caption text-grey-7 q-mb-xs">Trocar tecnico</div>
                        <div v-if="podeOperarOrdens" class="order-popover-actions">
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
            @focus="carregarClientesServico"
            @filter="filtrarClientes"
            @input="preencherDadosClienteOrdem"
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
            dense outlined emit-value map-options
            class="col-12 col-md-6"
            label="Tipo de serviço"
            v-model="form.attendanceTypeId"
            :options="opcoesTiposAtendimento"
            @input="selecionarTipoAtendimentoOrdem"
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
          <q-input dense outlined class="col-12 col-md-6" label="Complemento / Referência" v-model="form.addressComplement" />
          <q-input dense outlined class="col-12 col-md-5" label="Cidade" v-model="form.city" />
          <q-input dense outlined maxlength="2" class="col-12 col-md-2" label="UF" v-model="form.state" />
          <q-input dense outlined mask="#####-###" class="col-12 col-md-3" label="CEP" v-model="form.zipCode" />
          <q-input dense outlined type="textarea" class="col-12" label="Descrição" v-model="form.description" />
          <div class="col-12">
            <q-separator class="q-my-sm" />
            <div class="text-subtitle1 text-weight-medium">Financeiro</div>
          </div>
          <q-select
            dense outlined emit-value map-options
            class="col-12 col-md-3"
            label="Status financeiro"
            v-model="form.financialStatus"
            :options="financialStatusOptions"
          />
          <q-select
            dense outlined emit-value map-options clearable
            class="col-12 col-md-3"
            label="Forma de pagamento"
            v-model="form.paymentMethod"
            :options="paymentMethodOptions"
          />
          <q-input
            dense outlined
            class="col-12 col-md-3"
            label="Valor cobrado"
            v-model="form.chargedAmount"
            inputmode="decimal"
            @blur="form.chargedAmount = formatarMoedaCampo(form.chargedAmount)"
          />
          <q-input
            dense outlined
            class="col-12 col-md-3"
            label="Valor pago"
            v-model="form.paidAmount"
            inputmode="decimal"
            @blur="form.paidAmount = formatarMoedaCampo(form.paidAmount)"
          />
          <q-input dense outlined type="date" class="col-12 col-md-3" label="Vencimento" v-model="form.paymentDueDate" />
          <q-input dense outlined type="date" class="col-12 col-md-3" label="Pagamento em" v-model="form.paidAt" />
          <q-input dense outlined type="textarea" class="col-12 col-md-6" label="Observação financeira" v-model="form.financialObservation" />
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
                dense outlined clearable emit-value map-options
                class="col-12 col-md-2"
                label="Praga"
                v-model="form.pestTarget"
                :options="opcoesPragasNome"
              />
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
                    <div v-if="item.itemType === 'product'" class="row q-col-gutter-xs">
                      <q-select dense outlined clearable class="col-12 col-md-3" label="Lote" v-model="item.inventoryBatchId" emit-value map-options :options="opcoesLotesProdutoOrdem(item.inventoryItemId)" />
                      <q-select dense outlined clearable emit-value map-options class="col-12 col-md-3" label="Praga tratada" v-model="item.pestTarget" :options="opcoesPragasNome" @input="aplicarRecomendacaoProduto(item)" />
                      <q-select dense outlined clearable emit-value map-options class="col-12 col-md-3" label="Metodo" v-model="item.applicationMethod" :options="opcoesMetodosProdutoOrdem(item.inventoryItemId)" />
                      <q-input dense outlined class="col-12 col-md-3" label="Diluicao" v-model="item.dilutionUsed" />
                      <q-input dense outlined type="textarea" class="col-12" label="Observacoes tecnicas" v-model="item.technicalObservation" />
                    </div>
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
      <q-card style="width: 1040px; max-width: 95vw">
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
        <q-card-section class="row q-col-gutter-sm">
          <div class="col-12 q-mt-sm text-subtitle2">Informacoes tecnicas</div>
          <q-select dense outlined emit-value map-options class="col-12 col-md-3" label="Categoria" v-model="itemEstoque.productCategory" :options="productCategoryOptions" />
          <q-input dense outlined class="col-12 col-md-3" label="Principio ativo" v-model="itemEstoque.activeIngredient" />
          <q-input dense outlined class="col-12 col-md-3" label="Grupo quimico" v-model="itemEstoque.chemicalGroup" />
          <q-input dense outlined class="col-12 col-md-3" label="Registro MS / ANVISA" v-model="itemEstoque.healthRegistration" />
          <q-input dense outlined class="col-12 col-md-3" label="Fabricante" v-model="itemEstoque.manufacturer" />
          <q-input dense outlined class="col-12 col-md-3" label="Codigo interno" v-model="itemEstoque.internalCode" />
          <q-input dense outlined class="col-12 col-md-3" label="Codigo de barras" v-model="itemEstoque.barcode" />
          <q-toggle class="col-12 col-md-3" label="Controle de lote" v-model="itemEstoque.lotControlEnabled" />
          <q-toggle class="col-12 col-md-3" label="Exibir lote na OS" v-model="itemEstoque.showLotOnOrder" />
          <q-toggle class="col-12 col-md-3" label="Exibir vencimento na OS" v-model="itemEstoque.showLotExpirationOnOrder" />
          <q-select dense outlined multiple emit-value map-options class="col-12 col-md-3" label="Diluentes" v-model="itemEstoque.diluentTypes" :options="diluentOptions" />
          <q-select dense outlined multiple emit-value map-options class="col-12 col-md-3" label="Metodos de aplicacao" v-model="itemEstoque.applicationMethods" :options="applicationMethodOptions" />
          <q-select dense outlined multiple emit-value map-options class="col-12 col-md-6" label="Pragas atendidas" v-model="itemEstoque.pestIds" :options="opcoesPragas" />
          <q-toggle class="col-12 col-md-3" label="Exibir metodo na OS" v-model="itemEstoque.showApplicationMethodOnOrder" />
          <div class="col-12 q-mt-sm row items-center">
            <div class="text-subtitle2">Lotes</div>
            <q-space />
            <q-btn flat dense color="primary" icon="mdi-plus" label="Adicionar lote" @click="adicionarLoteEstoque" />
          </div>
          <q-card v-for="(lote, index) in itemEstoque.batches" :key="`lote-${index}`" flat bordered class="col-12">
            <q-card-section class="row q-col-gutter-sm">
              <q-input dense outlined class="col-12 col-md-3" label="Numero do lote" v-model="lote.batchNumber" />
              <q-input dense outlined type="date" class="col-6 col-md-2" label="Fabricacao" v-model="lote.manufacturingDate" />
              <q-input dense outlined type="date" class="col-6 col-md-2" label="Vencimento" v-model="lote.expirationDate" />
              <q-input dense outlined type="number" min="0" step="1" class="col-6 col-md-2" label="Qtd. disponivel" v-model.number="lote.quantity" />
              <q-input dense outlined class="col-12 col-md-2" label="Fornecedor" v-model="lote.supplier" />
              <q-btn flat round color="negative" icon="mdi-delete" class="col-auto" @click="removerLoteEstoque(index)" />
              <q-input dense outlined type="textarea" class="col-12" label="Observacoes" v-model="lote.observation" />
            </q-card-section>
          </q-card>
          <div class="col-12 q-mt-sm row items-center">
            <div class="text-subtitle2">Recomendacoes por praga</div>
            <q-space />
            <q-btn flat dense color="primary" icon="mdi-plus" label="Adicionar recomendacao" @click="adicionarRecomendacaoEstoque" />
          </div>
          <q-card v-for="(rec, index) in itemEstoque.pestRecommendations" :key="`rec-${index}`" flat bordered class="col-12">
            <q-card-section class="row q-col-gutter-sm">
              <q-select dense outlined emit-value map-options class="col-12 col-md-3" label="Praga" v-model="rec.pestId" :options="opcoesPragas" />
              <q-input dense outlined type="number" min="0" step="0.001" class="col-6 col-md-2" label="Qtd. produto" v-model.number="rec.productQuantity" />
              <q-input dense outlined type="number" min="0" step="0.001" class="col-6 col-md-2" label="Qtd. diluente" v-model.number="rec.diluentQuantity" />
              <q-input dense outlined class="col-6 col-md-2" label="Unidade" v-model="rec.unit" />
              <q-input dense outlined class="col-6 col-md-2" label="Tempo de acao" v-model="rec.actionTime" />
              <q-btn flat round color="negative" icon="mdi-delete" class="col-auto" @click="removerRecomendacaoEstoque(index)" />
              <q-input dense outlined type="textarea" class="col-12" label="Observacoes tecnicas" v-model="rec.technicalObservation" />
            </q-card-section>
          </q-card>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarEstoque" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalTipoServico">
      <q-card style="width: 1100px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ tipoServico.id ? 'Editar serviço' : 'Novo serviço' }}</div>
          <div v-if="tipoServico.code" class="text-caption text-grey-7">Código {{ tipoServico.code }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12 col-md-6" label="Nome do serviço" v-model="tipoServico.name" />
          <q-input dense outlined readonly class="col-12 col-md-2" label="Código" v-model="tipoServico.code" placeholder="Automático" />
          <q-input dense outlined class="col-12 col-md-4" inputmode="decimal" label="Preço padrão" v-model="tipoServico.defaultPrice" prefix="R$" @blur="normalizarMoedaTipoServico" />
          <q-input dense outlined class="col-12" type="textarea" label="Descrição resumida" v-model="tipoServico.description" />
          <q-input dense outlined class="col-12" type="textarea" label="Descrição técnica completa" v-model="tipoServico.technicalDescription" />
          <q-toggle class="col-12" label="Ativo" v-model="tipoServico.active" />

          <div class="col-12 q-mt-sm text-subtitle2">Classificação do serviço</div>
          <q-option-group class="col-12 service-option-grid" type="checkbox" v-model="tipoServico.categories" :options="serviceCategoryOptions" />

          <div class="col-12 q-mt-sm row items-center">
            <div class="text-subtitle2">Pragas atendidas</div>
          </div>
          <q-select dense outlined multiple emit-value map-options class="col-12" label="Pragas atendidas" v-model="tipoServico.pestIds" :options="opcoesPragas" />

          <div class="col-12 q-mt-sm text-subtitle2">Garantia</div>
          <q-toggle class="col-12 col-md-3" label="Possui garantia?" v-model="tipoServico.warranty.hasWarranty" />
          <q-input v-if="tipoServico.warranty.hasWarranty" dense outlined type="number" min="0" class="col-6 col-md-2" label="Quantidade" v-model.number="tipoServico.warranty.quantity" />
          <q-select v-if="tipoServico.warranty.hasWarranty" dense outlined emit-value map-options class="col-6 col-md-2" label="Unidade" v-model="tipoServico.warranty.unit" :options="warrantyUnitOptions" />
          <q-input v-if="tipoServico.warranty.hasWarranty" dense outlined class="col-12 col-md-5" label="Observação da garantia" v-model="tipoServico.warranty.observation" />
          <q-input v-if="tipoServico.warranty.hasWarranty" dense outlined type="textarea" class="col-12" label="Regras da garantia" v-model="tipoServico.warranty.rules" />

          <div class="col-12 q-mt-sm text-subtitle2">Tipo de ambiente</div>
          <q-option-group class="col-12 service-option-grid" type="checkbox" v-model="tipoServico.environments" :options="environmentOptions" />

          <div class="col-12 q-mt-sm text-subtitle2">Método de aplicação</div>
          <q-option-group class="col-12 service-option-grid" type="checkbox" v-model="tipoServico.methods" :options="serviceMethodOptions" />

          <div class="col-12 q-mt-sm row items-center">
            <div class="text-subtitle2">Produtos utilizados</div>
            <q-space />
            <q-btn flat dense color="primary" icon="mdi-plus" label="Adicionar produto" @click="adicionarProdutoServico" />
          </div>
          <div v-for="(product, index) in tipoServico.products" :key="`service-product-${index}`" class="col-12 row q-col-gutter-sm items-center">
            <q-select dense outlined emit-value map-options class="col-12 col-md-5" label="Produto" v-model="product.inventoryItemId" :options="opcoesProdutosServico" />
            <div class="col-12 col-md-2 text-caption">{{ detalheProdutoServico(product.inventoryItemId, 'activeIngredient') || 'Sem princípio ativo' }}</div>
            <div class="col-12 col-md-2 text-caption">{{ detalheProdutoServico(product.inventoryItemId, 'chemicalGroup') || 'Sem grupo químico' }}</div>
            <q-input dense outlined type="number" min="0" step="0.001" class="col-8 col-md-2" label="Consumo médio" v-model.number="product.averageConsumption" />
            <q-btn flat round color="negative" icon="mdi-delete" class="col-auto" @click="removerProdutoServico(index)" />
          </div>

          <div class="col-12 q-mt-sm text-subtitle2">Informações operacionais</div>
          <q-input dense outlined class="col-12 col-md-3" label="Tempo médio de execução" v-model="tipoServico.averageExecutionTime" />
          <q-input dense outlined type="number" min="1" class="col-12 col-md-3" label="Técnicos recomendados" v-model.number="tipoServico.recommendedTechnicians" />
          <q-toggle class="col-12 col-md-2" label="Necessita retorno?" v-model="tipoServico.needsReturn" />
          <q-input dense outlined type="number" min="0" class="col-6 col-md-2" label="Qtd. retornos" v-model.number="tipoServico.returnQuantity" />
          <q-input dense outlined class="col-6 col-md-2" label="Intervalo" v-model="tipoServico.returnInterval" />

          <q-input dense outlined type="textarea" class="col-12" label="Texto padrão da Ordem de Serviço" v-model="tipoServico.orderDefaultText" />
          <q-input dense outlined type="textarea" class="col-12" label="Recomendações ao cliente" v-model="tipoServico.customerRecommendations" />
          <q-input dense outlined type="textarea" class="col-12" label="Observações internas" v-model="tipoServico.internalObservation" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarTipoServico" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalPraga">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">{{ praga.id ? 'Editar praga' : 'Nova praga' }}</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <q-input dense outlined class="col-12" label="Nome comum" v-model="praga.commonName" />
          <q-input dense outlined class="col-12" label="Nome científico" v-model="praga.scientificName" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" color="primary" :loading="salvando" @click="salvarPraga" />
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
      :clientId="selectedClientId"
      @saved="clienteSalvo"
    />
  </q-page>
</template>

<script>
import { socketIO } from 'src/utils/socket'
import { ListarClientes, ObterCliente } from 'src/service/clientes'
import { ListarCadastroBase } from 'src/service/cadastrosBase'
import { ListarTiposAtendimento } from 'src/service/tiposAtendimento'
import ClienteModal from 'src/pages/clientes/ClienteModal'
import {
  ListarAtendentesServico,
  CriarAtendenteServico,
  AlterarAtendenteServico,
  ListarEstoqueServico,
  ListarEstoqueBaixoServico,
  ListarMovimentacoesEstoqueServico,
  RelatorioConsumoEstoqueServico,
  RelatorioLotesEstoqueServico,
  RelatorioCustosEstoqueServico,
  ListarAuditoriaEstoqueServico,
  ListarAuditoriaFinanceiraServico,
  ListarAuditoriaTiposServico,
  CriarItemEstoqueServico,
  AlterarItemEstoqueServico,
  ExcluirItemEstoqueServico,
  AjustarItemEstoqueServico,
  ListarPragasServico,
  CriarPragaServico,
  AlterarPragaServico,
  ExcluirPragaServico,
  ListarTiposServico,
  CriarTipoServico,
  AlterarTipoServico,
  DuplicarTipoServico,
  ExcluirTipoServico,
  ListarOrdensServico,
  DashboardOrdensServico,
  BaixarRelatorioFinanceiroOrdensServico,
  FechamentoMensalOrdensServico,
  BaixarFechamentoMensalOrdensServico,
  ObterOrdemServico,
  CriarOrdemServico,
  AlterarOrdemServico,
  AlterarParcialOrdemServico,
  AlterarOcorrenciaOrdemServico,
  DocumentoOrdemServico,
  DocumentoInternoOrdemServico,
  NotificarOrdemServico,
  EnviarLembreteCobrancaOrdemServico
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
  attendanceTypeId: null,
  serviceType: '',
  pestTarget: '',
  priority: 'baixa',
  status: 'rascunho',
  financialStatus: 'nao_cobrado',
  paymentMethod: null,
  chargedAmount: '0,00',
  paidAmount: '0,00',
  paymentDueDate: '',
  paidAt: '',
  financialObservation: '',
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
  addressComplement: '',
  city: '',
  state: '',
  zipCode: '',
  publicObservation: '',
  internalObservation: '',
  items: []
})

const emptyInventoryItem = () => ({
  active: true,
  unit: 'unidade',
  productCategory: 'outro',
  quantity: 0,
  minQuantity: 0,
  salePrice: '0,00',
  costPrice: '0,00',
  lotControlEnabled: false,
  showLotOnOrder: true,
  showLotExpirationOnOrder: true,
  diluentTypes: [],
  applicationMethods: [],
  pestIds: [],
  showApplicationMethodOnOrder: true,
  batches: [],
  pestRecommendations: [],
  printSettings: {
    commercialName: true,
    activeIngredient: true,
    chemicalGroup: true,
    healthRegistration: true,
    lotNumber: true,
    lotExpiration: true,
    applicationMethod: true,
    dilution: true,
    technicalObservation: true
  }
})

const emptyServiceType = () => ({
  active: true,
  defaultPrice: '0,00',
  code: '',
  name: '',
  description: '',
  technicalDescription: '',
  categories: [],
  pestIds: [],
  environments: [],
  methods: [],
  products: [],
  warranty: {
    hasWarranty: false,
    quantity: 30,
    unit: 'dias',
    observation: '',
    rules: ''
  },
  averageExecutionTime: '',
  recommendedTechnicians: 1,
  needsReturn: false,
  returnQuantity: 0,
  returnInterval: '',
  orderDefaultText: '',
  customerRecommendations: '',
  internalObservation: ''
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
      mesFechamento: localDateInput().slice(0, 7),
      modalOrdem: false,
      modalAtendente: false,
      modalEstoque: false,
      modalAjusteEstoque: false,
      modalTipoServico: false,
      modalPraga: false,
      modalNotificacao: false,
      modalCliente: false,
      selectedClientId: null,
      form: emptyForm(),
      atendente: { active: true },
      itemEstoque: emptyInventoryItem(),
      praga: { commonName: '', scientificName: '' },
      ajusteEstoque: { item: null, movementType: 'entry', quantity: 0, observation: '' },
      tipoServico: emptyServiceType(),
      filtrosTiposServico: {
        search: '',
        category: null,
        pest: '',
        environment: null
      },
      servicoOrdemSelecionado: null,
      produtoOrdemSelecionado: null,
      notificacao: { channels: ['internal'], message: '' },
      ordens: [],
      atendentes: [],
      estoque: [],
      pragas: [],
      filtroPragas: '',
      baixoEstoque: [],
      filtrarEstoqueBaixo: false,
      filtroEstoqueTexto: '',
      filtroEstoqueCategoria: null,
      filtroEstoquePraga: null,
      filtroEstoqueFabricante: null,
      movimentacoesEstoque: [],
      relatorioConsumoEstoque: {},
      relatorioLotesEstoque: {},
      relatorioCustosEstoque: {},
      auditoriaEstoque: [],
      auditoriaFinanceira: [],
      auditoriaServicos: [],
      tiposServico: [],
      tiposAtendimento: [],
      clientes: [],
      ordemSelecionada: null,
      ordemArrastada: null,
      contextHorario: null,
      dashboard: {},
      fechamentoMensal: {},
      filtros: {},
      priorityOptions: ['baixa', 'media', 'alta', 'urgente'],
      statusOptions: ['rascunho', 'agendada', 'em_atendimento', 'concluida', 'cancelada', 'reagendada'],
      financialStatusOptions: [
        { label: 'Não cobrado', value: 'nao_cobrado' },
        { label: 'Cobrado', value: 'cobrado' },
        { label: 'Pago', value: 'pago' },
        { label: 'Parcial', value: 'parcial' },
        { label: 'Cancelado', value: 'cancelado' }
      ],
      paymentMethodOptions: [],
      financialViewOptions: [
        { label: 'Em aberto', value: 'open' },
        { label: 'Pagas', value: 'paid' },
        { label: 'Parciais', value: 'partial' },
        { label: 'Vencidas', value: 'overdue' },
        { label: 'A vencer', value: 'dueSoon' }
      ],
      recurrenceOptions: [
        { label: 'Dia fixo todo mês', value: 'monthly_fixed_day' },
        { label: 'Intervalo em dias', value: 'custom_interval' }
      ],
      timeOptions: Array.from({ length: 48 }, (_, index) => {
        const hour = Math.floor(index / 2)
        const minutes = index % 2 === 0 ? '00' : '30'
        const value = `${String(hour).padStart(2, '0')}:${minutes}`
        return { label: value, value }
      }),
      notificationOptions: [
        { label: 'Interna', value: 'internal' },
        { label: 'E-mail', value: 'email' },
        { label: 'WhatsApp', value: 'whatsapp' }
      ],
      unitOptions: [
        { label: 'ml', value: 'ml' },
        { label: 'Litro', value: 'litro' },
        { label: 'Grama', value: 'grama' },
        { label: 'kg', value: 'kg' },
        { label: 'Unidade', value: 'unidade' },
        { label: 'Litros', value: 'litros' }
      ],
      productCategoryOptions: [
        { label: 'Inseticida', value: 'inseticida' },
        { label: 'Raticida', value: 'raticida' },
        { label: 'Cupinicida', value: 'cupinicida' },
        { label: 'Desinfetante', value: 'desinfetante' },
        { label: 'Repelente', value: 'repelente' },
        { label: 'Larvicida', value: 'larvicida' },
        { label: 'Outro', value: 'outro' }
      ],
      diluentOptions: [
        { label: 'Agua', value: 'agua' },
        { label: 'Oleo Mineral', value: 'oleo_mineral' },
        { label: 'Iso Parafina', value: 'iso_parafina' },
        { label: 'Pronto Uso', value: 'pronto_uso' },
        { label: 'Outro', value: 'outro' }
      ],
      applicationMethodOptions: [],
      serviceMethodOptions: [],
      serviceCategoryOptions: [
        { label: 'Controle de Insetos', value: 'controle_insetos' },
        { label: 'Controle de Roedores', value: 'controle_roedores' },
        { label: 'Controle de Pombos', value: 'controle_pombos' },
        { label: 'Controle de Cupins', value: 'controle_cupins' },
        { label: 'Controle de Escorpiões', value: 'controle_escorpioes' },
        { label: 'Controle de Aranhas', value: 'controle_aranhas' },
        { label: 'Controle de Baratas', value: 'controle_baratas' },
        { label: 'Controle de Formigas', value: 'controle_formigas' },
        { label: 'Controle de Mosquitos', value: 'controle_mosquitos' },
        { label: 'Controle de Pulgas', value: 'controle_pulgas' },
        { label: 'Controle de Carrapatos', value: 'controle_carrapatos' },
        { label: 'Outros', value: 'outros' }
      ],
      environmentOptions: [
        { label: 'Residencial', value: 'residencial' },
        { label: 'Apartamento', value: 'apartamento' },
        { label: 'Condomínio', value: 'condominio' },
        { label: 'Comercial', value: 'comercial' },
        { label: 'Industrial', value: 'industrial' },
        { label: 'Hospitalar', value: 'hospitalar' },
        { label: 'Escolar', value: 'escolar' },
        { label: 'Alimentício', value: 'alimenticio' },
        { label: 'Restaurante', value: 'restaurante' },
        { label: 'Hotel', value: 'hotel' },
        { label: 'Escritório', value: 'escritorio' },
        { label: 'Depósito', value: 'deposito' },
        { label: 'Área Externa', value: 'area_externa' },
        { label: 'Área Rural', value: 'area_rural' },
        { label: 'Outros', value: 'outros' }
      ],
      warrantyUnitOptions: [
        { label: 'Dias', value: 'dias' },
        { label: 'Meses', value: 'meses' },
        { label: 'Anos', value: 'anos' }
      ],
      movementOptions: [
        { label: 'Entrada', value: 'entry' },
        { label: 'Saída', value: 'exit' },
        { label: 'Definir saldo', value: 'set' }
      ],
      colunasEstoque: [
        { name: 'name', label: 'Produto', field: 'name', align: 'left', sortable: true },
        { name: 'productCategory', label: 'Categoria', field: 'productCategory', align: 'left', sortable: true },
        { name: 'activeIngredient', label: 'Principio ativo', field: 'activeIngredient', align: 'left', sortable: true },
        { name: 'manufacturer', label: 'Fabricante', field: 'manufacturer', align: 'left', sortable: true },
        { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
        { name: 'quantity', label: 'Saldo', field: 'quantity', align: 'left', sortable: true },
        { name: 'batchStatus', label: 'Lotes', field: 'batchStatus', align: 'left' },
        { name: 'salePrice', label: 'Preço venda', field: row => this.formatarMoeda(row.salePrice), align: 'right', sortable: true },
        { name: 'active', label: 'Status', field: 'active', align: 'center' },
        { name: 'actions', label: '', field: 'actions', align: 'right' }
      ],
      colunasPragas: [
        { name: 'display', label: 'Praga', field: 'display', align: 'left', sortable: true },
        { name: 'commonName', label: 'Nome comum', field: 'commonName', align: 'left', sortable: true },
        { name: 'scientificName', label: 'Nome científico', field: 'scientificName', align: 'left', sortable: true },
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
      colunasAuditoriaEstoque: [
        { name: 'createdAt', label: 'Data', field: row => this.formatarData(row.createdAt), align: 'left', sortable: true },
        { name: 'action', label: 'Evento', field: 'action', align: 'left', sortable: true },
        { name: 'resourceId', label: 'Recurso', field: row => row.resourceId ? `#${row.resourceId}` : '-', align: 'left' },
        { name: 'user', label: 'Usuário', field: row => row.user ? row.user.name : '-', align: 'left' },
        { name: 'ip', label: 'IP', field: row => row.ip || '-', align: 'left' },
        { name: 'metadata', label: 'Detalhes', field: 'metadata', align: 'left' }
      ],
      colunasAuditoriaFinanceira: [
        { name: 'createdAt', label: 'Data', field: row => this.formatarData(row.createdAt), align: 'left', sortable: true },
        { name: 'action', label: 'Evento', field: 'action', align: 'left', sortable: true },
        { name: 'resourceId', label: 'OS', field: row => row.resourceId ? `#${row.resourceId}` : '-', align: 'left' },
        { name: 'user', label: 'Usuario', field: row => row.user ? row.user.name : '-', align: 'left' },
        { name: 'ip', label: 'IP', field: row => row.ip || '-', align: 'left' },
        { name: 'metadata', label: 'Detalhes', field: 'metadata', align: 'left' }
      ],
      colunasFinanceiro: [
        { name: 'id', label: 'OS', field: row => `#${row.id}`, align: 'left', sortable: true },
        { name: 'customer', label: 'Cliente', field: row => row.contact ? row.contact.name : '-', align: 'left', sortable: true },
        { name: 'title', label: 'Serviço', field: 'title', align: 'left', sortable: true },
        { name: 'financialStatus', label: 'Status', field: 'financialStatus', align: 'center', sortable: true },
        { name: 'paymentMethod', label: 'Forma', field: row => this.rotuloFormaPagamento(row.paymentMethod), align: 'left', sortable: true },
        { name: 'chargedAmount', label: 'Cobrado', field: row => this.formatarMoeda(row.chargedAmount), align: 'right', sortable: true },
        { name: 'paidAmount', label: 'Pago', field: row => this.formatarMoeda(row.paidAmount), align: 'right', sortable: true },
        { name: 'openAmount', label: 'Aberto', field: row => this.formatarMoeda(this.valorAbertoOrdem(row)), align: 'right', sortable: true },
        { name: 'paymentDueDate', label: 'Vencimento', field: row => this.formatarDataCurta(row.paymentDueDate), align: 'left', sortable: true },
        { name: 'actions', label: '', field: 'actions', align: 'right' }
      ],
      colunasTiposServico: [
        { name: 'code', label: 'Código', field: row => row.code || '-', align: 'left', sortable: true },
        { name: 'name', label: 'Serviço', field: 'name', align: 'left', sortable: true },
        { name: 'categories', label: 'Categorias', field: 'categories', align: 'left' },
        { name: 'pests', label: 'Pragas', field: 'pests', align: 'left' },
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
    opcoesTiposAtendimento () {
      return this.tiposAtendimento
        .filter(item => item.isActive)
        .map(item => ({ label: item.name, value: item.id, name: item.name }))
    },
    opcoesTiposServicoOrdem () {
      return this.tiposServico
        .filter(item => item.active)
        .map(item => ({ label: `${item.name} - ${this.formatarMoeda(item.defaultPrice)}`, value: item.id }))
    },
    opcoesProdutosOrdem () {
      return this.estoque
        .filter(item => item.active)
        .filter(item => !this.form.pestTarget || this.produtoRecomendadoParaPraga(item, this.form.pestTarget))
        .map(item => ({ label: `${item.name} - ${this.formatarMoeda(item.salePrice)}`, value: item.id }))
    },
    opcoesProdutosServico () {
      return this.estoque
        .filter(item => item.active)
        .map(item => ({ label: item.name, value: item.id }))
    },
    opcoesPragas () {
      return this.pragas.map(item => ({
        label: this.rotuloPraga(item),
        value: item.id
      }))
    },
    opcoesPragasNome () {
      return this.pragas.map(item => ({
        label: this.rotuloPraga(item),
        value: item.commonName
      }))
    },
    opcoesFabricantesEstoque () {
      return [...new Set(this.estoque.map(item => item.manufacturer).filter(Boolean))]
    },
    opcoesPragasEstoque () {
      return this.opcoesPragasNome
    },
    estoqueFiltrado () {
      let rows = this.estoque
      const texto = String(this.filtroEstoqueTexto || '').toLowerCase().trim()
      if (texto) {
        rows = rows.filter(item =>
          [item.name, item.activeIngredient, item.internalCode, item.sku]
            .some(value => String(value || '').toLowerCase().includes(texto))
        )
      }
      if (this.filtroEstoqueCategoria) rows = rows.filter(item => item.productCategory === this.filtroEstoqueCategoria)
      if (this.filtroEstoqueFabricante) rows = rows.filter(item => item.manufacturer === this.filtroEstoqueFabricante)
      if (this.filtroEstoquePraga) rows = rows.filter(item => this.produtoRecomendadoParaPraga(item, this.filtroEstoquePraga))
      if (!this.filtrarEstoqueBaixo) return rows
      const baixoEstoqueIds = new Set(this.baixoEstoque.map(item => item.id))
      return rows.filter(item => baixoEstoqueIds.has(item.id))
    },
    ordensFinanceiras () {
      return [...this.ordens].sort((a, b) => {
        const aDue = a.paymentDueDate ? new Date(a.paymentDueDate).getTime() : Number.MAX_SAFE_INTEGER
        const bDue = b.paymentDueDate ? new Date(b.paymentDueDate).getTime() : Number.MAX_SAFE_INTEGER
        return aDue - bDue
      })
    },
    resumoFinanceiroLocal () {
      return this.ordensFinanceiras.reduce((acc, ordem) => {
        const charged = this.parseMoeda(ordem.chargedAmount) || 0
        const paid = this.parseMoeda(ordem.paidAmount) || 0
        const open = Math.max(0, charged - paid)
        const isPaid = ordem.financialStatus === 'pago'
        const isCanceled = ordem.financialStatus === 'cancelado'
        const isOverdue = !isPaid && !isCanceled && ordem.paymentDueDate && new Date(ordem.paymentDueDate) < new Date()
        acc.open += !isPaid && !isCanceled ? open : 0
        acc.received += paid
        acc.overdue += isOverdue ? open : 0
        acc.overdueCount += isOverdue ? 1 : 0
        acc.dueSoon += !isPaid && !isCanceled && !isOverdue ? open : 0
        return acc
      }, { open: 0, received: 0, overdue: 0, overdueCount: 0, dueSoon: 0 })
    },
    financeiroCards () {
      return [
        { label: 'Em aberto', value: this.formatarMoeda(this.resumoFinanceiroLocal.open) },
        { label: 'Vencido', value: this.formatarMoeda(this.resumoFinanceiroLocal.overdue) },
        { label: 'A vencer', value: this.formatarMoeda(this.resumoFinanceiroLocal.dueSoon) },
        { label: 'Recebido', value: this.formatarMoeda(this.resumoFinanceiroLocal.received) },
        { label: 'Inadimplentes', value: this.resumoFinanceiroLocal.overdueCount }
      ]
    },
    fechamentoMensalCards () {
      const summary = this.fechamentoMensal.summary || {}
      return [
        { label: 'Recebido no mes', value: this.formatarMoeda(summary.totalReceived) },
        { label: 'Em aberto', value: this.formatarMoeda(summary.totalOpen) },
        { label: 'Vencido', value: this.formatarMoeda(summary.overdueAmount) },
        { label: 'Custo produtos', value: this.formatarMoeda(summary.productCost) },
        { label: 'Lucro bruto', value: this.formatarMoeda(summary.grossProfit) },
        { label: 'Margem', value: `${summary.grossMarginPercent || 0}%` }
      ]
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
        { label: 'Receita serviços', value: this.formatarMoeda(this.dashboard.serviceRevenue) },
        { label: 'Custo produtos', value: this.formatarMoeda(this.dashboard.productCost) },
        { label: 'Lucro bruto', value: this.formatarMoeda(this.dashboard.grossProfit) },
        { label: 'Margem bruta', value: `${this.dashboard.grossMarginPercent || 0}%` },
        { label: 'A receber', value: this.formatarMoeda(this.dashboard.totalReceivable) },
        { label: 'Recebido', value: this.formatarMoeda(this.dashboard.totalReceived) },
        { label: 'Vencido', value: this.formatarMoeda(this.dashboard.overdueAmount) },
        { label: 'OS pagas', value: this.dashboard.paidOrders || 0 },
        { label: 'Lucro pago', value: this.formatarMoeda(this.dashboard.grossProfitPaid) },
        { label: 'Lucro pendente', value: this.formatarMoeda(this.dashboard.grossProfitPending) }
      ]
    },
    dashboardProfitabilityList () {
      return this.dashboard.ordersProfitability || []
    },
    perfilAtual () {
      return localStorage.getItem('profile')
    },
    podeOperarOrdens () {
      return ['admin', 'superadmin', 'supervisor', 'atendente'].includes(this.perfilAtual)
    },
    podeGerenciarAgenda () {
      return ['admin', 'superadmin', 'supervisor'].includes(this.perfilAtual)
    },
    podeVerFinanceiro () {
      return this.podeGerenciarAgenda
    },
    podeVerObservacaoInterna () {
      return ['admin', 'superadmin', 'supervisor', 'atendente', 'tecnico'].includes(this.perfilAtual)
    },
    podeGerenciarEstoque () {
      return this.podeGerenciarAgenda
    }
  },
  watch: {
    '$route.query.aba' () {
      this.aplicarAbaDaRota()
    }
  },
  methods: {
    aplicarAbaDaRota () {
      this.aba = 'agenda'
    },
    async carregarTudo () {
      await Promise.all([
        this.carregarCadastrosBaseOrdem(),
        this.carregarAtendentes(),
        this.carregarEstoque(),
        this.carregarPragas(),
        this.carregarTiposAtendimento(),
        this.carregarTiposServico(),
        this.carregarOrdens()
      ])
    },
    async carregarCadastrosBaseOrdem () {
      try {
        const [formasPagamento, metodos] = await Promise.all([
          ListarCadastroBase('payment-methods', { status: 'active', rowsPerPage: 100 }),
          ListarCadastroBase('methods', { status: 'active', rowsPerPage: 100 })
        ])
        this.paymentMethodOptions = (formasPagamento.data.rows || []).map(item => ({
          label: item.name,
          value: item.code || item.name
        }))
        const methodOptions = (metodos.data.rows || []).map(item => ({
          label: item.name,
          value: item.code || item.name
        }))
        this.applicationMethodOptions = methodOptions
        this.serviceMethodOptions = methodOptions
      } catch (error) {
        this.paymentMethodOptions = []
        this.applicationMethodOptions = []
        this.serviceMethodOptions = []
        this.$notificarErro('Não foi possível carregar cadastros de métodos e pagamentos', error)
      }
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
    async carregarPragas () {
      const { data } = await ListarPragasServico({ search: this.filtroPragas })
      this.pragas = data
    },
    async carregarTiposAtendimento () {
      const { data } = await ListarTiposAtendimento({ isActive: true, rowsPerPage: 100 })
      this.tiposAtendimento = data.rows || []
    },
    async carregarMovimentacoesEstoque () {
      const { data } = await ListarMovimentacoesEstoqueServico()
      this.movimentacoesEstoque = data
    },
    async carregarRelatoriosEstoque () {
      const [consumo, lotes, custos] = await Promise.all([
        RelatorioConsumoEstoqueServico(),
        RelatorioLotesEstoqueServico(),
        RelatorioCustosEstoqueServico()
      ])
      this.relatorioConsumoEstoque = consumo.data
      this.relatorioLotesEstoque = lotes.data
      this.relatorioCustosEstoque = custos.data
    },
    async carregarAuditoriaEstoque () {
      if (!this.podeGerenciarEstoque) {
        this.auditoriaEstoque = []
        return
      }
      const { data } = await ListarAuditoriaEstoqueServico()
      this.auditoriaEstoque = data
    },
    async carregarAuditoriaFinanceira () {
      if (!this.podeGerenciarEstoque) {
        this.auditoriaFinanceira = []
        return
      }
      const { data } = await ListarAuditoriaFinanceiraServico()
      this.auditoriaFinanceira = data
    },
    async carregarAuditoriaServicos () {
      if (!this.podeGerenciarEstoque) {
        this.auditoriaServicos = []
        return
      }
      const { data } = await ListarAuditoriaTiposServico()
      this.auditoriaServicos = data
    },
    async carregarTiposServico () {
      const { data } = await ListarTiposServico(this.filtrosTiposServico)
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
      if (!this.podeVerFinanceiro) {
        this.dashboard = {}
        return
      }
      const { data } = await DashboardOrdensServico(this.filtros)
      this.dashboard = data
    },
    async carregarFechamentoMensal () {
      if (!this.podeVerFinanceiro) {
        this.fechamentoMensal = { summary: {}, rows: [] }
        return
      }
      const { data } = await FechamentoMensalOrdensServico({ month: this.mesFechamento })
      this.fechamentoMensal = data
    },
    async filtrarClientes (val, update) {
      const { data } = await ListarClientes({ searchParam: val || '' })
      update(() => {
        this.clientes = data.map(this.formatarOpcaoCliente)
      })
    },
    async carregarClientesServico () {
      const { data } = await ListarClientes({ searchParam: '' })
      this.clientes = data.map(this.formatarOpcaoCliente)
    },
    formatarOpcaoCliente (cliente) {
      const nome = cliente.legalName || cliente.name || 'Cliente sem nome'
      const fantasia = cliente.tradeName ? ` - ${cliente.tradeName}` : ''
      const documento = this.formatarDocumentoCliente(cliente.document)
      const contato = (cliente.contacts || [])[0] || {}
      const telefone = contato.whatsapp || contato.phone || cliente.number || ''
      const detalhe = documento || telefone || cliente.email || ''
      return {
        label: `${nome}${fantasia}${detalhe ? ` - ${detalhe}` : ''}`,
        value: cliente.contactId || cliente.id,
        clientId: cliente.id,
        raw: cliente
      }
    },
    formatarDocumentoCliente (documento) {
      const digits = String(documento || '').replace(/\D/g, '')
      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }
      if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      }
      return documento || ''
    },
    registrarOpcaoContatoOrdem (contact) {
      if (!contact) return
      const opcao = {
        label: `${contact.name || 'Cliente'}${contact.number ? ` - ${contact.number}` : ''}`,
        value: contact.id
      }
      if (!this.clientes.some(item => item.value === opcao.value)) {
        this.clientes.unshift(opcao)
      }
    },
    abrirCadastroCliente () {
      this.selectedClientId = null
      this.modalCliente = true
    },
    clienteSalvo (cliente) {
      const opcao = this.formatarOpcaoCliente(cliente)
      const index = this.clientes.findIndex(item => item.value === opcao.value)
      if (index === -1) this.clientes.unshift(opcao)
      else this.$set(this.clientes, index, opcao)
      this.form.contactId = opcao.value
      this.aplicarDadosClienteNaOrdem(cliente, true)
    },
    async preencherDadosClienteOrdem (contactId) {
      const opcao = this.clientes.find(item => item.value === contactId)
      if (!opcao) return
      if (opcao.raw) {
        this.aplicarDadosClienteNaOrdem(opcao.raw, true)
        return
      }
      if (!opcao.clientId) return
      const { data } = await ObterCliente(opcao.clientId)
      this.aplicarDadosClienteNaOrdem(data, true)
    },
    aplicarDadosClienteNaOrdem (cliente, sobrescrever = false) {
      if (!cliente) return
      const endereco = this.enderecoPrincipalCliente(cliente)
      if (endereco) {
        this.preencherCampoOrdem('address', this.formatarEnderecoOrdem(endereco), sobrescrever)
        this.preencherCampoOrdem('addressComplement', this.formatarComplementoEnderecoOrdem(endereco), sobrescrever)
        this.preencherCampoOrdem('city', endereco.city || '', sobrescrever)
        this.preencherCampoOrdem('state', String(endereco.state || '').toUpperCase(), sobrescrever)
        this.preencherCampoOrdem('zipCode', endereco.zipCode || '', sobrescrever)
      }
      if (!this.form.internalObservation && cliente.notes) {
        this.form.internalObservation = cliente.notes
      }
    },
    enderecoPrincipalCliente (cliente) {
      const enderecos = cliente.addresses || []
      return enderecos.find(endereco =>
        ['principal', 'matriz'].includes(String(endereco.addressType || '').toLowerCase())
      ) || enderecos[0] || null
    },
    preencherCampoOrdem (field, value, sobrescrever) {
      if (!value) return
      if (sobrescrever || !this.form[field]) this.form[field] = value
    },
    formatarEnderecoOrdem (endereco) {
      return [endereco.street, endereco.number].filter(Boolean).join(', ')
    },
    formatarComplementoEnderecoOrdem (endereco) {
      return [
        endereco.complement,
        endereco.district ? `Bairro: ${endereco.district}` : '',
        endereco.reference
      ].filter(Boolean).join(' - ')
    },
    abrirOrdem (ordem) {
      if (ordem?.recurringOccurrence) {
        this.$q.dialog({
          title: 'Editar ordem recorrente',
          message: 'Esta é uma ocorrência da série. As ações rápidas alteram somente esta ocorrência. Deseja editar toda a série?',
          ok: { label: 'Editar série inteira', color: 'primary' },
          cancel: true,
          persistent: true
        }).onOk(async () => {
          try {
            const { data } = await ObterOrdemServico(ordem.originalServiceOrderId || ordem.id)
            this.prepararFormularioOrdem(data)
          } catch (error) {
            this.$notificarErro('Não foi possível carregar a série recorrente', error)
          }
        })
        return
      }
      this.prepararFormularioOrdem(ordem)
    },
    prepararFormularioOrdem (ordem) {
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
          chargedAmount: this.formatarMoedaCampo(ordem.chargedAmount),
          paidAmount: this.formatarMoedaCampo(ordem.paidAmount),
          paymentDueDate: ordem.paymentDueDate ? this.toInputDate(ordem.paymentDueDate).slice(0, 10) : '',
          paidAt: ordem.paidAt ? this.toInputDate(ordem.paidAt).slice(0, 10) : '',
          items: this.normalizarItensOrdemParaFormulario(ordem.items || [])
        }
        : emptyForm()
      this.sincronizarTipoAtendimentoLegado()
      this.servicoOrdemSelecionado = null
      this.produtoOrdemSelecionado = null
      this.registrarOpcaoContatoOrdem(ordem?.contact)
      this.carregarClientesServico()
      this.modalOrdem = true
    },
    abrirAtendente (atendente) {
      this.atendente = atendente ? { ...atendente } : { active: true }
      this.modalAtendente = true
    },
    criarItemEstoqueVazio () {
      return emptyInventoryItem()
    },
    normalizarItemEstoqueFormulario (item) {
      const pestIds = item.pestIds || (item.productPests || []).map(productPest => productPest.pestId)
      return {
        ...this.criarItemEstoqueVazio(),
        ...item,
        unit: item.unit || 'unidade',
        productCategory: item.productCategory || 'outro',
        quantity: this.parseInteiro(item.quantity),
        minQuantity: this.parseInteiro(item.minQuantity),
        salePrice: this.formatarMoedaCampo(item.salePrice),
        costPrice: this.formatarMoedaCampo(item.costPrice),
        diluentTypes: item.diluentTypes || [],
        applicationMethods: item.applicationMethods || [],
        batches: item.batches || [],
        pestIds,
        pestRecommendations: (item.pestRecommendations || []).map(rec => ({
          ...rec,
          pestId: rec.pestId || rec.pest?.id || null
        })),
        printSettings: {
          ...this.criarItemEstoqueVazio().printSettings,
          ...(item.printSettings || {})
        }
      }
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
        ? this.normalizarItemEstoqueFormulario(item)
        : this.criarItemEstoqueVazio()
      this.modalEstoque = true
    },
    adicionarLoteEstoque () {
      this.itemEstoque.batches.push({
        batchNumber: '',
        manufacturingDate: '',
        expirationDate: '',
        quantity: 0,
        supplier: '',
        observation: ''
      })
    },
    removerLoteEstoque (index) {
      this.itemEstoque.batches.splice(index, 1)
    },
    adicionarRecomendacaoEstoque () {
      this.itemEstoque.pestRecommendations.push({
        pestId: null,
        productQuantity: 0,
        diluentQuantity: 0,
        unit: this.itemEstoque.unit || 'ml',
        actionTime: '',
        technicalObservation: ''
      })
    },
    removerRecomendacaoEstoque (index) {
      this.itemEstoque.pestRecommendations.splice(index, 1)
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
    abrirPraga (praga) {
      this.praga = praga ? { ...praga } : { commonName: '', scientificName: '' }
      this.modalPraga = true
    },
    async salvarPraga () {
      this.salvando = true
      try {
        const payload = {
          commonName: this.praga.commonName,
          scientificName: this.praga.scientificName
        }
        if (this.praga.id) await AlterarPragaServico({ id: this.praga.id, ...payload })
        else await CriarPragaServico(payload)
        this.$q.notify({ type: 'positive', message: 'Praga salva.' })
        this.modalPraga = false
        await Promise.all([this.carregarPragas(), this.carregarEstoque(), this.carregarTiposServico()])
      } catch (error) {
        this.$notificarErro('Não foi possível salvar a praga', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarExcluirPraga (praga) {
      this.$q.dialog({
        title: 'Excluir praga',
        message: `Confirma excluir ${this.rotuloPraga(praga)}?`,
        cancel: true,
        persistent: true
      }).onOk(() => this.excluirPraga(praga))
    },
    async excluirPraga (praga) {
      try {
        await ExcluirPragaServico(praga.id)
        this.$q.notify({ type: 'positive', message: 'Praga excluída.' })
        await Promise.all([this.carregarPragas(), this.carregarEstoque(), this.carregarTiposServico()])
      } catch (error) {
        this.$notificarErro('Não foi possível excluir a praga', error)
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
      const itemId = Number(item?.id)
      if (!Number.isInteger(itemId) || itemId <= 0) {
        this.$q.notify({ type: 'warning', message: 'Produto inválido para exclusão.' })
        await this.carregarEstoque()
        return
      }
      try {
        await ExcluirItemEstoqueServico(itemId)
        this.$q.notify({ type: 'positive', message: 'Produto inativado.' })
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
      } catch (error) {
        const errorCode = error?.data?.error || error?.response?.data?.error
        if (error?.response?.status === 404 || errorCode === 'ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND') {
          this.$q.notify({ type: 'warning', message: 'Produto não encontrado. A lista foi atualizada.' })
          await this.carregarEstoque()
          await this.carregarEstoqueBaixo()
          return
        }
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
        await this.carregarAuditoriaEstoque()
        await this.carregarAuditoriaFinanceira()
      } catch (error) {
        this.$notificarErro('Não foi possível ajustar o estoque', error)
      } finally {
        this.salvando = false
      }
    },
    abrirTipoServico (tipo) {
      this.tipoServico = tipo
        ? this.normalizarTipoServicoFormulario(tipo)
        : emptyServiceType()
      this.modalTipoServico = true
    },
    normalizarTipoServicoFormulario (tipo) {
      const warranty = (tipo.warranties || [])[0]
      return {
        ...emptyServiceType(),
        ...tipo,
        defaultPrice: this.formatarMoedaCampo(tipo.defaultPrice),
        categories: tipo.categories || [],
        pestIds: (tipo.pests || []).map(item => item.pestId || item.pest?.id).filter(Boolean),
        environments: (tipo.environments || []).map(item => item.environment),
        methods: (tipo.methods || []).map(item => item.method),
        products: (tipo.products || []).map(item => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          averageConsumption: item.averageConsumption
        })),
        warranty: {
          ...emptyServiceType().warranty,
          hasWarranty: Boolean(warranty),
          ...(warranty || {})
        }
      }
    },
    async salvarTipoServico () {
      this.salvando = true
      try {
        const payload = this.normalizarPayloadTipoServico(this.tipoServico)
        if (payload.id) await AlterarTipoServico(payload)
        else await CriarTipoServico(payload)
        this.$q.notify({ type: 'positive', message: 'Serviço salvo.' })
        this.modalTipoServico = false
        await this.carregarTiposServico()
        await this.carregarAuditoriaServicos()
      } catch (error) {
        this.$notificarErro('Não foi possível salvar o serviço', error)
      } finally {
        this.salvando = false
      }
    },
    confirmarExcluirTipoServico (tipo) {
      this.$q.dialog({
        title: 'Inativar serviço',
        message: `Confirma inativar ${tipo.name}?`,
        cancel: true,
        persistent: true
      }).onOk(() => this.excluirTipoServico(tipo))
    },
    async excluirTipoServico (tipo) {
      try {
        await ExcluirTipoServico(tipo.id)
        this.$q.notify({ type: 'positive', message: 'Serviço inativado.' })
        await this.carregarTiposServico()
        await this.carregarAuditoriaServicos()
      } catch (error) {
        this.$notificarErro('Não foi possível inativar o serviço', error)
      }
    },
    async duplicarTipoServico (tipo) {
      try {
        await DuplicarTipoServico(tipo.id)
        this.$q.notify({ type: 'positive', message: 'Serviço duplicado.' })
        await this.carregarTiposServico()
        await this.carregarAuditoriaServicos()
      } catch (error) {
        this.$notificarErro('Não foi possível duplicar o serviço', error)
      }
    },
    adicionarProdutoServico () {
      this.tipoServico.products.push({ inventoryItemId: null, averageConsumption: 0 })
    },
    removerProdutoServico (index) {
      this.tipoServico.products.splice(index, 1)
    },
    detalheProdutoServico (inventoryItemId, field) {
      const product = this.estoque.find(item => item.id === inventoryItemId)
      return product ? product[field] : ''
    },
    rotuloStatusFinanceiro (status) {
      const option = this.financialStatusOptions.find(item => item.value === status)
      return option ? option.label : status || 'Não cobrado'
    },
    rotuloFormaPagamento (method) {
      const option = this.paymentMethodOptions.find(item => item.value === method)
      return option ? option.label : '-'
    },
    corStatusFinanceiro (ordem) {
      if (ordem.financialStatus === 'pago') return 'positive'
      if (ordem.financialStatus === 'parcial') return 'amber-9'
      if (ordem.financialStatus === 'cancelado') return 'grey'
      if (this.ordemFinanceiraVencida(ordem)) return 'negative'
      if (ordem.financialStatus === 'cobrado') return 'primary'
      return 'grey-7'
    },
    ordemFinanceiraVencida (ordem) {
      return Boolean(
        ordem &&
        !['pago', 'cancelado'].includes(ordem.financialStatus) &&
        ordem.paymentDueDate &&
        new Date(ordem.paymentDueDate) < new Date()
      )
    },
    valorAbertoOrdem (ordem) {
      const charged = this.parseMoeda(ordem.chargedAmount) || 0
      const paid = this.parseMoeda(ordem.paidAmount) || 0
      return Math.max(0, charged - paid)
    },
    totalServicosOrdem (ordem) {
      return (ordem.items || []).reduce((sum, item) => {
        if (item.itemType !== 'service') return sum
        const quantity = this.parseInteiro(item.quantity) || 1
        const unitPrice = this.parseMoeda(item.unitPrice) || 0
        return sum + (quantity * unitPrice)
      }, 0)
    },
    formatarDataCurta (value) {
      if (!value) return '-'
      return new Date(value).toLocaleDateString('pt-BR')
    },
    loteMaisCriticoProduto (item) {
      const batches = item.batches || []
      if (!batches.length) return null
      return batches
        .filter(batch => batch.expirationDate)
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))[0] || null
    },
    corStatusLoteProduto (item) {
      const batches = item.batches || []
      if (batches.some(batch => Number(batch.quantity || 0) <= 0)) return 'grey'
      const critical = this.loteMaisCriticoProduto(item)
      if (!critical) return 'positive'
      const expiration = new Date(critical.expirationDate)
      const today = new Date()
      const soon = new Date()
      soon.setDate(soon.getDate() + 30)
      if (expiration < today) return 'negative'
      if (expiration <= soon) return 'warning'
      return 'positive'
    },
    rotuloStatusLoteProduto (item) {
      const batches = item.batches || []
      if (!batches.length) return 'Sem lotes'
      if (batches.every(batch => Number(batch.quantity || 0) <= 0)) return 'Esgotado'
      const critical = this.loteMaisCriticoProduto(item)
      if (!critical) return `${batches.length} lote(s)`
      const expiration = new Date(critical.expirationDate)
      const today = new Date()
      const soon = new Date()
      soon.setDate(soon.getDate() + 30)
      if (expiration < today) return 'Vencido'
      if (expiration <= soon) return 'Proximo vencimento'
      return `${batches.length} lote(s)`
    },
    async atualizarFinanceiroOrdem (ordem, changes) {
      await this.salvarStatus(ordem, changes)
    },
    async marcarComoCobrada (ordem) {
      await this.atualizarFinanceiroOrdem(ordem, { financialStatus: 'cobrado' })
    },
    async marcarComoPaga (ordem) {
      const charged = this.parseMoeda(ordem.chargedAmount) || this.totalServicosOrdem(ordem)
      await this.atualizarFinanceiroOrdem(ordem, {
        financialStatus: 'pago',
        chargedAmount: charged,
        paidAmount: charged || this.parseMoeda(ordem.paidAmount) || 0,
        paidAt: localDateInput()
      })
    },
    registrarPagamentoParcial (ordem) {
      this.$q.dialog({
        title: 'Pagamento parcial',
        message: 'Informe o valor pago',
        prompt: {
          model: this.formatarMoedaCampo(ordem.paidAmount),
          type: 'text'
        },
        cancel: true,
        persistent: true
      }).onOk(async value => {
        await this.atualizarFinanceiroOrdem(ordem, {
          financialStatus: 'parcial',
          paidAmount: this.parseMoeda(value) || 0
        })
      })
    },
    alterarVencimentoFinanceiro (ordem) {
      this.$q.dialog({
        title: 'Alterar vencimento',
        message: 'Informe a nova data de vencimento',
        prompt: {
          model: ordem.paymentDueDate ? this.toInputDate(ordem.paymentDueDate).slice(0, 10) : localDateInput(),
          type: 'date'
        },
        cancel: true,
        persistent: true
      }).onOk(async value => {
        await this.atualizarFinanceiroOrdem(ordem, { paymentDueDate: value })
      })
    },
    alterarObservacaoFinanceira (ordem) {
      this.$q.dialog({
        title: 'Observação financeira',
        message: 'Informe uma observação',
        prompt: {
          model: ordem.financialObservation || '',
          type: 'textarea'
        },
        cancel: true,
        persistent: true
      }).onOk(async value => {
        await this.atualizarFinanceiroOrdem(ordem, { financialObservation: value })
      })
    },
    enviarLembreteCobranca (ordem) {
      this.$q.dialog({
        title: 'Lembrete de cobranca',
        message: `Enviar lembrete para a OS #${ordem.id}?`,
        options: {
          type: 'checkbox',
          model: ['internal'],
          items: this.notificationOptions
        },
        cancel: true,
        persistent: true
      }).onOk(async channels => {
        try {
          const { data } = await EnviarLembreteCobrancaOrdemServico(ordem.id, { channels })
          const falhas = Object.keys(data.failed || {})
          this.$q.notify({
            type: falhas.length ? 'warning' : 'positive',
            message: falhas.length ? `Lembrete parcial. Falhas: ${falhas.join(', ')}` : 'Lembrete enviado.'
          })
          await this.carregarAuditoriaFinanceira()
        } catch (error) {
          this.$notificarErro('Nao foi possivel enviar o lembrete de cobranca', error)
        }
      })
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
        salePrice: this.parseMoeda(item.salePrice),
        diluentTypes: item.diluentTypes || [],
        applicationMethods: item.applicationMethods || [],
        pestIds: item.pestIds || [],
        batches: (item.batches || [])
          .filter(lote => lote.batchNumber)
          .map(lote => ({
            ...lote,
            quantity: this.parseInteiro(lote.quantity)
          })),
        pestRecommendations: (item.pestRecommendations || [])
          .filter(rec => rec.pestId)
          .map(rec => ({
            ...rec,
            pestId: rec.pestId,
            productQuantity: this.parseMoeda(rec.productQuantity),
            diluentQuantity: this.parseMoeda(rec.diluentQuantity)
          })),
        printSettings: item.printSettings || this.criarItemEstoqueVazio().printSettings
      }
    },
    normalizarPayloadTipoServico (tipo) {
      return {
        ...tipo,
        defaultPrice: this.parseMoeda(tipo.defaultPrice),
        categories: tipo.categories || [],
        pests: (tipo.pestIds || []).map(pestId => ({ pestId })),
        environments: tipo.environments || [],
        methods: tipo.methods || [],
        products: (tipo.products || [])
          .filter(product => product.inventoryItemId)
          .map(product => ({
            inventoryItemId: product.inventoryItemId,
            averageConsumption: this.parseMoeda(product.averageConsumption)
          })),
        warranty: tipo.warranty || emptyServiceType().warranty,
        recommendedTechnicians: this.parseInteiro(tipo.recommendedTechnicians) || 1,
        returnQuantity: this.parseInteiro(tipo.returnQuantity) || 0
      }
    },
    rotuloOpcao (options, value) {
      const option = options.find(item => item.value === value)
      return option ? option.label : value
    },
    rotuloPraga (pest) {
      if (!pest) return ''
      return [pest.commonName, pest.scientificName].filter(Boolean).join(' — ')
    },
    textoGarantiaServico (serviceType) {
      const warranty = (serviceType.warranties || [])[0]
      if (!warranty) return ''
      const unit = this.rotuloOpcao(this.warrantyUnitOptions, warranty.unit || 'dias').toLowerCase()
      return `Garantia: ${warranty.quantity || 0} ${unit}${warranty.rules ? `. ${warranty.rules}` : ''}`
    },
    criarItemOrdemBase (overrides) {
      return {
        key: `${Date.now()}-${Math.random()}`,
        itemType: 'service',
        serviceTypeId: null,
        inventoryItemId: null,
        inventoryBatchId: null,
        pestTarget: '',
        applicationMethod: '',
        dilutionUsed: '',
        technicalObservation: '',
        description: '',
        quantity: 1,
        unitPrice: '0,00',
        ...overrides
      }
    },
    adicionarServicoNaOrdem () {
      const serviceType = this.tiposServico.find(item => item.id === this.servicoOrdemSelecionado)
      if (!serviceType) return
      if (!this.form.serviceType) this.form.serviceType = serviceType.name
      if (!this.form.description && serviceType.orderDefaultText) this.form.description = serviceType.orderDefaultText
      if (!this.form.publicObservation && serviceType.customerRecommendations) this.form.publicObservation = serviceType.customerRecommendations
      const warrantyText = this.textoGarantiaServico(serviceType)
      if (warrantyText && !String(this.form.publicObservation || '').includes(warrantyText)) {
        this.form.publicObservation = [this.form.publicObservation, warrantyText].filter(Boolean).join('\n\n')
      }
      const servicePests = (serviceType.pests || []).map(item => item.pest).filter(Boolean)
      if (!this.form.pestTarget && servicePests.length) this.form.pestTarget = servicePests[0].commonName
      this.form.items.push(this.criarItemOrdemBase({
        itemType: 'service',
        serviceTypeId: serviceType.id,
        pestTarget: this.form.pestTarget || '',
        applicationMethod: (serviceType.methods || [])[0]?.method || '',
        technicalObservation: serviceType.technicalDescription || '',
        description: serviceType.orderDefaultText || serviceType.description || serviceType.name,
        unitPrice: this.formatarMoedaCampo(serviceType.defaultPrice)
      }))
      ;(serviceType.products || []).forEach(serviceProduct => {
        const product = this.estoque.find(item => item.id === serviceProduct.inventoryItemId)
        if (!product) return
        this.form.items.push(this.criarItemOrdemBase({
          itemType: 'product',
          inventoryItemId: product.id,
          inventoryBatchId: product.lotControlEnabled && product.batches?.length ? product.batches[0].id : null,
          pestTarget: this.form.pestTarget || '',
          applicationMethod: product.applicationMethods?.[0] || (serviceType.methods || [])[0]?.method || '',
          description: product.name,
          quantity: this.parseInteiro(serviceProduct.averageConsumption) || 1,
          unitPrice: this.formatarMoedaCampo(product.salePrice)
        }))
      })
      this.servicoOrdemSelecionado = null
    },
    produtoRecomendadoParaPraga (product, pest) {
      if (!pest) return true
      const normalizedPest = String(pest).toLowerCase()
      return (product.productPests || []).some(item =>
        String(item.pest?.commonName || '').toLowerCase() === normalizedPest
      ) || (product.pestRecommendations || []).some(rec =>
        String(rec.pest?.commonName || '').toLowerCase() === normalizedPest
      )
    },
    recomendacaoProdutoPorPraga (product, pest) {
      const normalizedPest = String(pest || '').toLowerCase()
      return (product?.pestRecommendations || []).find(rec =>
        String(rec.pest?.commonName || '').toLowerCase() === normalizedPest
      )
    },
    opcoesLotesProdutoOrdem (inventoryItemId) {
      const product = this.estoque.find(item => item.id === inventoryItemId)
      return (product?.batches || [])
        .filter(lote => Number(lote.quantity || 0) > 0)
        .map(lote => ({
          label: `${lote.batchNumber}${lote.expirationDate ? ` - vence ${this.formatarDataCurta(lote.expirationDate)}` : ''}`,
          value: lote.id
        }))
    },
    opcoesMetodosProdutoOrdem (inventoryItemId) {
      const product = this.estoque.find(item => item.id === inventoryItemId)
      const methods = product?.applicationMethods?.length ? product.applicationMethods : this.applicationMethodOptions.map(item => item.value)
      return methods.map(value => {
        const option = this.applicationMethodOptions.find(item => item.value === value)
        return { label: option ? option.label : value, value }
      })
    },
    aplicarRecomendacaoProduto (item) {
      const product = this.estoque.find(produto => produto.id === item.inventoryItemId)
      const recommendation = this.recomendacaoProdutoPorPraga(product, item.pestTarget)
      if (!recommendation) return
      const productQty = recommendation.productQuantity || 0
      const diluentQty = recommendation.diluentQuantity || 0
      item.dilutionUsed = `${productQty} ${recommendation.unit || product?.unit || ''} para ${diluentQty} de diluente`.trim()
      item.technicalObservation = recommendation.technicalObservation || item.technicalObservation
    },
    adicionarProdutoNaOrdem () {
      const product = this.estoque.find(item => item.id === this.produtoOrdemSelecionado)
      if (!product) return
      const recommendation = this.recomendacaoProdutoPorPraga(product, this.form.pestTarget)
      this.form.items.push(this.criarItemOrdemBase({
        itemType: 'product',
        inventoryItemId: product.id,
        inventoryBatchId: product.lotControlEnabled && product.batches?.length ? product.batches[0].id : null,
        pestTarget: this.form.pestTarget || '',
        applicationMethod: product.applicationMethods?.[0] || '',
        dilutionUsed: recommendation ? `${recommendation.productQuantity || 0} ${recommendation.unit || product.unit || ''} para ${recommendation.diluentQuantity || 0} de diluente` : '',
        technicalObservation: recommendation?.technicalObservation || '',
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
          inventoryBatchId: item.itemType === 'product' ? item.inventoryBatchId : null,
          pestTarget: item.itemType === 'product' ? item.pestTarget : null,
          applicationMethod: item.itemType === 'product' ? item.applicationMethod : null,
          dilutionUsed: item.itemType === 'product' ? item.dilutionUsed : null,
          technicalObservation: item.itemType === 'product' ? item.technicalObservation : null,
          description: item.description,
          quantity: Math.max(1, this.parseInteiro(item.quantity)),
          unitPrice: this.parseMoeda(item.unitPrice) || 0
        }))
    },
    selecionarTipoAtendimentoOrdem (attendanceTypeId) {
      const attendanceType = this.tiposAtendimento.find(item => item.id === attendanceTypeId)
      if (attendanceType) this.form.serviceType = attendanceType.name
    },
    sincronizarTipoAtendimentoLegado () {
      if (this.form.attendanceTypeId || !this.form.serviceType) return
      const attendanceType = this.tiposAtendimento.find(item => String(item.name).toLowerCase() === String(this.form.serviceType).toLowerCase())
      if (attendanceType) this.form.attendanceTypeId = attendanceType.id
    },
    async salvarOrdem (status) {
      this.salvando = true
      try {
        this.selecionarTipoAtendimentoOrdem(this.form.attendanceTypeId)
        const payload = this.normalizarDatasPayload({ ...this.form, status })
        const response = payload.id ? await AlterarOrdemServico(payload) : await CriarOrdemServico(payload)
        this.$q.notify({ type: 'positive', message: 'Ordem de serviço salva.' })
        this.modalOrdem = false
        this.ordemSelecionada = response.data
        await this.carregarOrdens()
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
        await this.carregarMovimentacoesEstoque()
        await this.carregarAuditoriaEstoque()
        await this.carregarAuditoriaFinanceira()
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
      await this.salvarStatus(this.ordemSelecionada, { status })
    },
    async alterarStatusOrdem (ordem, status) {
      this.ordemSelecionada = ordem
      await this.salvarStatus(ordem, { status })
    },
    confirmarCancelamento () {
      this.$q.dialog({
        title: 'Cancelar ordem',
        message: 'Confirma o cancelamento desta ordem de serviço?',
        cancel: true,
        persistent: true
      }).onOk(() => this.salvarStatus(this.ordemSelecionada, { status: 'cancelada' }))
    },
    cancelarOrdem (ordem) {
      this.ordemSelecionada = ordem
      this.confirmarCancelamento()
    },
    async salvarStatus (ordem, changes) {
      try {
        const normalizedChanges = this.normalizarPatchOrdem(changes)
        const effectiveOrder = { ...ordem, ...normalizedChanges }
        const response = ordem.recurringOccurrence
          ? await AlterarOcorrenciaOrdemServico(ordem.originalServiceOrderId || ordem.id, {
            occurrenceStart: ordem.originalOccurrenceStart,
            scheduledStart: effectiveOrder.scheduledStart,
            scheduledEnd: effectiveOrder.scheduledEnd,
            attendantId: effectiveOrder.attendantId,
            status: effectiveOrder.status
          })
          : await AlterarParcialOrdemServico(ordem.id, {
            ...normalizedChanges,
            expectedUpdatedAt: ordem.updatedAt
          })
        const { data } = response
        this.ordemSelecionada = data
        await this.carregarOrdens()
        await this.carregarEstoque()
        await this.carregarEstoqueBaixo()
        await this.carregarMovimentacoesEstoque()
        await this.carregarAuditoriaEstoque()
        await this.carregarAuditoriaFinanceira()
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
    abrirNotificacao (ordem, somenteEmail = false) {
      this.ordemSelecionada = ordem
      this.notificacao = {
        channels: somenteEmail ? ['email'] : ['internal'],
        message: ''
      }
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
      await this.salvarStatus(this.ordemArrastada, {
        attendantId: linha.id,
        scheduledStart: this.toInputDate(nextStart),
        scheduledEnd: this.toInputDate(nextEnd),
        status: this.ordemArrastada.status === 'agendada' ? 'reagendada' : this.ordemArrastada.status
      })
      this.ordemArrastada = null
    },
    async moverOrdemParaTecnico (ordem, tecnico) {
      await this.salvarStatus(ordem, {
        attendantId: tecnico.id,
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
      const attendanceType = this.tiposAtendimento.find(item => item.isActive)
      this.abrirOrdemNoHorario(linha, hour, {
        title: 'Reserva de horário',
        attendanceTypeId: attendanceType?.id || null,
        serviceType: attendanceType?.name || '',
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
      await this.salvarStatus(ordem, { scheduledEnd: this.toInputDate(end) })
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
    formatarAcaoAuditoriaEstoque (action) {
      const labels = {
        service_inventory_created: 'Produto criado',
        service_inventory_updated: 'Produto alterado',
        service_inventory_deleted: 'Produto excluído',
        service_inventory_adjusted: 'Ajuste manual',
        service_inventory_adjust_failed: 'Ajuste bloqueado',
        service_inventory_auto_deducted: 'Baixa automática',
        service_inventory_auto_deduct_failed: 'Baixa bloqueada'
      }
      return labels[action] || action
    },
    descreverAuditoriaEstoque (log) {
      const metadata = log.metadata || {}
      if (metadata.reason) return metadata.reason
      if (metadata.name) return metadata.sku ? `${metadata.name} (${metadata.sku})` : metadata.name
      if (metadata.movementType) return `${metadata.movementType}: ${metadata.quantity}`
      if (metadata.serviceOrderId) return `OS #${metadata.serviceOrderId}`
      return '-'
    },
    formatarAcaoAuditoriaFinanceira (action) {
      const labels = {
        service_order_financial_updated: 'Financeiro alterado',
        service_order_billing_reminder_sent: 'Lembrete enviado',
        service_order_billing_reminder_failed: 'Lembrete falhou'
      }
      return labels[action] || action
    },
    formatarAcaoAuditoriaServico (action) {
      const labels = {
        service_type_created: 'Serviço criado',
        service_type_updated: 'Serviço alterado',
        service_type_deleted: 'Serviço inativado',
        service_type_duplicated: 'Serviço duplicado'
      }
      return labels[action] || action
    },
    descreverAuditoriaServico (log) {
      const metadata = log.metadata || {}
      if (metadata.sourceId) return `Origem #${metadata.sourceId} - ${metadata.name || '-'}`
      if (metadata.code || metadata.name) return [metadata.code, metadata.name].filter(Boolean).join(' - ')
      return '-'
    },
    descreverAuditoriaFinanceira (log) {
      const metadata = log.metadata || {}
      const changedFields = metadata.changedFields || []
      if (metadata.sent || metadata.failed) {
        return `Enviado: ${(metadata.sent || []).join(', ') || '-'}`
      }
      if (!changedFields.length) return metadata.serviceOrderId ? `OS #${metadata.serviceOrderId}` : '-'
      return changedFields.map(field => this.rotuloCampoFinanceiro(field)).join(', ')
    },
    rotuloCampoFinanceiro (field) {
      const labels = {
        financialStatus: 'status',
        paymentMethod: 'forma de pagamento',
        chargedAmount: 'valor cobrado',
        paidAmount: 'valor pago',
        paymentDueDate: 'vencimento',
        paidAt: 'data de pagamento',
        financialObservation: 'observacao'
      }
      return labels[field] || field
    },
    parametrosFinanceirosAtuais () {
      const { start, end } = this.periodoAgenda()
      return {
        ...this.filtros,
        start: start.toISOString(),
        end: end.toISOString()
      }
    },
    async baixarRelatorioFinanceiro () {
      try {
        const { data } = await BaixarRelatorioFinanceiroOrdensServico(this.parametrosFinanceirosAtuais())
        const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-financeiro-os-${localDateInput()}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notificarErro('NÃ£o foi possÃ­vel baixar o relatÃ³rio financeiro', error)
      }
    },
    async baixarFechamentoMensal () {
      try {
        const { data } = await BaixarFechamentoMensalOrdensServico({ month: this.mesFechamento })
        const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `fechamento-financeiro-${this.mesFechamento}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notificarErro('Nao foi possivel baixar o fechamento mensal', error)
      }
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
        chargedAmount: this.parseMoeda(payload.chargedAmount) || 0,
        paidAmount: this.parseMoeda(payload.paidAmount) || 0,
        paymentDueDate: this.toApiDate(payload.paymentDueDate),
        paidAt: this.toApiDate(payload.paidAt),
        scheduledStart: this.toApiScheduleDate(payload, 'scheduledStart', 'scheduledStartTime'),
        scheduledEnd: this.toApiScheduleDate(payload, 'scheduledEnd', 'scheduledEndTime')
      }
    },
    normalizarPatchOrdem (changes) {
      const payload = { ...changes }
      if (Object.prototype.hasOwnProperty.call(payload, 'scheduledStart')) {
        payload.scheduledStart = this.toApiDate(payload.scheduledStart)
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'scheduledEnd')) {
        payload.scheduledEnd = this.toApiDate(payload.scheduledEnd)
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'paymentDueDate')) {
        payload.paymentDueDate = this.toApiDate(payload.paymentDueDate)
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'paidAt')) {
        payload.paidAt = this.toApiDate(payload.paidAt)
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'chargedAmount')) {
        payload.chargedAmount = this.parseMoeda(payload.chargedAmount) || 0
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'paidAmount')) {
        payload.paidAmount = this.parseMoeda(payload.paidAmount) || 0
      }
      return payload
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
    this.aplicarAbaDaRota()
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
.dashboard-panel-wide {
  grid-column: span 2;
}
.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #eef2f7;
}
.metric-row small {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 400;
}
.service-option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 4px 12px;
}
.metric-row-profit span {
  min-width: 0;
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
.audit-metadata {
  max-width: 460px;
  white-space: normal;
  word-break: break-word;
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
