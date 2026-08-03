<template>
  <Select.Root v-model="selected" :collection="collection" :disabled="disabled">
    <div class="space-y-2">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <Select.Trigger
        class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
      >
        <Select.ValueText :placeholder="placeholder" />
        <Select.Indicator>
          <svg
            class="h-5 w-5 text-gray-400"
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
        </Select.Indicator>
      </Select.Trigger>

      <Select.Positioner>
        <Select.Content
          class="z-50 max-h-60 w-(--reference-width) overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <Select.Item
            v-for="option in options"
            :key="option.value"
            :item="option"
            class="cursor-pointer px-4 py-2.5 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 data-highlighted:bg-primary-50 data-highlighted:dark:bg-primary-900"
          >
            <Select.ItemText>{{ option.label }}</Select.ItemText>
            <Select.ItemIndicator class="ml-auto">
              <svg
                class="h-5 w-5 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clip-rule="evenodd"
                />
              </svg>
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Positioner>

      <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>
  </Select.Root>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Select, createListCollection } from '@ark-ui/vue/select';

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  name: string;
  label?: string;
  modelValue?: string | number;
  placeholder?: string;
  description?: string;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const collection = computed(() =>
  createListCollection({
    items: props.options,
    itemToValue: (item) => String(item.value),
    itemToString: (item) => item.label,
  })
);

const selected = ref<string[]>(props.modelValue ? [String(props.modelValue)] : []);

watch(selected, (newValue) => {
  if (newValue.length > 0) {
    const option = props.options.find((opt) => String(opt.value) === newValue[0]);
    if (option) {
      emit('update:modelValue', option.value);
    }
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      selected.value = [String(newValue)];
    }
  }
);
</script>
