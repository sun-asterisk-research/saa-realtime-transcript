import { cn } from '@/lib/utils';

export const Select = ({ className, children, ...props }: React.ComponentProps<'select'>) => (
  <select
    className={cn(
      'flex w-full rounded-md border border-primary text-primary bg-transparent px-3 py-2 text-base shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className,
    )}
    {...props}>
    {children}
  </select>
);
