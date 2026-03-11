import { ChevronLeft } from 'lucide-react';
import { AnimatedUnderline } from './animatedUnderline';

interface BackButtonProps {
  /** Optional custom label. Defaults to "Back" */
  label?: string;
  /** Optional custom onClick handler. If not provided, uses window.history.back() */
  onClick?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

export function BackButton({ label = 'Back', onClick, className = '' }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Use window.history.back() instead of navigate(-1) to avoid issues
      // with React Router's history management when using { replace: true }
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative flex items-center gap-1 uppercase text-primary font-heading text-lg hover:text-foreground transition-colors cursor-pointer w-fit ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
      <AnimatedUnderline />
    </button>
  );
}
