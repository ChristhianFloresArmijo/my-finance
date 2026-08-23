<template>
  <div ref="root">
    <button
      class="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      @click.stop="toggle"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="19" r="2"/>
      </svg>
    </button>

    <Teleport to="body">
      <!-- click-away backdrop -->
      <div v-if="open" class="fixed inset-0 z-[100]" @click="open = false"/>
      <!-- menu -->
      <div
        v-if="open"
        :style="menuStyle"
        class="fixed z-[101] w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 text-sm"
      >
        <template v-for="(item, i) in items" :key="i">
          <div v-if="item.divider" class="my-1 border-t border-gray-100 dark:border-gray-700"/>
          <button
            v-else
            :disabled="item.disabled"
            class="w-full text-left px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="item.danger
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
            @click.stop="run(item)"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, type CSSProperties } from 'vue'

export interface MenuAction {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
  action?: () => void
}

defineProps<{ items: MenuAction[] }>()

const root = ref<HTMLElement>()
const open = ref(false)
const menuStyle = ref<CSSProperties>({})

function toggle() {
  if (!open.value) {
    const r = root.value!.getBoundingClientRect()
    const menuW = 176
    const left = r.right - menuW > 8 ? r.right - menuW : r.left
    menuStyle.value = {
      top: `${r.bottom + 4}px`,
      left: `${Math.max(8, left)}px`,
    }
  }
  open.value = !open.value
}

function run(item: MenuAction) {
  open.value = false
  item.action?.()
}
</script>
