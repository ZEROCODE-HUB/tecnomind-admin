import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex w-full flex-row items-center justify-center gap-2 py-6 px-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < currentStep ? "bg-accent" : "bg-border"
          )}
        />
      ))}
    </div>
  );
};

export default ProgressIndicator;
