"use client";

import { AchievementToast } from "@/app/(dashboard)/_components/AchievementToast";
import { useCallback } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const useAchievementToast = () => {
    const showAchievement = useCallback((achievements: any[]) => {
        if (!achievements || achievements.length === 0) return;

        // Play sound
        const audio = new Audio("/achievement-sound.mp3");
        audio.volume = 0.5;
        audio.play().catch((e) => console.error("Audio playback failed", e));

        // Fire Confetti
        const end = Date.now() + 1000;
        const colors = ["#fbbf24", "#ef4444", "#3b82f6", "#10b981"];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();

        // Show Toast for each achievement (with slight delay)
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                toast.custom((t) => (
                    <AchievementToast
                        t={t}
                        title={achievement.name}
                        description={achievement.description}
                        points={achievement.points}
                        icon={achievement.icon}
                    />
                ), { duration: 5000 });
            }, index * 500);
        });
    }, []);

    return { showAchievement };
};
