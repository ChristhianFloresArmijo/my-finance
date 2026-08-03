<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses[variant], sizeClasses[size], { 'opacity-50 cursor-not-allowed': disabled || loading }]"
    v-bind="$attrs"
  >
    <span v-if="loading" class="flex items-center gap-2">
      <Spinner :size="spinnerSize" />
      <slot />
    </span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Spinner from './Spinner.vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
})

defineOptions({ inheritAttrs: false })

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
  secondary:
    'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  link: 'text-primary-600 underline-offset-4 hover:underline dark:text-primary-400 focus:ring-0 focus:ring-offset-0',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

const spinnerSizeMap: Record<Size, Size> = { sm: 'sm', md: 'sm', lg: 'md' }
const spinnerSize = computed(() => spinnerSizeMap[props.size])
</script>
