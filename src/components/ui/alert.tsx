import { cn } from '@/lib/utils'

interface AlertProps {
    type: 'error' | 'success' | 'info'
    message: string
    className?: string
}

export function Alert({ type, message, className }: AlertProps) {
    const styles = {
        error: 'bg-red-50 border-red-200 text-red-700',
        success: 'bg-green-50 border-green-200 text-green-700',
        info: 'bg-violet-50 border-violet-200 text-violet-700',
    }

    return (
        <div className={cn('text-sm border rounded-lg px-4 py-3', styles[type], className)}>
            {message}
        </div>
    )
}