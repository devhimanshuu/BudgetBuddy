"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Achievement {
    key: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    tier: string;
}

export function showAchievementUnlock(achievement: Achievement) {
    // Trigger confetti
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
    }, 250);

    // Show toast
    toast.success(
        <div className="flex items-start gap-3">
            <div className="text-4xl">{achievement.icon}</div>
            <div className="flex-1">
                <div className="font-bold text-base">Achievement Unlocked!</div>
                <div className="font-semibold">{achievement.name}</div>
                <div className="text-sm text-muted-foreground">
                    {achievement.description}
                </div>
                <div className="mt-1 text-sm font-medium text-primary">
                    +{achievement.points} points
                </div>
            </div>
        </div>,
        {
            duration: 5000,
            className: "achievement-toast",
        }
    );
}

export function AchievementUnlockHandler({
    achievementKeys,
}: {
    achievementKeys: string[];
}) {
    useEffect(() => {
        if (achievementKeys.length > 0) {
            // Show achievements one by one with delay
            achievementKeys.forEach((key, index) => {
                setTimeout(() => {
                    // In a real implementation, you'd fetch the achievement details
                    // For now, we'll just show a generic message
                    toast.success(`Achievement unlocked: ${key}`);
                }, index * 1000);
            });
        }
    }, [achievementKeys]);

    return null;
}
