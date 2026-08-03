<template>
  <div v-if="visible" :class="[baseClasses, variantClasses[variant].container]" role="alert">
    <div class="flex items-start gap-3">
      <svg
        :class="['mt-0.5 h-5 w-5 shrink-0', variantClasses[variant].icon]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path v-if="variant === 'success'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        <path v-else-if="variant === 'danger'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        <path v-else-if="variant === 'warning'" fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
      </svg>

      <div class="flex-1">
        <p v-if="title" :class="['font-medium', variantClasses[variant].title]">{{ title }}</p>
        <div :class="['text-sm', variantClasses[variant].body, { 'mt-1': title }]">
          <slot />
        </div>
      </div>

      <button
        v-if="dismissible"
        type="button"
        :class="['rounded p-0.5 transition-colors', variantClasses[variant].close]"
        aria-label="Dismiss"
        @click="visible = false"
      >
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Variant = 'info' | 'success' | 'warning' | 'danger'

interface Props {
  variant?: Variant
  title?: string
  dismissible?: boolean
}

withDefaults(defineProps<Props>(), { variant: 'info', dismissible: false })

const visible = ref(true)

const baseClasses = 'rounded-lg p-4'

const variantClasses: Record<Variant, Record<string, string>> = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    body: 'text-blue-700 dark:text-blue-300',
    close: 'text-blue-500 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    body: 'text-green-700 dark:text-green-300',
    close: 'text-green-500 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-500 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    body: 'text-yellow-700 dark:text-yellow-300',
    close: 'text-yellow-500 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900',
  },
  danger: {
    container: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    body: 'text-red-700 dark:text-red-300',
    close: 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900',
  },
}
</script>
