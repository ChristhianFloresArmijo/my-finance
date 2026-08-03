import {
  ZodSchema,
  ZodObject,
  ZodEffects,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodEnum,
  ZodDate,
  ZodArray,
  ZodOptional,
  ZodNullable,
} from 'zod';

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'switch';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string | number }>;
  validation: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface FormDefinition {
  fields: FieldDefinition[];
  submitLabel?: string;
  resetLabel?: string;
}

/**
 * Introspects Zod schemas and generates form field definitions.
 */
export class ZodFormGenerator {
  static generate(schema: ZodSchema): FormDefinition {
    // Unwrap ZodEffects (produced by .refine() / .transform() / .superRefine())
    // so that schemas like z.object({...}).refine(...) still work.
    let unwrapped: ZodSchema = schema;
    while (unwrapped instanceof ZodEffects) {
      unwrapped = unwrapped._def.schema;
    }
    if (!(unwrapped instanceof ZodObject)) {
      throw new Error('Schema must be a ZodObject');
    }

    const shape = (unwrapped as ZodObject<never>).shape;
    const fields: FieldDefinition[] = [];

    for (const [key, zodType] of Object.entries(shape)) {
      const field = this.generateField(key, zodType as ZodSchema);
      if (field) {
        fields.push(field);
      }
    }

    return {
      fields,
      submitLabel: 'Submit',
      resetLabel: 'Reset',
    };
  }

  private static generateField(name: string, zodType: ZodSchema): FieldDefinition | null {
    let innerType = zodType;
    let isOptional = false;

    if (zodType instanceof ZodOptional || zodType instanceof ZodNullable) {
      innerType = zodType._def.innerType;
      isOptional = true;
    }

    const description = zodType.description;

    let fieldType: FieldType = 'text';
    let options: Array<{ label: string; value: string | number }> | undefined;
    const validation: FieldDefinition['validation'] = {
      required: !isOptional,
    };

    if (innerType instanceof ZodString) {
      type ZodDefWithChecks = {
        _def?: { checks?: Array<{ kind: string; value?: number; regex?: RegExp }> };
      };
      const checks = (innerType as ZodDefWithChecks)._def?.checks ?? [];

      if (checks.find((c) => c.kind === 'email')) {
        fieldType = 'email';
      }

      const minCheck = checks.find((c) => c.kind === 'min');
      if (minCheck) validation.min = minCheck.value;

      const maxCheck = checks.find((c) => c.kind === 'max');
      if (maxCheck) validation.max = maxCheck.value;

      const regexCheck = checks.find((c) => c.kind === 'regex');
      if (regexCheck?.regex) validation.pattern = regexCheck.regex.source;

      if (validation.max && validation.max > 200) fieldType = 'textarea';
      if (name.toLowerCase().includes('password')) fieldType = 'password';
    }

    if (innerType instanceof ZodNumber) {
      fieldType = 'number';
      type ZodDefWithChecks = { _def?: { checks?: Array<{ kind: string; value?: number }> } };
      const checks = (innerType as ZodDefWithChecks)._def?.checks ?? [];

      const minCheck = checks.find((c) => c.kind === 'min');
      if (minCheck) validation.min = minCheck.value;

      const maxCheck = checks.find((c) => c.kind === 'max');
      if (maxCheck) validation.max = maxCheck.value;
    }

    if (innerType instanceof ZodBoolean) {
      fieldType = 'checkbox';
    }

    if (innerType instanceof ZodEnum) {
      fieldType = 'select';
      type ZodEnumDef = { _def?: { values?: unknown[] } };
      const values = (innerType as ZodEnumDef)._def?.values ?? [];
      options = values.map((value: unknown) => ({
        label: this.formatLabel(String(value)),
        value: typeof value === 'number' ? value : String(value),
      }));
    }

    if (innerType instanceof ZodDate) {
      fieldType = 'date';
    }

    const label = this.formatLabel(name);

    return {
      name,
      label,
      type: fieldType,
      placeholder: `Enter ${label.toLowerCase()}`,
      description,
      options,
      validation,
    };
  }

  private static formatLabel(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  static getDefaultValues(schema: ZodSchema): Record<string, unknown> {
    if (!(schema instanceof ZodObject)) {
      return {};
    }

    const shape = schema.shape;
    const defaults: Record<string, unknown> = {};

    for (const [key, zodType] of Object.entries(shape)) {
      const defaultValue = this.getDefaultValue(zodType as ZodSchema);
      if (defaultValue !== undefined) {
        defaults[key] = defaultValue;
      }
    }

    return defaults;
  }

  private static getDefaultValue(zodType: ZodSchema): unknown {
    let innerType = zodType;
    if (zodType instanceof ZodOptional || zodType instanceof ZodNullable) {
      innerType = zodType._def.innerType;
    }

    if (innerType instanceof ZodString) return '';
    if (innerType instanceof ZodNumber) return 0;
    if (innerType instanceof ZodBoolean) return false;
    if (innerType instanceof ZodDate) return new Date();
    if (innerType instanceof ZodArray) return [];

    return undefined;
  }
}
