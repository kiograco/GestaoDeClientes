<template>
  <q-page padding class="portal-page">
    <div class="portal-shell">
      <q-card flat bordered>
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="text-h5 text-weight-medium">{{ proposta.title || 'Proposta comercial' }}</div>
            <div class="text-caption text-grey-7">{{ proposta.contact ? proposta.contact.name : '' }}</div>
          </div>
          <div class="col-12 col-md-auto">
            <q-badge outline color="primary">{{ statusLabel(proposta.status) }}</q-badge>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Itens</div>
            <q-markup-table flat bordered dense>
              <thead>
                <tr>
                  <th class="text-left">Descricao</th>
                  <th class="text-right">Qtd.</th>
                  <th class="text-right">Unitario</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in proposta.items || []" :key="index">
                  <td>{{ item.description }}</td>
                  <td class="text-right">{{ item.quantity }}</td>
                  <td class="text-right">{{ formatarMoeda(item.unitPrice) }}</td>
                  <td class="text-right">{{ formatarMoeda(item.totalPrice) }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
          <div class="col-12 col-md-4">
            <q-list bordered separator>
              <q-item>
                <q-item-section>Subtotal</q-item-section>
                <q-item-section side>{{ formatarMoeda(proposta.subtotal) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Desconto</q-item-section>
                <q-item-section side>{{ formatarMoeda(proposta.discount) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section class="text-weight-medium">Total</q-item-section>
                <q-item-section side class="text-weight-medium">{{ formatarMoeda(proposta.total) }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-section v-if="proposta.observation">
          <div class="text-subtitle2 text-weight-medium">Observacoes</div>
          <div class="text-body2">{{ proposta.observation }}</div>
        </q-card-section>

        <q-card-section v-if="ordemServico">
          <div class="text-subtitle2 text-weight-medium">Ordem de servico</div>
          <div class="text-body2">#{{ ordemServico.id }} - {{ ordemServico.title }} - {{ ordemServico.status }}</div>
          <div class="text-caption text-grey-7">{{ ordemServico.address }} {{ ordemServico.city }} {{ ordemServico.state }}</div>
        </q-card-section>

        <q-card-actions align="between">
          <q-btn flat color="negative" icon="mdi-file-pdf-box" label="Baixar PDF" @click="baixarPdf" />
          <q-btn unelevated color="positive" icon="mdi-check" label="Aprovar proposta" :disable="proposta.status === 'aprovada' || proposta.status === 'convertida'" :loading="salvando" @click="aprovar" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import {
  AprovarPropostaPortal,
  DocumentoPropostaPortal,
  ObterOrdemServicoPortal,
  ObterPropostaPortal
} from 'src/service/portalCliente'

export default {
  name: 'PortalClienteProposta',
  data () {
    return {
      proposta: {},
      ordemServico: null,
      salvando: false
    }
  },
  mounted () {
    this.carregar()
  },
  methods: {
    async carregar () {
      const token = this.$route.params.token
      const [{ data: proposta }, { data: ordemServico }] = await Promise.all([
        ObterPropostaPortal(token),
        ObterOrdemServicoPortal(token)
      ])
      this.proposta = proposta
      this.ordemServico = ordemServico
    },
    async aprovar () {
      this.salvando = true
      try {
        const { data } = await AprovarPropostaPortal(this.$route.params.token)
        this.proposta = data
        this.$q.notify({ type: 'positive', message: 'Proposta aprovada.' })
      } catch (error) {
        this.$notificarErro('Nao foi possivel aprovar a proposta', error)
      } finally {
        this.salvando = false
      }
    },
    async baixarPdf () {
      const { data } = await DocumentoPropostaPortal(this.$route.params.token)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    },
    statusLabel (status) {
      const labels = {
        rascunho: 'Rascunho',
        enviada: 'Enviada',
        aprovada: 'Aprovada',
        rejeitada: 'Rejeitada',
        convertida: 'Convertida'
      }
      return labels[status] || status || '-'
    },
    formatarMoeda (value) {
      const parsed = Number(value || 0)
      return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  }
}
</script>

<style scoped>
.portal-page {
  background: #f8fafc;
}

.portal-shell {
  max-width: 980px;
  margin: 32px auto;
}
</style>
