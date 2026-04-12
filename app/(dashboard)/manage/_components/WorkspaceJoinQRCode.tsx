"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetOrCreateQRInvite } from "@/app/(dashboard)/_actions/workspaces";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    QrCode,
    Loader2,
    RefreshCw,
    Share2,
    Check,
    Smartphone,
    Users2,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const ROLE_CONFIG: Record<string, { label: string; description: string; color: string }> = {
    VIEWER: {
        label: "Viewer",
        description: "Can see everything but not edit",
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    EDITOR: {
        label: "Editor",
        description: "Can add and edit transactions",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
};

export function WorkspaceJoinQRCode({ workspaceId }: { workspaceId: string }) {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState("VIEWER");
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["workspace-qr-invite", workspaceId, role],
        queryFn: () => GetOrCreateQRInvite(workspaceId, role),
        enabled: open,
    });

    const handleCopy = () => {
        if (data?.inviteLink) {
            navigator.clipboard.writeText(data.inviteLink);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                    <QrCode className="h-4 w-4" />
                    <span>Join QR</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md lg:max-w-3xl bg-gradient-to-b from-background to-primary/5 border-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                
                <DialogHeader className="pt-4">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Smartphone className="h-6 w-6 text-primary" />
                        </div>
                        Quick Join
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Let family or roommates join instantly by scanning.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-6 px-2 lg:px-6">
                    {/* Left Column (Controls & Info) */}
                    <div className="w-full lg:w-1/2 flex flex-col space-y-6">
                        {/* Role Selector */}
                        <div className="w-full space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" />
                                Assign Role
                            </label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-primary/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{config.label}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {config.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2 text-center lg:text-left max-w-[280px] lg:max-w-full mx-auto lg:mx-0">
                            <p className="text-sm font-medium">Scan with your phone&apos;s camera</p>
                            <p className="text-xs text-muted-foreground italic">
                                Anyone who scans this will be added as a{" "}
                                <span className="font-bold text-primary">{role.toLowerCase()}</span>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full pt-2">
                            <Button
                                variant="secondary"
                                className="bg-primary/5 hover:bg-primary/10 border-primary/10"
                                onClick={handleCopy}
                                disabled={!data?.inviteLink}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 mr-2 text-emerald-500" />
                                ) : (
                                    <Share2 className="h-4 w-4 mr-2" />
                                )}
                                Copy Link
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => refetch()}
                                disabled={isLoading || isRefetching}
                            >
                                <RefreshCw className={isRefetching ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
                                Regenerate
                            </Button>
                        </div>
                    </div>

                    {/* Right Column (QR Code) */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-2xl group-hover:bg-primary/30 transition-all duration-500 opacity-50" />
                            
                            <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-white/20">
                                {isLoading || isRefetching ? (
                                    <div className="h-[200px] w-[200px] lg:h-[260px] lg:w-[260px] flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                    </div>
                                ) : data?.inviteLink ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", damping: 15 }}
                                        className="h-[200px] w-[200px] lg:h-[260px] lg:w-[260px]"
                                    >
                                        <QRCodeSVG
                                            value={data.inviteLink}
                                            style={{ width: "100%", height: "100%" }}
                                            level="H"
                                            includeMargin={false}
                                            fgColor="#000000"
                                            bgColor="#FFFFFF"
                                            imageSettings={{
                                                src: "/icon.png",
                                                x: undefined,
                                                y: undefined,
                                                height: 48,
                                                width: 48,
                                                excavate: true,
                                            }}
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="h-[200px] w-[200px] lg:h-[260px] lg:w-[260px] flex items-center justify-center text-muted-foreground text-center p-4">
                                        Failed to generate QR code.
                                    </div>
                                )}

                                {/* Floating scan indicator */}
                                <motion.div 
                                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold shadow-lg"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    SCAN TO JOIN
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 px-6 py-4 border-t border-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Family & Roommates</span>
                    </div>
                    {data?.expiresAt && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Active for 24h
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
