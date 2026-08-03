<template>
  <Checkbox.Root
    :checked="checked"
    :disabled="disabled"
    class="flex items-start space-x-3"
    @checked-change="handleChange"
  >
    <Checkbox.Control
      class="mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 bg-white transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600"
      :class="{ 'border-red-500': error }"
    >
      <Checkbox.Indicator>
        <svg
          class="h-3.5 w-3.5 text-white"
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
      </Checkbox.Indicator>
    </Checkbox.Control>

    <div class="flex-1 space-y-1">
      <Checkbox.Label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </Checkbox.Label>

      <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>

    <Checkbox.HiddenInput />
  </Checkbox.Root>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Checkbox } from '@ark-ui/vue/checkbox';

interface Props {
  name: string;
  label: string;
  modelValue?: boolean;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const checked = computed(() => props.modelValue);

const handleChange = (details: { checked: boolean | 'indeterminate' }) => {
  emit('update:modelValue', details.checked === true);
};
</script>
