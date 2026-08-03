<template>
  <DatePicker.Root
    v-model="dateValue"
    :disabled="disabled"
    :open="open"
    @open-change="handleOpenChange"
  >
    <div class="space-y-2">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <DatePicker.Control class="flex w-full items-center space-x-2">
        <DatePicker.Input
          :index="0"
          class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
        />
        <DatePicker.Trigger
          class="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
              clip-rule="evenodd"
            />
          </svg>
        </DatePicker.Trigger>
      </DatePicker.Control>

      <DatePicker.Positioner>
        <DatePicker.Content
          class="z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-4 flex items-center justify-between">
            <DatePicker.ViewControl>
              <DatePicker.PrevTrigger class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </DatePicker.PrevTrigger>

              <DatePicker.ViewTrigger
                class="rounded px-3 py-1 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <DatePicker.RangeText />
              </DatePicker.ViewTrigger>

              <DatePicker.NextTrigger class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </DatePicker.NextTrigger>
            </DatePicker.ViewControl>
          </div>

          <DatePicker.View view="day">
            <DatePicker.Context v-slot="{ weeks, weekDays }">
              <table class="w-full">
                <thead>
                  <tr>
                    <th
                      v-for="(weekDay, idx) in weekDays"
                      :key="idx"
                      class="p-2 text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      {{ weekDay.narrow }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(week, weekIdx) in weeks" :key="weekIdx">
                    <td v-for="(day, dayIdx) in week" :key="dayIdx" class="p-1">
                      <DatePicker.TableCell :value="day">
                        <DatePicker.TableCellTrigger
                          class="h-9 w-9 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 data-outside-range:text-gray-400 data-selected:bg-primary-600 data-selected:text-white data-today:border data-today:border-primary-600"
                        >
                          {{ day.day }}
                        </DatePicker.TableCellTrigger>
                      </DatePicker.TableCell>
                    </td>
                  </tr>
                </tbody>
              </table>
            </DatePicker.Context>
          </DatePicker.View>
        </DatePicker.Content>
      </DatePicker.Positioner>

      <p v-if="description && !error" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>
  </DatePicker.Root>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DatePicker, parseDate } from '@ark-ui/vue/date-picker';

interface Props {
  name: string;
  label?: string;
  modelValue?: Date;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Date];
}>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateValue = ref<any[]>(props.modelValue ? [parseDate(props.modelValue)] : []);
const open = ref(false);

const handleOpenChange = (details: { open: boolean }) => {
  open.value = details.open;
};

watch(dateValue, (newValue) => {
  const first = newValue[0];
  if (first) {
    emit('update:modelValue', new Date(first.year, first.month - 1, first.day));
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      dateValue.value = [parseDate(newValue)];
    }
  }
);
</script>
