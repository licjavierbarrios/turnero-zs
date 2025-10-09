import { toast as sonnerToast } from 'sonner'

type ToastOptions = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function toast({ title, description, variant }: ToastOptions) {
  if (variant === 'destructive') {
    return sonnerToast.error(title, { description })
  }
  return sonnerToast.success(title, { description })
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}
