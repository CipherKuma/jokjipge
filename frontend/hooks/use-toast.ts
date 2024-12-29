import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    const { title, description, variant = 'default', duration } = options
    
    const message = title || description || ''
    const descriptionText = title && description ? description : undefined
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          description: descriptionText,
          duration: duration || 5000,
        })
        break
      case 'success':
        sonnerToast.success(message, {
          description: descriptionText,
          duration: duration || 5000,
        })
        break
      default:
        sonnerToast(message, {
          description: descriptionText,
          duration: duration || 5000,
        })
    }
  }
  
  return { toast }
}

// Export toast function for direct usage
export const toast = (options: ToastOptions) => {
  const { title, description, variant = 'default', duration } = options
  
  const message = title || description || ''
  const descriptionText = title && description ? description : undefined
  
  switch (variant) {
    case 'destructive':
      sonnerToast.error(message, {
        description: descriptionText,
        duration: duration || 5000,
      })
      break
    case 'success':
      sonnerToast.success(message, {
        description: descriptionText,
        duration: duration || 5000,
      })
      break
    default:
      sonnerToast(message, {
        description: descriptionText,
        duration: duration || 5000,
      })
  }
}