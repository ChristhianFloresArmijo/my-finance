<template>
  <Popover.Root>
    <Popover.Trigger as-child>
      <slot name="trigger" />
    </Popover.Trigger>
    <Popover.Positioner>
      <Popover.Content
        class="z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <Popover.Arrow class="text-white dark:text-gray-800">
          <Popover.ArrowTip class="border-gray-200 dark:border-gray-700" />
        </Popover.Arrow>

        <div v-if="title" class="mb-2 font-medium text-gray-900 dark:text-white">{{ title }}</div>

        <slot />

        <Popover.CloseTrigger
          v-if="showClose"
          class="absolute right-3 top-3 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </Popover.CloseTrigger>
      </Popover.Content>
    </Popover.Positioner>
  </Popover.Root>
</template>

<script setup lang="ts">
import { Popover } from '@ark-ui/vue/popover'

interface Props {
  title?: string
  showClose?: boolean
}

withDefaults(defineProps<Props>(), { showClose: true })
</script>
