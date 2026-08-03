<template>
  <form class="space-y-6" @submit.prevent>
    <div v-for="field in formDefinition.fields" :key="field.name" class="form-field">
      <FormInput
        v-if="field.type === 'text' || field.type === 'email'"
        v-model="(formData as Record<string, string | number | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :type="field.type"
        :placeholder="field.placeholder"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
        :min="field.validation.min"
        :max="field.validation.max"
        :pattern="field.validation.pattern"
        @blur="validateField(field.name)"
      />

      <FormPasswordInput
        v-else-if="field.type === 'password'"
        v-model="(formData as Record<string, string | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :placeholder="field.placeholder"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
        @blur="validateField(field.name)"
      />

      <FormInput
        v-else-if="field.type === 'number'"
        v-model="(formData as Record<string, string | number | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        type="number"
        :placeholder="field.placeholder"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
        :min="field.validation.min"
        :max="field.validation.max"
        @blur="validateField(field.name)"
      />

      <FormTextarea
        v-else-if="field.type === 'textarea'"
        v-model="(formData as Record<string, string | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :placeholder="field.placeholder"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
        @blur="validateField(field.name)"
      />

      <FormSelect
        v-else-if="field.type === 'select' && field.options"
        v-model="(formData as Record<string, string | number | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :options="field.options"
        :placeholder="field.placeholder"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
      />

      <FormSwitch
        v-else-if="field.type === 'switch'"
        v-model="(formData as Record<string, boolean | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
      />

      <FormCheckbox
        v-else-if="field.type === 'checkbox'"
        v-model="(formData as Record<string, boolean | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
      />

      <FormDatePicker
        v-else-if="field.type === 'date'"
        v-model="(formData as Record<string, Date | undefined>)[field.name]"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        :required="field.validation.required"
        :disabled="isSubmitting"
        :error="errors[field.name]"
      />
    </div>

    <div class="flex items-center justify-end gap-3 pt-4">
      <Button
        v-for="action in resolvedActions"
        :key="action.label"
        type="button"
        :variant="action.variant ?? 'primary'"
        :size="action.size ?? 'md'"
        :loading="isSubmitting"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { type ZodSchema, ZodError } from 'zod'
import { ZodFormGenerator, type FormDefinition } from '@/shared/integration/forms'
import { Button } from '@/shared/presentation/components/ui'
import FormInput from './FormInput.vue'
import FormPasswordInput from './FormPasswordInput.vue'
import FormTextarea from './FormTextarea.vue'
import FormSelect from './FormSelect.vue'
import FormCheckbox from './FormCheckbox.vue'
import FormSwitch from './FormSwitch.vue'
import FormDatePicker from './FormDatePicker.vue'
import type { FormAction } from './types'

export type { FormAction }

interface Props {
  schema: ZodSchema
  initialValues?: Record<string, unknown>
  actions?: FormAction[]
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitLabel: 'Submit',
})

const emit = defineEmits<{
  error: [error: Error]
}>()

const formDefinition = ref<FormDefinition>(ZodFormGenerator.generate(props.schema))

const formData = reactive<Record<string, unknown>>(
  props.initialValues || ZodFormGenerator.getDefaultValues(props.schema),
)
const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const touched = reactive<Record<string, boolean>>({})

const resolvedActions = computed<FormAction[]>(() => {
  if (props.actions && props.actions.length > 0) return props.actions
  return [
    {
      label: props.submitLabel,
      requiresValidation: true,
      variant: 'primary',
      callback: () => {
        // no-op default — consumers should always pass actions
      },
    },
  ]
})

const validateField = (fieldName: string) => {
  touched[fieldName] = true
  try {
    props.schema.parse(formData)
    delete errors[fieldName]
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const fieldError = error.errors.find((err) => err.path.includes(fieldName))
      if (fieldError) {
        errors[fieldName] = fieldError.message
      } else {
        delete errors[fieldName]
      }
    }
  }
}

const validateAll = () => {
  try {
    props.schema.parse(formData)
    Object.keys(errors).forEach((key) => delete errors[key])
    return true
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      Object.keys(errors).forEach((key) => delete errors[key])
      error.errors.forEach((err) => {
        const fieldName = err.path[0]
        if (fieldName) errors[String(fieldName)] = err.message
      })
    }
    return false
  }
}

const handleAction = async (action: FormAction) => {
  if (action.requiresValidation ?? true) {
    formDefinition.value.fields.forEach((field) => (touched[field.name] = true))
    if (!validateAll()) return
  }

  isSubmitting.value = true
  try {
    await action.callback({ ...formData })
  } catch (error) {
    emit('error', error instanceof Error ? error : new Error(String(error)))
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.schema,
  (newSchema) => {
    formDefinition.value = ZodFormGenerator.generate(newSchema)
  },
)

onMounted(() => {
  formDefinition.value.fields.forEach((field) => {
    touched[field.name] = false
  })
})
</script>
