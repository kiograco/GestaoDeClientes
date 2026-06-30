<template>
  <div>
    <q-item>
      <q-item-section avatar>
        <q-icon
          v-if="item.status === 'DISCONNECTED'"
          color="negative"
          size="2.5em"
          name="mdi-wifi-alert"
        />
        <q-icon
          v-if="item.status === 'CONNECTED'"
          name="mdi-wifi-arrow-up-down"
          color="green-8"
          size="2.5em"
        />
        <q-icon
          v-if="['PAIRING', 'TIMEOUT'].includes(item.status)"
          color="negative"
          size="2.5em"
          name="mdi-wifi-strength-1-alert"
        />
        <q-spinner
          v-if="item.status === 'OPENING'"
          color="green-7"
          size="3em"
          :thickness="2"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label v-if="item.status === 'DISCONNECTED'">
          <span class="text-weight-medium">Falha ao iniciar comunicacao pela API Meta.</span>
          <span class="row col">Revise o Phone Number ID, o token Meta e a configuracao do webhook.</span>
        </q-item-label>
        <q-item-label v-if="item.status === 'CONNECTED'">
          <span class="text-weight-medium">Conexao estabelecida pela Meta.</span>
        </q-item-label>
        <q-item-label v-if="['PAIRING', 'TIMEOUT'].includes(item.status)">
          <span class="text-weight-medium">A conexao Meta nao respondeu dentro do tempo esperado.</span>
          <span class="row col">Desconecte e conecte novamente apos revisar token e Phone Number ID.</span>
        </q-item-label>
        <q-item-label v-if="item.status === 'OPENING'">
          <span class="text-weight-medium">Estabelecendo conexao com a API Meta.</span>
          <span class="row col">Isso podera demorar um pouco...</span>
        </q-item-label>
        <q-item-label caption>
          Ultima Atualizacao: {{ formatarData(item.updatedAt, 'dd/MM/yyyy HH:mm') }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>

<script>
import { format, parseISO } from 'date-fns'
import pt from 'date-fns/locale/pt-BR/index'

export default {
  name: 'ItemStatusChannel',
  props: {
    item: {
      type: Object,
      default: () => { }
    }
  },
  methods: {
    formatarData (data, formato) {
      return format(parseISO(data), formato, { locale: pt })
    }
  }
}
</script>
