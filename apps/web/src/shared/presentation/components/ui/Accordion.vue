<template>
  <Accordion.Root :multiple="multiple" class="space-y-2">
    <Accordion.Item
      v-for="item in items"
      :key="item.id"
      :value="item.id"
      class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <Accordion.ItemTrigger
        class="flex w-full items-center justify-between bg-white px-4 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        {{ item.label }}
        <Accordion.ItemIndicator>
          <svg
            class="h-5 w-5 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent class="bg-white px-4 pb-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <slot :name="item.id">{{ item.content }}</slot>
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion.Root>
</template>

<script setup lang="ts">
import { Accordion } from '@ark-ui/vue/accordion'

export interface AccordionItem {
  id: string
  label: string
  content?: string
}

interface Props {
  items: AccordionItem[]
  multiple?: boolean
}

withDefaults(defineProps<Props>(), { multiple: false })
</script>
