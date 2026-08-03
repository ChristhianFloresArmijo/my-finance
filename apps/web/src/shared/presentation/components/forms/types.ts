export interface FormAction {
  label: string
  callback: (values: Record<string, unknown>) => Promise<void> | void
  requiresValidation?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loadingLabel?: string
}
