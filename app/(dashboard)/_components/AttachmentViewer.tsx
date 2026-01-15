"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, FileImage, File, Trash2 } from "lucide-react";
import { useState } from "react";

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export default function AttachmentViewer({
  attachments,
  onDelete,
  readOnly = false,
}: AttachmentViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  if (attachments.length === 0) {
    return null;
  }

  const handlePreview = (attachment: Attachment) => {
    if (attachment.fileType.startsWith("image/")) {
      setPreviewUrl(attachment.fileUrl);
      setPreviewName(attachment.fileName);
    } else {
      // For non-images, trigger download
      handleDownload(attachment);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium">Attachments ({attachments.length})</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              {/* Icon/Thumbnail */}
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                {attachment.fileType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(attachment)}
                  className="h-8 w-8 p-0"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="h-8 w-8 p-0"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!readOnly && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(attachment.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
