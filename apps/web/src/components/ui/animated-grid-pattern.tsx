"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface GridPatternProps {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	strokeDasharray?: number | string;
	numSquares?: number;
	className?: string;
	maxOpacity?: number;
	duration?: number;
	repeatDelay?: number;
}

type GridSquare = {
	id: number;
	pos: [number, number];
};

function getRandomSquarePosition(
	dimensions: { width: number; height: number },
	width: number,
	height: number,
): [number, number] {
	return [
		Math.floor((Math.random() * dimensions.width) / width),
		Math.floor((Math.random() * dimensions.height) / height),
	];
}

function generateSquares(
	count: number,
	dimensions: { width: number; height: number },
	width: number,
	height: number,
): GridSquare[] {
	return Array.from({ length: count }, (_, i) => ({
		id: i,
		pos: getRandomSquarePosition(dimensions, width, height),
	}));
}

export function AnimatedGridPattern({
	width = 40,
	height = 40,
	x = -1,
	y = -1,
	strokeDasharray = 0,
	numSquares = 50,
	className,
	maxOpacity = 0.5,
	duration = 4,
	repeatDelay = 0.5,
	...props
}: GridPatternProps) {
	const id = useId();
	const containerRef = useRef<SVGSVGElement | null>(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [squares, setSquares] = useState<GridSquare[]>([]);

	function updateSquarePosition(id: number) {
		setSquares((currentSquares) =>
			currentSquares.map((sq) =>
				sq.id === id
					? {
							...sq,
							pos: getRandomSquarePosition(dimensions, width, height),
						}
					: sq,
			),
		);
	}

	useEffect(() => {
		const current = containerRef.current;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const nextDimensions = {
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				};
				setDimensions(nextDimensions);
				setSquares(generateSquares(numSquares, nextDimensions, width, height));
			}
		});

		if (current) {
			resizeObserver.observe(current);
		}

		return () => {
			if (current) {
				resizeObserver.unobserve(current);
			}
		};
	}, [height, numSquares, width]);

	return (
		<svg
			ref={containerRef}
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/10",
				className,
			)}
			{...props}
		>
			<defs>
				<pattern
					id={id}
					width={width}
					height={height}
					patternUnits="userSpaceOnUse"
					x={x}
					y={y}
				>
					<path
						d={`M.5 ${height}V.5H${width}`}
						fill="none"
						strokeDasharray={strokeDasharray}
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
			<svg x={x} y={y} className="overflow-visible">
				{squares.map(({ pos: [x, y], id }, index) => (
					<motion.rect
						initial={{ opacity: 0 }}
						animate={{ opacity: maxOpacity }}
						transition={{
							duration,
							repeat: 1,
							delay: index * 0.1,
							repeatDelay,
							repeatType: "reverse",
						}}
						onAnimationComplete={() => updateSquarePosition(id)}
						key={`${x}-${y}-${index}`}
						width={width - 1}
						height={height - 1}
						x={x * width + 1}
						y={y * height + 1}
						fill="currentColor"
						strokeWidth="0"
					/>
				))}
			</svg>
		</svg>
	);
}
