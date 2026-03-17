import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from 'lucide-react';

export default function ImageViewer({ open, onOpenChange, imageUrl, fileName }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center bg-slate-900 p-6">
            <img
              src={imageUrl}
              alt={fileName || 'attachment'}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}