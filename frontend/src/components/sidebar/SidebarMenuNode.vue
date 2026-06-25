<template>
  <div>
    <q-expansion-item
      v-if="hasChildren"
      dense
      expand-separator
      :value="isOpen"
      :class="[
        'app-menu-group',
        { 'app-menu-group--active': isActiveBranch, 'app-menu-group--collapsed': collapsed }
      ]"
      @input="$emit('toggle', node.key)"
    >
      <template v-slot:header>
        <q-item-section
          v-if="node.icon"
          avatar
        >
          <q-icon :name="node.icon" />
        </q-item-section>
        <q-item-section v-show="!collapsed">
          <q-item-label>{{ node.title }}</q-item-label>
        </q-item-section>
        <q-tooltip
          v-if="collapsed"
          anchor="center right"
          self="center left"
        >
          {{ node.title }}
        </q-tooltip>
      </template>

      <div
        v-show="!collapsed"
        class="app-menu-children"
      >
        <SidebarMenuNode
          v-for="child in node.children"
          :key="child.key"
          :node="child"
          :collapsed="collapsed"
          :opened="opened"
          :current-route-name="currentRouteName"
          :current-query="currentQuery"
          @toggle="$emit('toggle', $event)"
        />
      </div>
    </q-expansion-item>

    <EssentialLink
      v-else
      v-bind="node"
    />
  </div>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'

export default {
  name: 'SidebarMenuNode',
  components: { EssentialLink },
  props: {
    node: {
      type: Object,
      required: true
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    opened: {
      type: Object,
      default: () => ({})
    },
    currentRouteName: {
      type: String,
      default: ''
    },
    currentQuery: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    hasChildren () {
      return Array.isArray(this.node.children) && this.node.children.length > 0
    },
    isOpen () {
      return this.opened[this.node.key] !== false
    },
    isActiveBranch () {
      return this.hasActiveItem(this.node)
    }
  },
  methods: {
    hasActiveItem (node) {
      if (!node) return false
      if (node.routeName === this.currentRouteName) {
        const query = node.query || {}
        return Object.keys(query).every(key => this.currentQuery[key] === query[key])
      }
      return Array.isArray(node.children) && node.children.some(child => this.hasActiveItem(child))
    }
  }
}
</script>
