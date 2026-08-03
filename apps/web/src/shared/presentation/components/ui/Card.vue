<template>
  <div :class="[baseClasses, variantClasses[variant]]">
    <slot />
  </div>
</template>

<script setup lang="ts">
type Variant = 'default' | 'bordered' | 'elevated'

interface Props {
  variant?: Variant
}

withDefaults(defineProps<Props>(), { variant: 'default' })

const baseClasses = 'rounded-lg bg-white p-6 dark:bg-gray-800'

const variantClasses: Record<Variant, string> = {
  default: 'shadow',
  bordered: 'border border-gray-200 dark:border-gray-700',
  elevated: 'shadow-lg',
}
</script>
