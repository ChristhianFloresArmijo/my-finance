<template>
  <PinInput.Root
    :value="pinValue"
    :length="length"
    :disabled="disabled"
    :type="type"
    :mask="mask"
    class="space-y-3"
    @value-change="handleChange"
    @value-complete="handleComplete"
  >
    <PinInput.Label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </PinInput.Label>

    <PinInput.Control class="flex gap-2">
      <PinInput.Input
        v-for="(_, index) in Array.from({ length })"
        :key="index"
        :index="index"
        class="h-12 w-12 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
        :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
      />
    </PinInput.Control>

    <PinInput.HiddenInput :name="name" />

    <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </PinInput.Root>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PinInput } from '@ark-ui/vue/pin-input'

interface Props {
  name: string
  label?: string
  modelValue?: string
  length?: number
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  mask?: boolean
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  length: 6,
  type: 'numeric',
  mask: false,
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  complete: [value: string]
}>()

const pinValue = computed(() => props.modelValue?.split('') ?? [])

const handleChange = (details: { value: string[] }) => {
  emit('update:modelValue', details.value.join(''))
}

const handleComplete = (details: { value: string[] }) => {
  emit('complete', details.value.join(''))
}
</script>
