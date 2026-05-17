import { cn } from "@/lib/utils";

function Skeleton({ 
  className, 
  "aria-label": ariaLabel = "Carregando conteúdo...",
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("animate-pulse rounded-md bg-primary/10", className)} 
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
      {...props} 
    />
  );
}

export { Skeleton };
