<template>
  <span :class="[baseClasses, variantClasses[variant], sizeClasses[size]]">
    <slot />
  </span>
</template>

<script setup lang="ts">
type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
type Size = 'sm' | 'md'

interface Props {
  variant?: Variant
  size?: Size
}

withDefaults(defineProps<Props>(), { variant: 'neutral', size: 'md' })

const baseClasses = 'inline-flex items-center rounded-full font-medium'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
  success:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutral:
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
}
</script>
