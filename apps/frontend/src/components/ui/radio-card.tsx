import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface RadioCardProps {
  selected: boolean;
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

export function RadioCard({ selected, icon: Icon, label, description, onClick }: RadioCardProps) {
  return (
    <div
      className={cn(
        'flex items-start space-x-4 p-4 rounded-sm cursor-pointer transition-all',
        selected
          ? 'border-[3px] border-primary bg-primary/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
          : 'border-2 border-border hover:border-primary/50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)]'
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            selected ? 'border-primary' : 'border-border'
          )}
        >
          {selected && <div className="w-3 h-3 rounded-full bg-primary" />}
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <Label className="cursor-pointer flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-semibold">{label}</span>
        </Label>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </div>
    </div>
  );
}
