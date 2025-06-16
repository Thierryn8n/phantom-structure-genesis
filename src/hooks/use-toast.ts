import * as React from "react"
import { cn } from "@/lib/utils"

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'destructive' | 'default';

// Definições de tipos para Toast
type ToastActionElement = React.ReactElement<any>; 

interface ToastBaseProps {
  id?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  variant?: ToastType;
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: ToastActionElement;
}

interface Toast {
  id: string;
  title: React.ReactNode;
  description: React.ReactNode;
  variant?: ToastType;
  duration: number;
  open?: boolean;
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const TOAST_REMOVE_DELAY = 5000

const listeners: Array<(state: { toasts: Toast[] }) => void> = []
let memoryState: { toasts: Toast[] } = { toasts: [] }

function dispatch(action: any) {
  if (action.type === 'ADD_TOAST') {
    memoryState = {
      toasts: [action.toast, ...memoryState.toasts]
    }
  } else if (action.type === 'REMOVE_TOAST') {
    memoryState = {
      toasts: memoryState.toasts.filter(t => t.id !== action.toastId)
      }
  }
  
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props: ToastBaseProps) {
  const id = genId()

  const dismiss = () => dispatch({ 
    type: "REMOVE_TOAST", 
    toastId: id 
  })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration: props.duration || TOAST_REMOVE_DELAY,
      open: true,
    },
  })

  // Configurar o temporizador para remover o toast
  setTimeout(() => {
    dismiss()
  }, props.duration || TOAST_REMOVE_DELAY)

  return {
    id,
    dismiss,
  }
}

function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        dispatch({ type: "REMOVE_TOAST", toastId })
      }
    },
  }
}

// Este é o tipo exportado, para uso por componentes que consomem os toasts
export type ToastProps = Toast & {
  action?: ToastActionElement
}

export { useToast, toast }
