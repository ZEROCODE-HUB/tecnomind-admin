import { forwardRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string;
  minLoadingTime?: number;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loadingText,
      minLoadingTime = 0,
      onClick,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLoading || disabled) return;

        const startTime = Date.now();
        setIsLoading(true);

        try {
          if (onClick) {
            await (onClick as (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void)(e);
          }
        } finally {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, minLoadingTime - elapsed);
          
          if (remaining > 0) {
            setTimeout(() => setIsLoading(false), remaining);
          } else {
            setIsLoading(false);
          }
        }
      },
      [onClick, isLoading, disabled, minLoadingTime]
    );

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin mr-2" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
