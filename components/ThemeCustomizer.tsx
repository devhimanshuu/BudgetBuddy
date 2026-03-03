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
import { usePersonaTheme } from "@/components/providers/PersonaThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Paintbrush, Check, CloudMoon, Eclipse, Cpu, Droplets, Trees, Sparkles, Shield, Gem, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ThemeCustomizer() {
    const { theme, setTheme } = useTheme();
    const { isMorphingEnabled, setIsMorphingEnabled, personaData } = usePersonaTheme();
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
                        Personalize your workspace with custom themes and persona-based morphing.
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


                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    Persona UI Morphing
                                </Label>
                                <p className="text-[12px] text-muted-foreground">
                                    Adapts the entire app theme to your {personaData?.persona || "financial"} persona.
                                </p>
                            </div>
                            <Switch
                                checked={isMorphingEnabled}
                                onCheckedChange={setIsMorphingEnabled}
                            />
                        </div>

                        {isMorphingEnabled && personaData && (
                            <div className={cn(
                                "p-3 rounded-xl border flex items-center gap-3 bg-muted/30",
                                personaData.persona === "Squirrel" && "border-emerald-500/30 bg-emerald-500/5",
                                personaData.persona === "Peacock" && "border-purple-500/30 bg-purple-500/5",
                                personaData.persona === "Owl" && "border-blue-500/30 bg-blue-500/5",
                                personaData.persona === "Fox" && "border-orange-500/30 bg-orange-500/5",
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    personaData.persona === "Squirrel" && "bg-emerald-500/20 text-emerald-500",
                                    personaData.persona === "Peacock" && "bg-purple-500/20 text-purple-500",
                                    personaData.persona === "Owl" && "bg-blue-500/20 text-blue-500",
                                    personaData.persona === "Fox" && "bg-orange-500/20 text-orange-500",
                                )}>
                                    {personaData.persona === "Squirrel" && <Shield className="w-5 h-5" />}
                                    {personaData.persona === "Peacock" && <Gem className="w-5 h-5" />}
                                    {personaData.persona === "Owl" && <Brain className="w-5 h-5" />}
                                    {personaData.persona === "Fox" && <Zap className="w-5 h-5" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black">Active: {personaData.persona}</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{personaData.personality}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
