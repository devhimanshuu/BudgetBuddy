"use client";

import { useQuery } from "@tanstack/react-query";
import { GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
    Home, 
    Rocket, 
    Palmtree, 
    User,
    TrendingUp,
    ShieldCheck,
    Zap,
    ChevronRight
} from "lucide-react";

export function WorkspaceBranding() {
    const { data: workspace, isLoading } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    if (isLoading || !workspace) return null;

    return (
        <div className={cn(
            "w-full h-2 sm:h-3 transition-all duration-1000",
            workspace.bannerColor || "bg-gradient-to-r from-emerald-500 to-emerald-700"
        )} />
    );
}

export function WorkspaceNameplate() {
    const { data: workspace, isLoading } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    if (isLoading || !workspace) return null;

    return (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-card/40 backdrop-blur-md p-1 sm:p-1.5 pl-2 sm:pl-2.5 pr-2.5 sm:pr-3 rounded-full border border-primary/10 shadow-sm group hover:border-primary/30 transition-all cursor-default text-foreground">
            <div className="text-lg sm:text-xl drop-shadow-sm group-hover:scale-110 transition-transform">
                {workspace.avatar || "🏢"}
            </div>
            
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-foreground/90 leading-none truncate max-w-[100px] sm:max-w-[150px]">
                {workspace.name}
            </span>

            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />

            <div className="flex items-center gap-1">
                <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black uppercase tracking-tighter bg-primary/5 border-primary/20 flex items-center gap-1">
                    <WorkspaceIcon type={workspace.type} />
                    <span className="hidden xs:inline">{workspace.type || "PERSONAL"}</span>
                </Badge>
                <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black uppercase tracking-tighter bg-emerald-500/5 border-emerald-500/20 text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{workspace.role === "ADMIN" ? "ADMIN" : workspace.role === "EDITOR" ? "EDITOR" : "VIEWER"}</span>
                </Badge>
            </div>
        </div>
    );
}

function WorkspaceIcon({ type }: { type?: string }) {
    switch (type) {
        case "HOME": return <Home className="w-2 h-2" />;
        case "STARTUP": return <Rocket className="w-2 h-2" />;
        case "VACATION": return <Palmtree className="w-2 h-2" />;
        default: return <User className="w-2 h-2" />;
    }
}
