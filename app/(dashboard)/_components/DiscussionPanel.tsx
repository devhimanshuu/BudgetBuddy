"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageSquare, Send, Reply, Trash2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddComment, GetComments, DeleteComment } from "../_actions/comments";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface Props {
  transactionId?: string;
  budgetData?: {
    userId: string;
    category: string;
    month: number;
    year: number;
  };
  workspaceId: string;
  trigger?: React.ReactNode;
  entityName: string;
}

export default function DiscussionPanel({
  transactionId,
  budgetData,
  workspaceId,
  trigger,
  entityName,
}: Props) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const queryKey = ["comments", transactionId || JSON.stringify(budgetData)];

  const { data: comments, isLoading } = useQuery({
    queryKey,
    queryFn: () => GetComments({ transactionId, budgetData }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      AddComment({
        content: data.content,
        parentId: data.parentId,
        transactionId,
        budgetData,
        workspaceId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setContent("");
      setReplyTo(null);
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => DeleteComment(commentId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comment deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addCommentMutation.mutate({ content, parentId: replyTo?.id });
  };

  const totalComments = comments?.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) || 0;

  return (
    <Sheet onOpenChange={(open) => {
        if (!open) {
            setReplyTo(null);
            setContent("");
        }
    }}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="relative group">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Discuss</span>
            {totalComments > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-background group-hover:scale-110 transition-transform">
                {totalComments}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-0 border-l shadow-2xl">
        <SheetHeader className="p-6 border-b bg-white dark:bg-slate-900 shadow-sm">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            Discussion: <span className="text-blue-500 font-extrabold truncate max-w-[200px]">{entityName}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6 space-y-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
              <div>
                <p className="font-semibold text-lg">No comments yet</p>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Be the first to start the conversation about this entry.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {comments?.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  <CommentItem
                    comment={comment}
                    currentUserId={user?.id}
                    onReply={() => setReplyTo({ id: comment.id, name: comment.userName || "Unknown" })}
                    onDelete={() => deleteCommentMutation.mutate(comment.id)}
                  />
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-10 border-l-2 border-blue-100 dark:border-blue-900/30 pl-6 space-y-6">
                      {comment.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          currentUserId={user?.id}
                          onDelete={() => deleteCommentMutation.mutate(reply.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t bg-white dark:bg-slate-900 shadow-lg">
          {replyTo && (
            <div className="flex items-center justify-between mb-3 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm border border-blue-100 dark:border-blue-800">
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Replying to <strong>{replyTo.name}</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => setReplyTo(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border-blue-100 focus-visible:ring-blue-500"
              disabled={addCommentMutation.isPending}
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={addCommentMutation.isPending || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: any;
  currentUserId?: string;
  onReply?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-900 shadow-sm">
          <AvatarImage src={comment.userImage || ""} />
          <AvatarFallback className="bg-blue-500 text-white text-[10px]">
            {comment.userName?.slice(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {comment.userName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                  onClick={onReply}
                >
                  <Reply className="h-3.5 w-3.5" />
                </Button>
              )}
              {currentUserId === comment.userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
              {comment.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
