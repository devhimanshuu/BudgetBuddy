"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutTemplate, Plus, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BudgetTemplatesDialogProps {
  month: number;
  year: number;
}

export default function BudgetTemplatesDialog({
  month,
  year,
}: BudgetTemplatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [saveMode, setSaveMode] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const queryClient = useQueryClient();

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["budget-templates"],
    queryFn: () => fetch("/api/budgets/templates").then((res) => res.json()),
    enabled: open,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/budgets/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          month,
          year,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Budget saved as template!");
      setSaveMode(false);
      setTemplateName("");
      setTemplateDescription("");
      queryClient.invalidateQueries({ queryKey: ["budget-templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch("/api/budgets/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          month,
          year,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply template");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["budget-progress"] });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <LayoutTemplate className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
          <span className="sm:hidden">Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Budget Templates</DialogTitle>
          <DialogDescription>
            {saveMode 
              ? `Save current budget for ${months[month]} ${year} as a template.`
              : "Apply a saved template to your current month's budget."
            }
          </DialogDescription>
        </DialogHeader>

        {saveMode ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="Business Budget, Student Life, etc."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="My usual monthly setup..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="flex flex-col gap-3 py-2">
              {templatesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : templates?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  No templates found. Save your current budget as a template to get started!
                </p>
              ) : (
                templates?.map((template: any) => (
                  <Card key={template.id} className="relative overflow-hidden group">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          {template.name}
                          {template.isSystem && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1 opacity-70">
                              Official
                            </Badge>
                          )}
                        </CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2 hover:bg-primary hover:text-primary-foreground"
                          disabled={applyTemplateMutation.isPending}
                          onClick={() => applyTemplateMutation.mutate(template.id)}
                        >
                          {applyTemplateMutation.isPending ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                      {template.description && (
                         <CardDescription className="text-xs">
                           {template.description}
                         </CardDescription>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.entries.slice(0, 3).map((e: any) => (
                          <span key={e.id} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">
                            {e.categoryIcon} {e.category}
                          </span>
                        ))}
                        {template.entries.length > 3 && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                            +{template.entries.length - 3} more
                          </span>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {saveMode ? (
            <>
              <Button variant="ghost" onClick={() => setSaveMode(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveTemplateMutation.mutate()}
                disabled={!templateName || saveTemplateMutation.isPending}
              >
                {saveTemplateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Template
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => setSaveMode(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Save Current as Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
