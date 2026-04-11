import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900',
                        'placeholder:text-gray-400 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
                        error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'
export { Input }