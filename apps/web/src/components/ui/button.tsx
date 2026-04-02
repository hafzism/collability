"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"relative inline-flex items-center justify-center font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 overflow-hidden active:scale-[0.98]",
	{
		variants: {
			variant: {
				default: "bg-gradient-to-br from-white via-gray-100 to-gray-200 text-black shadow-lg shadow-black/10 border border-black/5 hover:shadow-xl hover:-translate-y-[1px]",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border border-gray-700/50 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-[1px] hover:border-gray-500/50 backdrop-blur-md",
				ghost: "hover:bg-accent hover:text-accent-foreground",
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
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
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
						React.cloneElement(children as ButtonChild, undefined,
							<>
								<div className="absolute inset-0 rounded-[inherit] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none z-10 overflow-hidden">
									<div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"></div>
								</div>
								<span className="relative z-20 flex items-center justify-center gap-2">
									{children.props.children}
								</span>
							</>
						)
					) : (
						children
					)
				) : (
					<>
						<div className="absolute inset-0 rounded-[inherit] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none z-10 overflow-hidden">
							<div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"></div>
						</div>
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
