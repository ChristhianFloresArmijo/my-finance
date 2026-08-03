<template>
  <Avatar.Root :class="[sizeClasses[size], 'relative inline-flex shrink-0 overflow-hidden rounded-full']">
    <Avatar.Image
      v-if="src"
      :src="src"
      :alt="alt"
      class="h-full w-full object-cover"
    />
    <Avatar.Fallback
      :class="[
        'flex h-full w-full items-center justify-center rounded-full font-medium',
        fallbackClasses,
      ]"
    >
      {{ initials }}
    </Avatar.Fallback>
  </Avatar.Root>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Avatar } from '@ark-ui/vue/avatar'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  src?: string
  alt?: string
  name?: string
  size?: Size
}

const props = withDefaults(defineProps<Props>(), { size: 'md', alt: '' })

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const fallbackClasses = 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>
