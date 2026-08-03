import { createToaster } from '@ark-ui/vue/toast'

export const toaster = createToaster({
  placement: 'top-end',
  overlap: true,
  gap: 12,
  max: 5,
})

export const useToast = () => ({
  success: (title: string, description?: string) =>
    toaster.create({ title, description, type: 'success', duration: 4000 }),

  error: (title: string, description?: string) =>
    toaster.create({ title, description, type: 'error', duration: 6000 }),

  warning: (title: string, description?: string) =>
    toaster.create({ title, description, type: 'warning', duration: 5000 }),

  info: (title: string, description?: string) =>
    toaster.create({ title, description, type: 'info', duration: 4000 }),

  dismiss: (id: string) => toaster.dismiss(id),

  dismissAll: () => toaster.dismiss(),
})
