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

    <PasswordInput.Root class="relative">
      <PasswordInput.Input
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400"
        :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
        @input="handleInput"
        @blur="handleBlur"
      />
      <PasswordInput.Control class="absolute inset-y-0 right-0 flex items-center pr-3">
        <PasswordInput.VisibilityTrigger
          class="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
          aria-label="Toggle password visibility"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
          </svg>
        </PasswordInput.VisibilityTrigger>
      </PasswordInput.Control>
    </PasswordInput.Root>

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
import { Field } from '@ark-ui/vue/field'
import { PasswordInput } from '@ark-ui/vue/password-input'

interface Props {
  name: string
  label?: string
  modelValue?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const handleBlur = () => {
  emit('blur')
}
</script>
