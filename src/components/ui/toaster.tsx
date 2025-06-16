import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determinar qual ícone mostrar baseado na variante do toast
        const getIcon = () => {
          switch (variant) {
            case 'success':
              return <CheckCircle className="h-6 w-6 text-green-600" />
            case 'error':
              return <AlertCircle className="h-6 w-6 text-red-600" />
            case 'warning':
              return <AlertTriangle className="h-6 w-6 text-amber-600" />
            case 'info':
              return <Info className="h-6 w-6 text-blue-600" />
            case 'destructive':
              return <AlertCircle className="h-6 w-6 text-red-600" />
            default:
              return <Info className="h-6 w-6 text-gray-600" />
          }
        }

        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon()}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle className="text-base font-bold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-full p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none hover:bg-gray-200">
              <X className="h-4 w-4" />
            </ToastClose>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
