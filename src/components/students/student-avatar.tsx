'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StudentAvatarProps {
  name: string;
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * StudentAvatar Component
 * Displays student photo or initials-based fallback with Material Design 3 styling
 */
export function StudentAvatar({ name, photo, size = 'md', className = '' }: StudentAvatarProps) {
  // Generate initials from name (first letter of first and last name)
  const getInitials = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <Avatar 
      className={cn(
        sizeClasses[size],
        'border-2 border-[var(--muadalah-border-subtle)] shadow-sm',
        className
      )}
    >
      {photo && <AvatarImage src={photo} alt={name} className="object-cover" />}
      <AvatarFallback 
        className="bg-[var(--muadalah-primary-container)]/10 text-[var(--muadalah-primary)] font-semibold"
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
