<template>
  <Combobox.Root
    v-model="selected"
    :collection="collection"
    :disabled="disabled"
    :open-on-click="true"
    class="space-y-2"
    @input-value-change="handleInputChange"
  >
    <Combobox.Label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </Combobox.Label>

    <Combobox.Control class="relative">
      <Combobox.Input
        :name="name"
        :placeholder="placeholder"
        class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400"
        :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
      />
      <div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        <Combobox.ClearTrigger
          v-if="selected.length > 0"
          class="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Clear"
        >
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </Combobox.ClearTrigger>
        <Combobox.Trigger class="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </Combobox.Trigger>
      </div>
    </Combobox.Control>

    <Combobox.Positioner>
      <Combobox.Content
        class="z-50 max-h-60 w-(--reference-width) overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <Combobox.ItemGroup>
          <Combobox.Item
            v-for="option in filteredOptions"
            :key="String(option.value)"
            :item="option"
            class="cursor-pointer px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 data-highlighted:bg-primary-50 dark:data-highlighted:bg-primary-900"
          >
            <Combobox.ItemText>{{ option.label }}</Combobox.ItemText>
            <Combobox.ItemIndicator class="ml-auto">
              <svg class="h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            </Combobox.ItemIndicator>
          </Combobox.Item>
          <div v-if="filteredOptions.length === 0" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No results found
          </div>
        </Combobox.ItemGroup>
      </Combobox.Content>
    </Combobox.Positioner>

    <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </Combobox.Root>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Combobox, createListCollection } from '@ark-ui/vue/combobox'

interface Option {
  label: string
  value: string | number
}

interface Props {
  name: string
  label?: string
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputFilter = ref('')
const selected = ref<string[]>(props.modelValue !== undefined ? [String(props.modelValue)] : [])

const filteredOptions = computed(() =>
  inputFilter.value
    ? props.options.filter((opt) =>
        opt.label.toLowerCase().includes(inputFilter.value.toLowerCase()),
      )
    : props.options,
)

const collection = computed(() =>
  createListCollection({
    items: filteredOptions.value,
    itemToValue: (item) => String(item.value),
    itemToString: (item) => item.label,
  }),
)

const handleInputChange = (details: { inputValue?: string; value?: string }) => {
  inputFilter.value = details.inputValue ?? details.value ?? ''
}

watch(selected, (newValue) => {
  if (newValue.length > 0) {
    const option = props.options.find((opt) => String(opt.value) === newValue[0])
    if (option) emit('update:modelValue', option.value)
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) selected.value = [String(newValue)]
  },
)
</script>
