import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Loader({
  className,
  size = "md",
  variant = "default",
  fullScreen = false,
  text,
  ...props
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const variantClasses = {
    default: "text-slate-900 dark:text-slate-100",
    primary: "text-blue-600 dark:text-blue-400",
    white: "text-white",
    muted: "text-slate-500 dark:text-slate-400",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        {...props}
      />
      {text && (
        <p
          className={cn(
            "text-sm font-medium animate-pulse",
            variantClasses[variant]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}
