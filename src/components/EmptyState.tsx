
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 animate-fade-in">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 animate-fade-in">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 animate-fade-in">{description}</p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="animate-fade-in"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
