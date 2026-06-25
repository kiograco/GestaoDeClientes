<template>
  <q-item
    clickable
    v-ripple
    :disable="disabled"
    :active="isActive"
    active-class="app-menu-link-active"
    @click="navigate"
    class="app-menu-link"
    :class="{'text-negative text-bolder': color === 'negative'}"
    :aria-label="title"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="color === 'negative' ? 'mdi-cellphone-nfc-off' : icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label
        v-if="caption"
        caption
      >
        {{ caption }}
      </q-item-label>
    </q-item-section>
    <q-item-section
      v-if="disabled"
      side
    >
      <q-badge
        outline
        color="grey-7"
        label="Em breve"
      />
    </q-item-section>
    <q-tooltip anchor="center right" self="center left">
      <div class="text-weight-medium">{{ title }}</div>
      <div v-if="caption || disabled" class="text-caption">{{ disabled ? 'Em breve' : caption }}</div>
    </q-tooltip>
  </q-item>
</template>

<script>
export default {
  name: 'EssentialLink',
  data () {
    return {
      menuAtivo: 'dashboard'
    }
  },
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    color: {
      type: String,
      default: ''
    },

    routeName: {
      type: String,
      default: 'dashboard'
    },

    icon: {
      type: String,
      default: ''
    },

    query: {
      type: Object,
      default: () => ({})
    },

    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    cRouterName () {
      return this.$route.name
    },
    isActive () {
      if (this.routeName !== this.cRouterName) return false
      return Object.keys(this.query).every(key => this.$route.query[key] === this.query[key])
    }
  },
  methods: {
    navigate () {
      if (this.disabled || this.isActive) return
      this.$router.push({ name: this.routeName, query: this.query })
    }
  }
}
</script>
<style lang="sass">
.menu-link-active-item-top
  border-left: 3px solid var(--color-primary-600)
  position: relative
  height: 100%
</style>
