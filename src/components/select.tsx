import { cn } from '@/lib/utils';

export const Select = ({ className, children, ...props }: React.ComponentProps<'select'>) => (
  <select
    className={cn(
      'flex w-full rounded-lg border border-plum-200 bg-white px-4 py-2.5 text-base text-text-primary shadow-sm transition-all duration-200',
      'hover:border-plum-300',
      'focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
      'md:text-sm',
      // Custom arrow styling
      'appearance-none bg-no-repeat bg-right pr-10',
      'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23991b1b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")]',
      'bg-[length:1.25rem_1.25rem]',
      'bg-[position:right_0.75rem_center]',
      className,
    )}
    {...props}>
    {children}
  </select>
);
