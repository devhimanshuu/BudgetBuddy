"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Attachment } from "@prisma/client";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileIcon, Download } from "lucide-react";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  attachments: Attachment[];
}

export default function AttachmentDialog({ open, setOpen, attachments }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!attachments || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];
  const isImage = currentAttachment.fileType.startsWith("image/");

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % attachments.length);
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + attachments.length) % attachments.length
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Transaction Attachments ({currentIndex + 1}/{attachments.length})
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex items-center justify-center relative bg-muted/20 rounded-lg overflow-hidden p-4">
            {attachments.length > 1 && (
            <>
                <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10"
                onClick={handlePrevious}
                >
                <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10"
                onClick={handleNext}
                >
                <ChevronRight className="h-6 w-6" />
                </Button>
            </>
            )}

            {isImage ? (
                <div className="relative w-full h-full">
                    <Image
                    src={currentAttachment.fileUrl}
                    alt={currentAttachment.fileName}
                    fill
                    className="object-contain"
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <FileIcon className="h-24 w-24 text-muted-foreground" />
                    <p className="text-lg font-medium">{currentAttachment.fileName}</p>
                    <Button asChild>
                        <a href={currentAttachment.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download File
                        </a>
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
