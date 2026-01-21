import { cn } from '@/lib/utils';

export function Button({
  children,
  onClick,
  disabled,
  className,
  type,
  variant = 'default',
  size = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'default' | 'lg';
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

  const variants = {
    default:
      'border border-plum-500 text-plum-600 bg-transparent hover:bg-plum-50 hover:border-plum-600 active:bg-plum-100',
    primary:
      'bg-gradient-to-r from-plum-500 to-plum-700 text-white border-0 shadow-md hover:shadow-primary hover:from-plum-600 hover:to-plum-800 active:from-plum-700 active:to-plum-900',
    secondary:
      'bg-plum-100 text-plum-700 border border-plum-200 hover:bg-plum-200 hover:border-plum-300 active:bg-plum-300',
    outline:
      'border-2 border-plum-500 text-plum-600 bg-transparent hover:bg-plum-500 hover:text-white active:bg-plum-600',
    ghost: 'text-plum-600 bg-transparent hover:bg-plum-50 active:bg-plum-100',
    danger:
      'bg-gradient-to-r from-red-500 to-red-700 text-white border-0 shadow-md hover:from-red-600 hover:to-red-800 active:from-red-700 active:to-red-900',
    success:
      'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-0 shadow-md hover:from-emerald-600 hover:to-emerald-800 active:from-emerald-700 active:to-emerald-900',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-md',
    default: 'h-10 px-4 py-2 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-lg',
  };

  return (
    <button
      type={type || 'button'}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      {...props}>
      {children}
    </button>
  );
}
