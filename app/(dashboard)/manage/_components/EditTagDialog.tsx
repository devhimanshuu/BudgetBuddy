"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import { Palette } from "lucide-react";

interface EditTagDialogProps {
    tag: {
        id: string;
        name: string;
        color: string;
    };
    trigger: ReactNode;
}

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#14b8a6", // Teal
];

export default function EditTagDialog({ tag, trigger }: EditTagDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);
    const [customHue, setCustomHue] = useState(200);
    const [customSaturation, setCustomSaturation] = useState(80);
    const [customLightness, setCustomLightness] = useState(50);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const queryClient = useQueryClient();

    // Convert HSL to hex
    const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    const customColor = hslToHex(customHue, customSaturation, customLightness);

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: { name: string; color: string }) => {
            const response = await fetch(`/api/tags/${tag.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update tag");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success("Tag updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Please enter a tag name");
            return;
        }

        // Only send changed fields
        const updates: { name?: string; color?: string } = {};
        if (name.trim() !== tag.name) updates.name = name.trim();
        if (color !== tag.color) updates.color = color;

        if (Object.keys(updates).length === 0) {
            toast.info("No changes made");
            setOpen(false);
            return;
        }

        mutate({ name: name.trim(), color });
    };

    const handleCustomColorSelect = () => {
        setColor(customColor);
        setShowColorPicker(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Tag</DialogTitle>
                    <DialogDescription>
                        Update the tag name or color
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tag Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Business, Personal, Travel"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${color === presetColor
                                        ? "scale-110 border-foreground ring-2 ring-offset-2"
                                        : "border-transparent hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: presetColor }}
                                    onClick={() => setColor(presetColor)}
                                />
                            ))}

                            {/* Custom Color Picker */}
                            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={`h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center ${!PRESET_COLORS.includes(color)
                                                ? "scale-110 border-foreground ring-2 ring-offset-2"
                                                : "border-dashed border-muted-foreground hover:scale-105 hover:border-foreground"
                                            }`}
                                        style={{
                                            backgroundColor: !PRESET_COLORS.includes(color) ? color : "transparent"
                                        }}
                                    >
                                        {PRESET_COLORS.includes(color) && (
                                            <Palette className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Custom Color</h4>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Adjust the sliders to create your perfect color
                                            </p>
                                        </div>

                                        {/* Color Preview */}
                                        <div className="flex items-center justify-center">
                                            <div
                                                className="h-16 w-16 rounded-full border-4 border-border shadow-lg"
                                                style={{ backgroundColor: customColor }}
                                            />
                                        </div>

                                        {/* Hue Slider */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium">Hue</label>
                                                <span className="text-xs text-muted-foreground">{customHue}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={customHue}
                                                onChange={(e) => setCustomHue(Number(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, 
                                                        hsl(0, 100%, 50%), 
                                                        hsl(60, 100%, 50%), 
                                                        hsl(120, 100%, 50%), 
                                                        hsl(180, 100%, 50%), 
                                                        hsl(240, 100%, 50%), 
                                                        hsl(300, 100%, 50%), 
                                                        hsl(360, 100%, 50%))`
                                                }}
                                            />
                                        </div>

                                        {/* Saturation Slider */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium">Saturation</label>
                                                <span className="text-xs text-muted-foreground">{customSaturation}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={customSaturation}
                                                onChange={(e) => setCustomSaturation(Number(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, 
                                                        hsl(${customHue}, 0%, 50%), 
                                                        hsl(${customHue}, 100%, 50%))`
                                                }}
                                            />
                                        </div>

                                        {/* Lightness Slider */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium">Brightness</label>
                                                <span className="text-xs text-muted-foreground">{customLightness}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="20"
                                                max="80"
                                                value={customLightness}
                                                onChange={(e) => setCustomLightness(Number(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, 
                                                        hsl(${customHue}, ${customSaturation}%, 20%), 
                                                        hsl(${customHue}, ${customSaturation}%, 50%), 
                                                        hsl(${customHue}, ${customSaturation}%, 80%))`
                                                }}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleCustomColorSelect}
                                            className="w-full"
                                            size="sm"
                                        >
                                            Apply Color
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Choose a preset color or click the palette icon for custom colors
                        </p>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Updating..." : "Update Tag"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
