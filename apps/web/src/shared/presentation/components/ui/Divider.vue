<template>
  <div :class="orientation === 'vertical' ? 'flex h-full items-center' : 'flex items-center gap-4'">
    <div
      :class="[
        'bg-gray-200 dark:bg-gray-700',
        orientation === 'vertical' ? 'h-full w-px' : 'h-px flex-1',
      ]"
    />
    <span
      v-if="$slots.default"
      class="shrink-0 text-sm text-gray-500 dark:text-gray-400"
    >
      <slot />
    </span>
    <div
      v-if="$slots.default"
      :class="[
        'bg-gray-200 dark:bg-gray-700',
        orientation === 'vertical' ? 'h-full w-px' : 'h-px flex-1',
      ]"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical'
}

withDefaults(defineProps<Props>(), { orientation: 'horizontal' })
</script>
