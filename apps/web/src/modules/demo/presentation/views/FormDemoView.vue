<template>
  <div class="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl px-4">
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Dynamic Form Generator Demo
      </h1>
      <p class="mb-8 text-gray-600 dark:text-gray-400">
        Forms auto-generated from Zod schemas using ZodFormGenerator.
      </p>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">User Form</h2>
          <DynamicForm :schema="userSchema" :actions="userActions" />
          <div v-if="userResult" class="mt-4">
            <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Submitted:</p>
            <pre
              class="overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >{{ JSON.stringify(userResult, null, 2) }}</pre>
          </div>
        </Card>

        <Card>
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Product Form</h2>
          <DynamicForm :schema="productSchema" :actions="productActions" />
          <div v-if="productResult" class="mt-4">
            <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Submitted:</p>
            <pre
              class="overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >{{ JSON.stringify(productResult, null, 2) }}</pre>
          </div>
        </Card>
      </div>

      <Card class="mt-8">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">How it works</h2>
        <pre
          class="overflow-auto rounded bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >{{ codeExample }}</pre>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { DynamicForm, type FormAction } from '@/shared/presentation/components/forms'
import { Card } from '@/shared/presentation/components/ui'

const userResult = ref<Record<string, unknown> | null>(null)
const productResult = ref<Record<string, unknown> | null>(null)

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18').max(120),
  bio: z.string().max(500, 'Bio too long').optional(),
  newsletter: z.boolean().describe('Subscribe to newsletter'),
})

const productSchema = z.object({
  title: z.string().min(3, 'Title required'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'books', 'other']),
  description: z.string().max(1000, 'Description too long').optional(),
  inStock: z.boolean().describe('Available in stock'),
})

const userActions: FormAction[] = [
  {
    label: 'Submit',
    variant: 'primary',
    callback: async (values) => {
      userResult.value = values
    },
  },
]

const productActions: FormAction[] = [
  {
    label: 'Submit',
    variant: 'primary',
    callback: async (values) => {
      productResult.value = values
    },
  },
]

const codeExample = `// Define your Zod schema
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  active: z.boolean(),
});

// Pass actions with callbacks — DynamicForm awaits them
<DynamicForm
  :schema="schema"
  :actions="[{ label: 'Submit', callback: handleSubmit }]"
/>`
</script>
