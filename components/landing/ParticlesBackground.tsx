"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const ParticlesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let mouseX = 0;
        let mouseY = 0;
        let dpr = 1;

        const resizeCanvas = () => {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            ctx.scale(dpr, dpr);

            initParticles();
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            baseX: number;
            baseY: number;
            density: number;

            constructor(x: number, y: number) {
                // Adjust for canvas logical size (which is window.innerWidth/Height)
                // because we used ctx.scale(dpr, dpr), our coordinate system relies on logical pixels
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.density = Math.random() * 30 + 1;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = theme !== "light"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.2)";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                // Mouse interaction
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                // Force direction
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;

                // Force calculation
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * this.density;
                const directionY = forceDirectionY * force * this.density;

                if (distance < maxDistance) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    // Return to base position
                    if (this.x !== this.baseX) {
                        const dx = this.x - this.baseX;
                        this.x -= dx / 10;
                    }
                    if (this.y !== this.baseY) {
                        const dy = this.y - this.baseY;
                        this.y -= dy / 10;
                    }
                }

                this.draw();
            }
        }

        const initParticles = () => {
            particles = [];
            // Logic width/height
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Adjust particle count calculation if needed. 
            // Previous: (canvas.width * canvas.height) / 9000
            // Since canvas.width is now scaled by DPR, we should probably calculate based on logical pixels to keep consistent density across screens
            const numberOfParticles = (width * height) / 9000;

            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                particles.push(new Particle(x, y));
            }
        };

        const animate = () => {
            if (!ctx) return;
            // Clear based on logical size (scaled by context) or physical?
            // Since we scaled context, clearRect(0,0, logicalW, logicalH) works.
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }

            // Connect particles
            connect();

            animationFrameId = requestAnimationFrame(animate);
        };

        const connect = () => {
            if (!ctx) return;
            const maxDistance = 100; // Connection distance

            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacityValue = 1 - distance / maxDistance;
                        ctx.strokeStyle = theme !== "light"
                            ? `rgba(255, 255, 255, ${opacityValue * 0.15})`
                            : `rgba(0, 0, 0, ${opacityValue * 0.15})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            // e.x and e.y are client coordinates (logical pixels)
            // Perfect since our particle system is now in logical pixels via ctx.scale
            mouseX = e.x;
            mouseY = e.y;
        };

        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("mousemove", handleMouseMove);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    // Handle theme changes for color updates (simple re-render trigger)

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
        />
    );
};

export default ParticlesBackground;
