<template>
  <q-item
    :key="wbot.id"
    v-ripple
    clickable
    dense
    class="full-width full-height"
  >
    <q-item-section avatar>
      <q-icon
        :color="currentStatus.color"
        size="2.5em"
        :name="currentStatus.icon"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label lines="1">
        Nome: {{ wbot.name }}
      </q-item-label>
      <q-item-label
        caption
        lines="1"
      >
        {{ currentStatus.status }}
      </q-item-label>
      <q-item-label
        caption
        lines="3"
        v-if="isIconStatusMenu"
      >
        {{ currentStatus.description }}
      </q-item-label>
    </q-item-section>
    <q-tooltip
      v-if="!isIconStatusMenu"
      content-class="bg-light-blue-1 text-black q-pa-sm shadow-4"
    >
      <span class="text-weight-medium"> {{ currentStatus.description }} </span>
    </q-tooltip>
  </q-item>
</template>

<script>
const fallbackStatus = {
  color: 'warning',
  icon: 'mdi-alert-circle-outline',
  status: 'Status desconhecido',
  description: 'A conexao Meta retornou um status nao mapeado.'
}

export default {
  name: 'ItemStatusWhatsapp',
  props: {
    wbot: {
      type: Object,
      default: () => { }
    },
    isIconStatusMenu: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      status: {
        PAIRING: {
          color: 'info',
          icon: 'mdi-link-variant',
          status: 'Pareando via Meta',
          description: 'A conexao oficial da Meta esta finalizando o pareamento.'
        },
        TIMEOUT: {
          color: 'warning',
          icon: 'mdi-timer-outline',
          status: 'Timeout',
          description: 'A API Meta nao respondeu dentro do tempo esperado. Revise token, Phone Number ID e webhook.'
        },
        DISCONNECTED: {
          color: 'negative',
          icon: 'mdi-wifi-strength-1-alert',
          status: 'Desconectado',
          description: 'A conexao oficial da Meta esta desconectada. Revise as credenciais do numero.'
        },
        DESTROYED: {
          color: 'primary',
          icon: 'mdi-close-network-outline',
          status: 'Inativo',
          description: 'A conexao oficial da Meta esta inativa.'
        },
        CONFLICT: {
          color: 'warning',
          icon: 'mdi-alert-outline',
          status: 'Conflito',
          description: 'A conexao oficial da Meta retornou conflito. Revise a configuracao do numero.'
        },
        OPENING: {
          color: 'black',
          icon: 'mdi-connection',
          status: 'Conectando',
          description: 'Iniciando conexao com a API oficial da Meta.'
        },
        CONNECTED: {
          color: 'green-8',
          icon: 'mdi-wifi-arrow-up-down',
          status: 'Conectado',
          description: 'Conexao oficial da Meta estabelecida com sucesso.'
        }
      }
    }
  },
  computed: {
    currentStatus () {
      return this.status[this.wbot.status] || fallbackStatus
    }
  }
}
</script>

<style lang="scss" >
.notification-box {
  text-align: center;
}
.notification-bell {
  animation: bell 1s 1s both infinite;
}
.notification-bell * {
  display: block;
  margin: 0 auto;
  background-color: $negative;
  box-shadow: 0px 0px 10px $negative;
}
.bell-top {
  width: 6px;
  height: 6px;
  border-radius: 3px 3px 0 0;
}
.bell-middle {
  width: 20px;
  height: 15px;
  margin-top: -1px;
  border-radius: 12.5px 12.5px 0 0;
}
.bell-bottom {
  position: relative;
  z-index: 0;
  width: 25px;
  height: 4px;
}
.bell-bottom::before,
.bell-bottom::after {
  content: "";
  position: absolute;
  top: -4px;
}
.bell-bottom::before {
  left: 1px;
  border-bottom: 4px solid $negative;
  border-right: 0 solid transparent;
  border-left: 4px solid transparent;
}
.bell-bottom::after {
  right: 1px;
  border-bottom: 4px solid $negative;
  border-right: 4px solid transparent;
  border-left: 0 solid transparent;
}
.bell-rad {
  width: 8px;
  height: 4px;
  margin-top: 2px;
  border-radius: 0 0 4px 4px;
  animation: rad 1s 2s both infinite;
}
@keyframes bell {
  0% { transform: rotate(0); }
  10% { transform: rotate(30deg); }
  20% { transform: rotate(0); }
  80% { transform: rotate(0); }
  90% { transform: rotate(-30deg); }
  100% { transform: rotate(0); }
}
@keyframes rad {
  0% { transform: translateX(0); }
  10% { transform: translateX(6px); }
  20% { transform: translateX(0); }
  80% { transform: translateX(0); }
  90% { transform: translateX(-6px); }
  100% { transform: translateX(0); }
}
</style>
