import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      message?: unknown
      data?: { message?: unknown }
      error?: unknown
    }

    const dataMessage = candidate.data?.message
    if (Array.isArray(dataMessage) && dataMessage.length > 0) {
      return dataMessage.join(', ')
    }
    if (typeof dataMessage === 'string' && dataMessage.trim()) {
      return dataMessage
    }

    if (Array.isArray(candidate.message) && candidate.message.length > 0) {
      return candidate.message.join(', ')
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message
    }

    if (typeof candidate.error === 'string' && candidate.error.trim()) {
      return candidate.error
    }
  }

  return fallback
}
