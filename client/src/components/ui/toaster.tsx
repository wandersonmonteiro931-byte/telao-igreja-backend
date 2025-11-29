import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} duration={1000}>
            <div className="grid gap-0.5 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastAction 
              altText="Entendi" 
              onClick={() => dismiss(id)}
              data-testid={`toast-dismiss-${id}`}
            >
              ENTENDI
            </ToastAction>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
