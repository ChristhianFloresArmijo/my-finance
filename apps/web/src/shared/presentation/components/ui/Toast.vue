<template>
  <Toaster :toaster="toaster">
    <template #default="toast">
      <Toast.Root
        :toast="toast"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg dark:bg-gray-800"
        :class="containerClasses[toast.type as ToastType] ?? containerClasses.info"
      >
        <div
          :class="['mt-0.5 h-5 w-5 shrink-0', iconClasses[toast.type as ToastType] ?? iconClasses.info]"
        >
          <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex-1 overflow-hidden">
          <Toast.Title class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ toast.title }}
          </Toast.Title>
          <Toast.Description
            v-if="toast.description"
            class="mt-0.5 text-sm text-gray-600 dark:text-gray-400"
          >
            {{ toast.description }}
          </Toast.Description>
        </div>

        <Toast.CloseTrigger
          class="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Dismiss"
        >
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </Toast.CloseTrigger>
      </Toast.Root>
    </template>
  </Toaster>
</template>

<script setup lang="ts">
import { Toaster, Toast } from '@ark-ui/vue/toast'
import { toaster } from '@/shared/presentation/composables/useToast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const containerClasses: Record<ToastType, string> = {
  success: 'border-green-200 dark:border-green-800',
  error: 'border-red-200 dark:border-red-800',
  warning: 'border-yellow-200 dark:border-yellow-800',
  info: 'border-blue-200 dark:border-blue-800',
}

const iconClasses: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}
</script>
