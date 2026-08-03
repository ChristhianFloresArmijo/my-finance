<template>
  <Tooltip.Root :open-delay="openDelay" :close-delay="closeDelay">
    <Tooltip.Trigger as-child>
      <slot />
    </Tooltip.Trigger>
    <Tooltip.Positioner>
      <Tooltip.Content
        class="z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-gray-700"
      >
        <Tooltip.Arrow>
          <Tooltip.ArrowTip class="border-gray-900 dark:border-gray-700" />
        </Tooltip.Arrow>
        {{ content }}
      </Tooltip.Content>
    </Tooltip.Positioner>
  </Tooltip.Root>
</template>

<script setup lang="ts">
import { Tooltip } from '@ark-ui/vue/tooltip'

interface Props {
  content: string
  openDelay?: number
  closeDelay?: number
}

withDefaults(defineProps<Props>(), {
  openDelay: 300,
  closeDelay: 100,
})
</script>
