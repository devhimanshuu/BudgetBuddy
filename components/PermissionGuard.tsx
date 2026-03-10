"use client";

import { useQuery } from "@tanstack/react-query";
import { GetWorkspaces, GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import React from "react";

interface PermissionGuardProps {
    /** Roles that are allowed to see the children. Defaults to ["ADMIN", "EDITOR"] */
    allowedRoles?: string[];
    /** What to render if the user doesn't have permission. Defaults to null (hidden). */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's role in the active workspace.
 * Use this to hide action buttons (Add, Edit, Delete) from Viewers.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard>
 *   <Button>Add Transaction</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
    allowedRoles = ["ADMIN", "EDITOR"],
    fallback = null,
    children,
}: PermissionGuardProps) {
    const { data: activeWorkspace } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    // While loading, show children to avoid flicker. The server actions
    // have their own RBAC checks as a safety net.
    if (!activeWorkspace) return <>{children}</>;

    if (allowedRoles.includes(activeWorkspace.role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

/**
 * Hook to get the current user's role in the active workspace.
 */
export function useWorkspaceRole(): string | null {
    const { data: activeWorkspace } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    return activeWorkspace?.role ?? null;
}
