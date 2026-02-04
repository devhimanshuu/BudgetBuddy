"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay?: number;
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || isFocused) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay }}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-background/60 to-background/20 px-6 py-8 3xl:px-10 3xl:py-12 4xl:px-14 4xl:py-16 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,182,255,.1), transparent 40%)`,
                }}
            />
            {/* Spotlight Border */}
            <div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.1), transparent 40%)`,
                }}
            />

            <div className="relative z-10 flex flex-col items-start gap-4 3xl:gap-6 4xl:gap-8">
                <div className="flex h-12 w-12 3xl:h-16 3xl:w-16 4xl:h-20 4xl:w-20 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25 transition-transform group-hover:scale-110 duration-300">
                    <div className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10">
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="mb-2 text-lg 3xl:text-2xl 4xl:text-3xl font-semibold leading-none tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {title}
                    </h3>
                    <p className="text-sm 3xl:text-lg 4xl:text-xl text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </motion.div>
    );
};

export default FeatureCard;
