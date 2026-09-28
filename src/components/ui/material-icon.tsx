import { cn } from '@/lib/utils';

interface MaterialIconProps {
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
}

const sizeMap = {
  xs: 'text-[16px]',
  sm: 'text-[18px]',
  md: 'text-[20px]',
  lg: 'text-[24px]',
  xl: 'text-[28px]',
};

/**
 * MaterialIcon Component
 * Wrapper for Google Material Symbols Outlined icons
 * 
 * @example
 * <MaterialIcon name="person" />
 * <MaterialIcon name="search" size="lg" className="text-primary" />
 * <MaterialIcon name="check_circle" fill weight={600} />
 */
export function MaterialIcon({ 
  name, 
  className, 
  size = 'md', 
  fill = false,
  weight = 400 
}: MaterialIconProps) {
  return (
    <span
      className={cn(
        'material-symbols-outlined select-none',
        sizeMap[size],
        className
      )}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
