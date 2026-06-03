<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-grey-9">
      <q-toolbar>
        <q-toolbar-title>Minha assinatura</q-toolbar-title>
        <q-btn flat round icon="mdi-refresh" :loading="loading" title="Atualizar assinatura" @click="carregar" />
        <q-btn flat rounded label="Voltar ao sistema" icon="mdi-home" :disable="assinaturaExpirada" @click="$router.push({ name: 'home-dashboard' })" />
        <q-btn flat rounded label="Sair" icon="mdi-logout" @click="logout" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page class="q-pa-md">
        <q-banner v-if="assinaturaExpirada" class="bg-orange-2 text-orange-10 q-mb-md" rounded>
          O acesso da empresa está vencido. Gere um pagamento para renovar sua assinatura.
        </q-banner>
        <q-banner v-else class="bg-blue-1 text-blue-10 q-mb-md" rounded>
          Sua empresa possui {{ resumo.accessDaysRemaining === null ? 'acesso sem prazo definido' : `${resumo.accessDaysRemaining} dias de acesso` }}.
        </q-banner>
        <q-banner v-if="avisoPagamento" class="bg-grey-2 text-grey-9 q-mb-md" rounded>
          {{ avisoPagamento }}
        </q-banner>

        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Situação atual</div>
            <div>Plano: {{ resumo.subscription?.plan?.name || 'Nenhum plano contratado' }}</div>
            <div>Vencimento: {{ formatarData(resumo.company?.accessExpiresAt) }}</div>
            <div>Status do pagamento: {{ pagamentoAtual?.status || 'Nenhum pagamento gerado' }}</div>
          </q-card-section>
        </q-card>

        <div class="text-h6 q-mb-sm">Escolha um plano</div>
        <div class="row q-col-gutter-md q-mb-md">
          <div v-for="plano in planos" :key="plano.id" class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-h6">{{ plano.name }}</div>
                <div class="text-h5 text-primary">{{ formatarMoeda(plano.price) }}</div>
                <div class="text-caption">{{ plano.durationDays }} dias de acesso</div>
                <div v-if="plano.limits?.maxUsers" class="text-caption">Ate {{ plano.limits.maxUsers }} usuarios</div>
                <div v-if="plano.limits?.maxConnections" class="text-caption">Ate {{ plano.limits.maxConnections }} canais</div>
              </q-card-section>
              <q-card-actions>
                <q-btn rounded color="primary" label="Gerar Pix" :loading="loadingPayment" @click="gerarPagamento(plano.id, 'PIX')" />
                <q-btn flat rounded color="primary" label="Pagar com cartão" :loading="loadingPayment" @click="gerarPagamento(plano.id, 'CARD')" />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <q-card v-if="pagamentoAtual" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Pagamento gerado</div>
            <div class="text-body2">A liberação ocorre após a confirmação enviada pelo Asaas.</div>
          </q-card-section>
          <q-card-section v-if="pagamentoAtual.pixQrCode" class="text-center">
            <img :src="`data:image/png;base64,${pagamentoAtual.pixQrCode}`" alt="QR Code Pix" style="max-width: 260px">
            <q-input :value="pagamentoAtual.pixCopyPaste" outlined dense readonly label="Pix Copia e Cola" class="q-mt-md">
              <template v-slot:append>
                <q-btn flat round icon="mdi-content-copy" @click="copiarPix" />
              </template>
            </q-input>
          </q-card-section>
          <q-card-actions v-if="pagamentoAtual.paymentUrl">
            <q-btn type="a" :href="pagamentoAtual.paymentUrl" target="_blank" rounded color="primary" label="Abrir página segura de pagamento" />
          </q-card-actions>
        </q-card>

        <q-card flat bordered>
          <q-card-section><div class="text-h6">Histórico de pagamentos</div></q-card-section>
          <q-table row-key="id" :data="resumo.payments || []" :columns="columns" :loading="loading" flat>
            <template v-slot:body-cell-amount="props">
              <q-td :props="props">{{ formatarMoeda(props.row.amount) }}</q-td>
            </template>
            <template v-slot:body-cell-createdAt="props">
              <q-td :props="props">{{ formatarData(props.row.createdAt) }}</q-td>
            </template>
          </q-table>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ConsultarAssinatura, CriarPagamento, ListarPlanosDisponiveis } from 'src/service/billing'
import { RealizarLogout } from 'src/service/login'

export default {
  name: 'MinhaAssinatura',
  data () {
    return {
      loading: false,
      loadingPayment: false,
      planos: [],
      resumo: {},
      pagamentoAtual: null,
      columns: [
        { name: 'createdAt', label: 'Data', field: 'createdAt', align: 'left' },
        { name: 'plan', label: 'Plano', field: row => row.plan?.name || '-', align: 'left' },
        { name: 'method', label: 'Método', field: 'method', align: 'left' },
        { name: 'amount', label: 'Valor', field: 'amount', align: 'left' },
        { name: 'status', label: 'Status', field: 'status', align: 'left' }
      ]
    }
  },
  computed: {
    assinaturaExpirada () {
      return this.resumo.accessDaysRemaining === 0
    },
    avisoPagamento () {
      const status = this.resumo.payments?.[0]?.status
      if (!status) return ''
      if (status === 'RECEIVED') return 'Pagamento recebido. O acesso da empresa foi atualizado.'
      if (status === 'CONFIRMED') return 'Pagamento confirmado. A liberacao sera atualizada conforme a regra configurada.'
      if (status === 'OVERDUE') return 'Pagamento vencido. Gere uma nova cobranca ou regularize o pagamento pendente.'
      if (status === 'PENDING') return 'Pagamento pendente. A liberacao ocorre automaticamente apos a confirmacao do Asaas.'
      return `Ultimo pagamento: ${status}.`
    }
  },
  methods: {
    formatarMoeda (value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    },
    formatarData (value) {
      return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : 'Não definido'
    },
    async carregar () {
      this.loading = true
      try {
        const [{ data: planos }, { data: resumo }] = await Promise.all([
          ListarPlanosDisponiveis(),
          ConsultarAssinatura()
        ])
        this.planos = planos
        this.resumo = resumo
      } catch (error) {
        this.$notificarErro('Não foi possível carregar sua assinatura.', error)
      } finally {
        this.loading = false
      }
    },
    async gerarPagamento (planId, method) {
      this.loadingPayment = true
      try {
        const { data } = await CriarPagamento({ planId, method })
        this.pagamentoAtual = data
        await this.carregar()
        const hasPix = data.method === 'PIX' && data.pixQrCode
        const pixFallback = method === 'PIX' && !hasPix
        this.$q.notify({
          type: pixFallback ? 'warning' : 'positive',
          message: hasPix
            ? 'Pix gerado. Aguarde a confirmacao apos o pagamento.'
            : pixFallback
              ? 'Pix indisponivel no Asaas. Use a pagina segura de pagamento.'
              : 'Pagina segura de pagamento gerada.'
        })
      } catch (error) {
        this.$notificarErro('Não foi possível gerar o pagamento.', error)
      } finally {
        this.loadingPayment = false
      }
    },
    async copiarPix () {
      await navigator.clipboard.writeText(this.pagamentoAtual.pixCopyPaste)
      this.$q.notify({ type: 'positive', message: 'Código Pix copiado.' })
    },
    async logout () {
      try {
        await RealizarLogout()
      } finally {
        localStorage.clear()
        this.$router.replace({ name: 'login' })
      }
    }
  },
  mounted () {
    this.carregar()
  }
}
</script>
