<template>
  <Tabs.Root :value="modelValue" @value-change="handleChange">
    <Tabs.List class="flex border-b border-gray-200 dark:border-gray-700">
      <Tabs.Trigger
        v-for="tab in tabs"
        :key="tab.id"
        :value="tab.id"
        :disabled="tab.disabled"
        class="border-b-2 px-4 pb-4 text-sm font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:border-primary-500 data-[selected]:text-primary-600 dark:data-[selected]:text-primary-400 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        {{ tab.label }}
      </Tabs.Trigger>
      <Tabs.Indicator class="h-0.5 bg-primary-500" />
    </Tabs.List>

    <Tabs.Content
      v-for="tab in tabs"
      :key="tab.id"
      :value="tab.id"
      class="pt-6 focus:outline-none"
    >
      <slot :name="tab.id" />
    </Tabs.Content>
  </Tabs.Root>
</template>

<script setup lang="ts">
import { Tabs } from '@ark-ui/vue/tabs'

interface Tab {
  id: string
  label: string
  disabled?: boolean
}

interface Props {
  tabs: Tab[]
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleChange = (details: { value: string | null }) => {
  if (details.value) emit('update:modelValue', details.value)
}
</script>
