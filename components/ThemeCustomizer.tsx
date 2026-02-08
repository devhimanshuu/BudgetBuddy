"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useAccent, AccentColor } from "@/components/providers/AccentProvider";
import { Moon, Sun, Paintbrush, Check, CloudMoon, Eclipse, Cpu, Droplets, Trees } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ThemeCustomizer() {
    const { theme, setTheme } = useTheme();
    const { accent, setAccent } = useAccent();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const themes = [
        { name: "Light", value: "light", icon: Sun },
        { name: "Dark", value: "dark", icon: Moon },
        { name: "Midnight", value: "midnight", icon: CloudMoon },
        { name: "Solaris", value: "solaris", icon: Eclipse },
        { name: "Cyberpunk", value: "cyberpunk", icon: Cpu },
        { name: "Forest", value: "forest", icon: Trees },
    ];

    const accents: { name: string; value: AccentColor; color: string }[] = [
        { name: "Default", value: "default", color: "bg-primary" },
        { name: "Yellow", value: "yellow", color: "bg-yellow-500" },
        { name: "Green", value: "green", color: "bg-green-600" },
        { name: "Emerald", value: "emerald", color: "bg-emerald-600" },
        { name: "Blue", value: "blue", color: "bg-blue-600" },
        { name: "Violet", value: "violet", color: "bg-violet-600" },
        { name: "Orange", value: "orange", color: "bg-orange-500" },
        { name: "Rose", value: "rose", color: "bg-rose-500" },
    ];

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" disabled>
                <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Customize Theme</span>
            </Button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Customize Theme</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Customize Appearance</DialogTitle>
                    <DialogDescription>
                        Personalize your workspace with custom themes and accent colors.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Theme Preset</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {themes.map((t) => (
                                <Button
                                    key={t.value}
                                    variant={theme === t.value ? "default" : "outline"}
                                    className={cn("justify-start", theme === t.value && "border-2")}
                                    onClick={() => setTheme(t.value)}
                                >
                                    <t.icon className="mr-2 h-4 w-4" />
                                    {t.name}
                                    {theme === t.value && <Check className="ml-auto h-4 w-4" />}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {accents.map((a) => (
                                <Button
                                    key={a.value}
                                    variant="outline"
                                    className={cn(
                                        "h-8 w-full justify-start px-2",
                                        accent === a.value && "border-2 border-primary"
                                    )}
                                    onClick={() => setAccent(a.value)}
                                >
                                    <div className={cn("mr-2 h-4 w-4 rounded-full border", a.color)} />
                                    <span className="text-xs">{a.name}</span>
                                    {accent === a.value && <Check className="ml-auto h-3 w-3" />}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
