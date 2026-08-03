<template>
  <Dialog.Root :open="open" @open-change="handleOpenChange">
    <Dialog.Backdrop class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Dialog.Content
        class="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-800"
        :style="maxWidth ? { maxWidth } : {}"
      >
        <div class="p-6">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title
                v-if="title"
                class="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {{ title }}
              </Dialog.Title>
              <Dialog.Description
                v-if="description"
                class="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ description }}
              </Dialog.Description>
            </div>
            <Dialog.CloseTrigger
              class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Close dialog"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </Dialog.CloseTrigger>
          </div>

          <slot />

          <div v-if="$slots.footer" class="mt-6 flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
</template>

<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog'

interface Props {
  open: boolean
  title?: string
  description?: string
  maxWidth?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const handleOpenChange = (details: { open: boolean }) => {
  emit('update:open', details.open)
}
</script>
