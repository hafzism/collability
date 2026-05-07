"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center border font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-none overflow-hidden active:translate-y-px",
  {
    variants: {
      variant: {
        default: "ui-pressed-primary",
        destructive: "ui-pressed-danger",
        outline: "ui-pressed-button",
        secondary: "ui-pressed-button",
        ghost:
          "border-transparent text-[#bdbdb8] hover:bg-white/6 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 text-[14px] rounded-xl px-6",
        sm: "h-8 text-xs rounded-lg px-4",
        lg: "h-12 text-[16px] rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
}

type ButtonChild = React.ReactElement<{ children?: React.ReactNode }>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "group")}
        ref={ref}
        {...props}
      >
        {asChild ? (
          React.isValidElement<{ children?: React.ReactNode }>(children) ? (
            React.cloneElement(
              children as ButtonChild,
              undefined,
              <>
                <span className="relative z-20 flex items-center justify-center gap-2">
                  {children.props.children}
                </span>
              </>,
            )
          ) : (
            children
          )
        ) : (
          <>
            <span className="relative z-20 flex items-center justify-center gap-2">
              {children}
            </span>
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
