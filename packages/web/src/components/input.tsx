import { cn } from '@/lib/utils';

export const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <input
    type={type}
    className={cn(
      'flex w-full rounded-lg border border-plum-200 bg-white px-4 py-2.5 text-base text-text-primary shadow-sm transition-all duration-200',
      'placeholder:text-text-light',
      'hover:border-plum-300',
      'focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
      'file:border-0 file:bg-plum-50 file:text-sm file:font-medium file:text-plum-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:cursor-pointer file:hover:bg-plum-100',
      'md:text-sm',
      className,
    )}
    {...props}
  />
);
