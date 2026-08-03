<template>
  <RadioGroup.Root
    :value="modelValue !== undefined ? String(modelValue) : undefined"
    :disabled="disabled"
    class="space-y-3"
    @value-change="handleChange"
  >
    <RadioGroup.Label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </RadioGroup.Label>

    <div :class="orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'">
      <RadioGroup.Item
        v-for="option in options"
        :key="String(option.value)"
        :value="String(option.value)"
        class="flex cursor-pointer items-center gap-3"
      >
        <RadioGroup.ItemControl
          class="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600"
        >
          <RadioGroup.Indicator class="h-1.5 w-1.5 rounded-full bg-white" />
        </RadioGroup.ItemControl>
        <RadioGroup.ItemText class="text-sm text-gray-700 dark:text-gray-300">
          {{ option.label }}
        </RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
      </RadioGroup.Item>
    </div>

    <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </RadioGroup.Root>
</template>

<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group'

interface Option {
  label: string
  value: string | number
}

interface Props {
  name: string
  label?: string
  modelValue?: string | number
  options: Option[]
  orientation?: 'vertical' | 'horizontal'
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'vertical',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleChange = (details: { value: string | null }) => {
  if (details.value === null) return
  const option = props.options.find((opt) => String(opt.value) === details.value)
  emit('update:modelValue', option ? option.value : details.value)
}
</script>
