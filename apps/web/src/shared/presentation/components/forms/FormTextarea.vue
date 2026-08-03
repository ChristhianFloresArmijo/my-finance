<template>
  <Field.Root
    :invalid="!!error"
    :disabled="disabled"
    :required="required"
    class="space-y-2"
  >
    <Field.Label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </Field.Label>

    <Field.Textarea
      :id="textareaId"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      class="block w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
      @input="handleInput"
      @blur="handleBlur"
    />

    <Field.HelperText
      v-if="description && !error"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </Field.HelperText>

    <Field.ErrorText class="text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </Field.ErrorText>
  </Field.Root>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Field } from '@ark-ui/vue/field'

interface Props {
  id?: string
  name: string
  label?: string
  modelValue?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const textareaId = computed(() => props.id || `textarea-${props.name}`)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}
</script>
