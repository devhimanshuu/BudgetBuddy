"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, File } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FileAttachment {
  id?: string;
  fileName: string;
  fileUrl: string; // Base64 data URL
  fileSize: number;
  fileType: string;
  preview?: string;
}

interface FileUploadProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function FileUpload({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  maxSizeMB = 5,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const newAttachments: FileAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
          toast.error(`${file.name} is too large. Max size: ${maxSizeMB}MB`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);

        const attachment: FileAttachment = {
          fileName: file.name,
          fileUrl: base64,
          fileSize: file.size,
          fileType: file.type,
          preview: file.type.startsWith("image/") ? base64 : undefined,
        };

        newAttachments.push(attachment);
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} file(s) added`);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Attachments</Label>
        <span className="text-xs text-muted-foreground">
          {attachments.length}/{maxFiles} files
        </span>
      </div>

      {/* File Input */}
      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={uploading || attachments.length >= maxFiles}
          className="hidden"
        />
        <Label
          htmlFor="file-upload"
          className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm transition-colors hover:bg-accent ${
            uploading || attachments.length >= maxFiles
              ? "cursor-not-allowed opacity-50"
              : ""
          }`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Add Files"}
        </Label>
        <span className="text-xs text-muted-foreground">
          Max {maxSizeMB}MB per file
        </span>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              {/* Preview/Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                {attachment.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.preview}
                    alt={attachment.fileName}
                    className="h-full w-full rounded object-cover"
                  />
                ) : attachment.fileType.startsWith("image/") ? (
                  <FileImage className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <File className="h-6 w-6 text-muted-foreground" />
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

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
