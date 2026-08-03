<template>
  <Slider.Root
    :value="sliderValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    class="space-y-3"
    @value-change="handleChange"
  >
    <div class="flex items-center justify-between">
      <Slider.Label
        v-if="label"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </Slider.Label>
      <Slider.ValueText class="text-sm font-medium text-gray-900 dark:text-white" />
    </div>

    <Slider.Control class="relative flex w-full touch-none select-none items-center">
      <Slider.Track class="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <Slider.Range class="absolute h-full bg-primary-600 dark:bg-primary-500" />
      </Slider.Track>
      <Slider.Thumb
        :index="0"
        class="block h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-primary-400 dark:bg-gray-800"
      >
        <Slider.HiddenInput :name="name" />
      </Slider.Thumb>
    </Slider.Control>

    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>

    <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </Slider.Root>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@ark-ui/vue/slider'

interface Props {
  name: string
  label?: string
  modelValue?: number
  min?: number
  max?: number
  step?: number
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const sliderValue = computed(() => [props.modelValue ?? props.min])

const handleChange = (details: { value: number[] }) => {
  if (details.value[0] !== undefined) {
    emit('update:modelValue', details.value[0])
  }
}
</script>
