<template>
  <Menu.Root :positioning="{ placement: 'bottom-start' }">
    <Menu.Trigger as-child>
      <slot name="trigger" />
    </Menu.Trigger>
    <Menu.Positioner>
      <Menu.Content
        class="z-50 min-w-[10rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <template v-for="item in items" :key="item.value">
          <Menu.Separator
            v-if="item.separator"
            class="my-1 border-t border-gray-200 dark:border-gray-700"
          />
          <Menu.Item
            v-else
            :value="item.value"
            :disabled="item.disabled"
            class="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700 data-highlighted:bg-gray-100 dark:data-highlighted:bg-gray-700"
            :class="{ 'text-red-600 dark:text-red-400': item.danger }"
            @click="emit('select', item)"
          >
            <span v-if="item.icon" class="h-4 w-4 shrink-0" v-html="item.icon" />
            {{ item.label }}
          </Menu.Item>
        </template>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>
</template>

<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu'

export interface MenuItem {
  label: string
  value: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

interface Props {
  items: MenuItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  select: [item: MenuItem]
}>()
</script>
