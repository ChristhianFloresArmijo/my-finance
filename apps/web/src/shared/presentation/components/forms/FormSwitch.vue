<template>
  <Switch.Root
    :checked="modelValue"
    :disabled="disabled"
    class="flex items-center justify-between gap-4"
    @checked-change="handleChange"
  >
    <div class="flex-1 space-y-1">
      <Switch.Label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </Switch.Label>
      <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <Switch.Control
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 data-[state=checked]:bg-primary-600"
    >
      <Switch.Thumb
        class="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out data-[state=checked]:translate-x-5"
      />
    </Switch.Control>

    <Switch.HiddenInput :name="name" />
  </Switch.Root>
</template>

<script setup lang="ts">
import { Switch } from '@ark-ui/vue/switch'

interface Props {
  name: string
  label: string
  modelValue?: boolean
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (details: { checked: boolean }) => {
  emit('update:modelValue', details.checked)
}
</script>
