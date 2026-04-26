"use client";

import { useQuery } from "@tanstack/react-query";
import { GetWorkspaceMembers } from "../../_actions/workspaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, Shield } from "lucide-react";
import SkeletonWrapper from "@/components/SkeletonWrapper";

interface Props {
  workspaceId: string;
  onSelect: (userId: string) => void;
  selectedUserId?: string;
  currentOwnerId?: string;
}

export function WorkspaceMemberSelector({ workspaceId, onSelect, selectedUserId, currentOwnerId }: Props) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => GetWorkspaceMembers(workspaceId),
  });

  const admins = members?.filter(m => m.role === "ADMIN" && m.userId !== currentOwnerId) || [];

  return (
    <SkeletonWrapper isLoading={isLoading}>
      <div className="space-y-1">
        {admins.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground italic">
            No other Admins found in this workspace.
          </p>
        ) : (
          admins.map((member) => (
            <div
              key={member.userId}
              onClick={() => onSelect(member.userId)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                selectedUserId === member.userId 
                  ? "bg-primary/10 border border-primary/20 shadow-sm" 
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-background">
                  <AvatarImage src={member.imageUrl || ""} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold leading-none">{member.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                </div>
              </div>
              {selectedUserId === member.userId ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Shield className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </div>
          ))
        )}
      </div>
    </SkeletonWrapper>
  );
}
