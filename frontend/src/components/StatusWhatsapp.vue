<template>
  <div class="flex flex-inline q-gutter-sm">
    <div
      :key="wbot.id"
      v-for="wbot in metaWhatsapps"
    >
      <q-btn
        :key="wbot.id"
        v-if="isIconStatusMenu"
        unelevated
        round
        flat
        :color="!isInvalidConnect(wbot) ? 'green' : 'negative'"
      >
        <q-icon
          v-if="!isInvalidConnect(wbot)"
          name="mdi-wifi-check"
          size="2em"
        />
        <div
          v-if="isInvalidConnect(wbot)"
          class="notification-box"
        >
          <div class="notification-bell">
            <span class="bell-top"></span>
            <span class="bell-middle"></span>
            <span class="bell-bottom"></span>
            <span class="bell-rad"></span>
          </div>
        </div>
        <q-menu
          anchor="top right"
          self="top left"
        >
          <ItemStatusWhatsapp
            :key="wbot.id"
            :wbot="wbot"
          />
        </q-menu>
      </q-btn>
    </div>

    <transition
      transition-show="flip-up"
      transition-hide="flip-down"
    >
      <q-carousel
        v-if="!isIconStatusMenu && metaWhatsapps.length && isProblemConnect"
        ref="carouselStatusWhatsapp"
        v-model="idWbotVisible"
        transition-prev="slide-right"
        transition-next="slide-left"
        animated
        swipeable
        class="q-pa-none q-ma-none full-width bg-amber"
        height="90px"
      >
        <template v-for="(wbot, index) in metaWhatsapps" :key="wbot.id + index">
          <q-carousel-slide
            
            :name="index"
            class="q-pa-none q-ma-none"
          >
            <ItemStatusWhatsapp :wbot="wbot" />
          </q-carousel-slide>
        </template>
        <template v-slot:control>
          <q-carousel-control
            position="bottom-right"
            :offset="[10, 40]"
            class="q-gutter-xs"
            v-if="isBtnSlider"
          >
            <q-btn
              round
              flat
              dense
              color="white"
              text-color="black"
              icon="arrow_left"
              @click="$refs.carouselStatusWhatsapp.previous()"
            />
            <q-btn
              round
              flat
              dense
              color="white"
              text-color="black"
              icon="arrow_right"
              @click="$refs.carouselStatusWhatsapp.next()"
            />
          </q-carousel-control>
        </template>
      </q-carousel>
    </transition>
  </div>
</template>

<script>
import ItemStatusWhatsapp from './ItemStatusWhatsapp'
import { mapGetters } from 'vuex'

export default {
  name: 'StatusWhatsapp',
  components: {
    ItemStatusWhatsapp
  },
  props: {
    isIconStatusMenu: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      idWbotVisible: 0,
      isProblemConnect: false
    }
  },
  watch: {
    metaWhatsapps: {
      handler () {
        const problem = this.metaWhatsapps.findIndex(w => this.isInvalidConnect(w)) !== -1
        setTimeout(() => {
          this.isProblemConnect = problem
        }, 3000)
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    ...mapGetters(['whatsapps']),
    metaWhatsapps () {
      return this.whatsapps.filter(w => w.type === 'waba' && w.wabaBSP === 'meta')
    },
    isBtnSlider () {
      return this.metaWhatsapps.filter(w => this.isInvalidConnect(w)).length > 1
    }
  },
  methods: {
    isInvalidConnect (wbot) {
      return ['PAIRING', 'TIMEOUT', 'DISCONNECTED', 'DESTROYED', 'CONFLICT'].includes(wbot.status)
    }
  },
  mounted () {
    this.isProblemConnect = this.metaWhatsapps.findIndex(w => this.isInvalidConnect(w)) !== -1
  }
}
</script>
