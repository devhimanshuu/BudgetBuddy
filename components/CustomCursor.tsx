"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

import { Coins, DollarSign, Euro, IndianRupee, PoundSterling, TrendingUp } from "lucide-react";

export const CustomCursor = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
    const [scale, setScale] = useState(1);

    // Mouse position state - raw inputs
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring animation for the cursor wrapper
    const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            if (width < 640) setScale(0.7);      // Mobile
            else if (width < 1024) setScale(0.85); // Tablet
            else setScale(1);                    // Desktop
        };

        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            setIsVisible(true);
        };

        const handleMouseDown = (e: MouseEvent) => {
            setIsClicking(true);
            setClicks(prev => [...prev, { id: Date.now(), x: e.clientX, y: e.clientY }].slice(-5));
            setTimeout(() => {
                setClicks(prev => prev.slice(1));
            }, 800);
        };
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isTextInput =
                (target.tagName === "INPUT" && !["button", "submit", "checkbox", "radio", "range", "color"].includes((target as HTMLInputElement).type)) ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;

            if (isTextInput) {
                setIsVisible(false);
                return;
            } else {
                setIsVisible(true);
            }

            const isHoverable = target.closest("button") || target.closest("a") || target.closest(".cursor-hover") || target.tagName === "LABEL";
            setIsHovering(!!isHoverable);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        window.addEventListener("mousemove", moveMouse);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mouseenter", handleMouseEnter);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("resize", updateScale);
            window.removeEventListener("mousemove", moveMouse);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("mouseenter", handleMouseEnter);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, [mouseX, mouseY]);

    // Handle touch devices - we hide the cursor on actual touch devices to avoid interference
    // but we allow it on small desktops/tablets with pointing devices.
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    useEffect(() => {
        setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }, []);

    if (isTouchDevice) return null;

    return (
        <>
            {/* Click Particle Effects (Rupee Burst) */}
            {clicks.map(click => (
                <div key={click.id} className="fixed inset-0 pointer-events-none z-[9998]">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: click.x, y: click.y, opacity: 1, scale: 0.2 }}
                            animate={{
                                x: click.x + (Math.random() - 0.5) * 200,
                                y: click.y + (Math.random() - 0.5) * 200 - 60,
                                opacity: 0,
                                scale: 1.2,
                                rotate: Math.random() * 720
                            }}
                            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute flex items-center justify-center text-emerald-500"
                        >
                            <IndianRupee className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </motion.div>
                    ))}
                </div>
            ))}

            <motion.div
                className={cn(
                    "fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center",
                    !isVisible && "opacity-0"
                )}
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                    scale: scale, // Dynamic responsiveness
                }}
            >
                {/* Inner Orbital Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className={cn(
                        "absolute transition-all duration-700",
                        isHovering ? "w-20 h-20 opacity-60" : "w-10 h-10 opacity-20"
                    )}
                >
                    <DollarSign className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 text-amber-500/80" />
                    <Euro className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 text-blue-500/80" />
                    <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-emerald-500/80" />
                    <PoundSterling className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-purple-500/80" />
                </motion.div>

                {/* Outer Counter-Rotating Ring (Premium Detail) */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className={cn(
                        "absolute border border-dashed border-primary/20 rounded-full transition-all duration-700",
                        isHovering ? "w-32 h-32 opacity-40 scale-100" : "w-14 h-14 opacity-0 scale-50"
                    )}
                />

                {/* The Main "Golden Coin" Blob */}
                <motion.div
                    className={cn(
                        "relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        isHovering
                            ? "w-[65px] h-[65px] bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent backdrop-blur-xl border border-amber-500/40 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.2),inset_0_0_15px_rgba(245,158,11,0.1)]"
                            : "w-[12px] h-[12px] bg-primary rounded-full shadow-[0_0_10px_rgb(var(--primary)/0.3)]",
                        isClicking && "scale-90"
                    )}
                >
                    {/* Inner Content with extra glow */}
                    <div className={cn(
                        "transition-all duration-500 transform",
                        isHovering ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )}>
                        <TrendingUp className="w-7 h-7 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                    </div>

                    {/* Shimmer / Lens Flare Effect */}
                    {isHovering && (
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: ['150%', '-150%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-45 w-1/2"
                            />
                        </div>
                    )}
                </motion.div>

                {/* Precision Center Point */}
                <div className={cn(
                    "absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_white] transition-opacity duration-300",
                    isHovering ? "opacity-100" : "opacity-0"
                )} />
            </motion.div>
        </>
    );
};
