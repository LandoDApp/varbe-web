import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "icon" | "fab";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ 
        className, 
        variant = "primary", 
        size = "md",
        loading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props 
    }, ref) => {
        const baseStyles = cn(
            // Base styles
            "inline-flex items-center justify-center gap-2",
            "font-heading uppercase tracking-wide",
            "transition-all duration-150 ease-comic",
            "active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
            // Touch target
            "min-h-touch",
        );

        const variantStyles = {
            primary: cn(
                "bg-accent text-black",
                "border-4 border-black",
                "shadow-comic",
                "hover:shadow-comic-hover hover:translate-x-[3px] hover:translate-y-[3px]",
                "active:shadow-none active:translate-x-[6px] active:translate-y-[6px]",
            ),
            secondary: cn(
                "bg-white text-black",
                "border-4 border-black",
                "shadow-comic",
                "hover:shadow-comic-hover hover:translate-x-[3px] hover:translate-y-[3px]",
                "active:shadow-none active:translate-x-[6px] active:translate-y-[6px]",
            ),
            accent: cn(
                "bg-accent text-black",
                "border-4 border-black",
                "shadow-comic",
                "hover:shadow-comic-hover hover:translate-x-[3px] hover:translate-y-[3px]",
                "active:shadow-none active:translate-x-[6px] active:translate-y-[6px]",
            ),
            ghost: cn(
                "bg-transparent text-black",
                "border-2 border-black",
                "font-body font-semibold",
                "hover:bg-gray-100",
                "active:bg-gray-200",
            ),
            icon: cn(
                "bg-white text-black",
                "border-2 border-black",
                "shadow-comic-sm",
                "hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]",
                "active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
                "p-0",
            ),
            fab: cn(
                "bg-accent text-black",
                "border-4 border-black",
                "shadow-comic-elevated",
                "hover:shadow-comic hover:translate-x-[2px] hover:translate-y-[2px]",
                "active:shadow-comic-hover active:translate-x-[4px] active:translate-y-[4px]",
                "p-0 rounded-none",
            ),
        };

        const sizeStyles = {
            sm: "px-4 py-2 text-sm min-h-[40px]",
            md: "px-6 py-3 text-base min-h-touch",
            lg: "px-8 py-4 text-lg min-h-[56px]",
            icon: "w-12 h-12 p-0",
        };

        // Override size for icon and fab variants
        const effectiveSize = variant === "icon" ? "icon" : 
                             variant === "fab" ? "icon" : size;

        // Special size for fab
        const fabSize = variant === "fab" ? "w-16 h-16" : "";

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[effectiveSize],
                    fabSize,
                    className
                )}
                {...props}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                    </span>
                ) : (
                    <>
                        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";

// Icon Button Component
const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
    ({ className, children, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="icon"
                size="icon"
                className={className}
                {...props}
            >
                {children}
            </Button>
        );
    }
);

IconButton.displayName = "IconButton";

// Floating Action Button Component
const FAB = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'> & { 
    position?: 'bottom-right' | 'bottom-center' 
}>(
    ({ className, position = 'bottom-right', children, ...props }, ref) => {
        const positionStyles = {
            'bottom-right': 'fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] right-4',
            'bottom-center': 'fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] left-1/2 -translate-x-1/2',
        };

        return (
            <Button
                ref={ref}
                variant="fab"
                className={cn(positionStyles[position], 'z-max', className)}
                {...props}
            >
                {children}
            </Button>
        );
    }
);

FAB.displayName = "FAB";

export { Button, IconButton, FAB };
