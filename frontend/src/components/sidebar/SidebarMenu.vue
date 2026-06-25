<template>
  <div class="app-sidebar-shell">
    <div class="app-sidebar-toolbar">
      <q-input
        v-if="!collapsed"
        v-model="search"
        dense
        outlined
        clearable
        class="app-sidebar-search"
        placeholder="Pesquisar no menu"
      >
        <template v-slot:prepend>
          <q-icon name="mdi-magnify" />
        </template>
      </q-input>

      <q-btn
        flat
        dense
        unelevated
        class="app-icon-btn app-sidebar-collapse"
        :icon="collapsed ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
        @click="$emit('update:collapsed', !collapsed)"
      >
        <q-tooltip>{{ collapsed ? 'Expandir menu' : 'Recolher menu' }}</q-tooltip>
      </q-btn>
    </div>

    <q-scroll-area class="app-sidebar-scroll">
      <q-list
        padding
        :key="profile"
        class="app-sidebar-list"
      >
        <SidebarMenuNode
          v-for="node in filteredMenu"
          :key="node.key"
          :node="node"
          :collapsed="collapsed"
          :opened="opened"
          :current-route-name="$route.name"
          :current-query="$route.query"
          @toggle="toggleOpen"
        />

        <q-item
          v-if="!filteredMenu.length && !collapsed"
          class="app-menu-empty"
        >
          <q-item-section>
            Nenhum item encontrado.
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script>
import SidebarMenuNode from './SidebarMenuNode.vue'

const STORAGE_KEY = 'crmSidebarOpenState'

export default {
  name: 'SidebarMenu',
  components: { SidebarMenuNode },
  props: {
    menu: {
      type: Array,
      default: () => []
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    profile: {
      type: String,
      default: 'user'
    }
  },
  data () {
    return {
      search: '',
      opened: this.loadOpenedState()
    }
  },
  computed: {
    filteredMenu () {
      const term = this.normalize(this.search)
      if (!term) return this.menu
      return this.filterNodes(this.menu, term)
    }
  },
  methods: {
    loadOpenedState () {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      } catch (error) {
        return {}
      }
    },
    persistOpenedState () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.opened))
    },
    toggleOpen (key) {
      this.$set(this.opened, key, this.opened[key] === false)
      this.persistOpenedState()
    },
    normalize (value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    },
    filterNodes (nodes, term) {
      return nodes.reduce((acc, node) => {
        const children = Array.isArray(node.children) ? this.filterNodes(node.children, term) : []
        const matches = this.normalize(`${node.title} ${node.caption || ''}`).includes(term)
        if (matches || children.length) {
          acc.push({ ...node, children })
        }
        return acc
      }, [])
    }
  }
}
</script>
