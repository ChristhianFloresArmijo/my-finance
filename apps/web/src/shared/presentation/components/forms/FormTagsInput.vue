<template>
  <TagsInput.Root
    :value="modelValue"
    :disabled="disabled"
    :max="max"
    class="space-y-2"
    @value-change="handleChange"
  >
    <TagsInput.Label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </TagsInput.Label>

    <TagsInput.Control
      class="flex min-h-[2.625rem] w-full flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
      :class="{ 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500': error }"
    >
      <TagsInput.Item
        v-for="(tag, index) in modelValue"
        :key="index"
        :index="index"
        :value="tag"
        class="flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-sm font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200"
      >
        <TagsInput.ItemPreview>
          <TagsInput.ItemText>{{ tag }}</TagsInput.ItemText>
          <TagsInput.ItemDeleteTrigger
            class="ml-1 rounded-sm text-primary-600 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-100 focus:outline-none"
            aria-label="Remove tag"
          >
            <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </TagsInput.ItemDeleteTrigger>
        </TagsInput.ItemPreview>
        <TagsInput.ItemInput class="w-full bg-transparent outline-none" />
      </TagsInput.Item>

      <TagsInput.Input
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        class="min-w-[6rem] flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
      />
      <TagsInput.HiddenInput :name="name" />
    </TagsInput.Control>

    <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </TagsInput.Root>
</template>

<script setup lang="ts">
import { TagsInput } from '@ark-ui/vue/tags-input'

interface Props {
  name: string
  label?: string
  modelValue?: string[]
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
  max?: number
}

withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const handleChange = (details: { value: string[] }) => {
  emit('update:modelValue', details.value)
}
</script>
