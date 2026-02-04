"use client";

import React from "react";
import {
    motion,
    useAnimationFrame,
    useMotionTemplate,
    useMotionValue,
    useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function MovingBorder({
    children,
    duration = 2000,
    className,
    containerClassName,
    ...otherProps
}: {
    children: React.ReactNode;
    duration?: number;
    className?: string;
    containerClassName?: string;
    [key: string]: any;
}) {
    return (
        <div
            className={cn(
                "bg-transparent relative text-xl p-[2px] overflow-hidden ",
                containerClassName
            )}
            style={{
                borderRadius: "1.75rem",
            }}
            {...otherProps}
        >
            <div
                className="absolute inset-0"
                style={{ borderRadius: "1.75rem" }}
            >
                <MovingBorderComponent duration={duration} rx="28px" ry="28px">
                    <div
                        className={cn(
                            "h-28 w-28 opacity-[0.8] bg-[radial-gradient(#10b981_40%,transparent_60%)]",
                            className
                        )}
                    />
                </MovingBorderComponent>
            </div>

            <div
                className={cn(
                    "relative bg-background/80 backdrop-blur-xl border border-border/40 text-emerald-500 flex items-center justify-center w-full h-full text-sm antialiased",
                    className
                )}
                style={{
                    borderRadius: "1.75rem",
                }}
            >
                {children}
            </div>
        </div>
    );
}

export const MovingBorderComponent = ({
    children,
    duration = 2000,
    rx,
    ry,
    ...otherProps
}: {
    children: React.ReactNode;
    duration?: number;
    rx?: string;
    ry?: string;
    [key: string]: any;
}) => {
    const pathRef = useRef<any>(null);
    const progress = useMotionValue<number>(0);

    useAnimationFrame((time) => {
        const length = pathRef.current?.getTotalLength();
        if (length) {
            const pxPerMillisecond = length / duration;
            progress.set((time * pxPerMillisecond) % length);
        }
    });

    const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.x || 0);
    const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.y || 0);

    const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="absolute h-full w-full"
                width="100%"
                height="100%"
                {...otherProps}
            >
                <rect
                    fill="none"
                    width="100%"
                    height="100%"
                    rx={rx}
                    ry={ry}
                    ref={pathRef}
                />
            </svg>
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "inline-block",
                    transform,
                }}
            >
                {children}
            </motion.div>
        </>
    );
}
