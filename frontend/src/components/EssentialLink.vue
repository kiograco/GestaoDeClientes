<template>
  <q-item
    clickable
    v-ripple
    :active="routeName == cRouterName"
    active-class="app-menu-link-active"
    @click=" () => !(routeName == cRouterName) ? $router.push({ name: routeName }) : ''"
    class="app-menu-link"
    :class="{'text-negative text-bolder': color === 'negative'}"
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
    }
  },
  computed: {
    cRouterName () {
      return this.$route.name
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
