import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Trash2, FileIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import ImageViewer from './ImageViewer.jsx';
import { cn } from "@/lib/utils";

export default function FeedbackItem({ feedback, onClick, isActive, onToggleResolve, onDelete, onTimestampClick }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);

  const openImageViewer = (url, index) => {
    setViewerImage({ url, name: `첨부파일 ${index + 1}` });
    setViewerOpen(true);
  };

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl transition-all duration-200 border group",
        isActive 
          ? "bg-blue-50 border-blue-200 shadow-sm" 
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm",
        feedback.is_resolved && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleResolve?.(feedback);
          }}
          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
        >
          {feedback.is_resolved ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 hover:text-slate-500" />
          )}
        </button>
        
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-medium">
              {feedback.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm font-medium text-slate-800">
              {feedback.author_name || '익명'}
            </span>
            <span className="text-xs text-slate-400">
              {feedback.created_date && format(new Date(feedback.created_date), 'M월 d일 HH:mm', { locale: ko })}
            </span>
          </div>
          
          {feedback.timestamp !== null && feedback.timestamp !== undefined && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onTimestampClick?.(feedback.timestamp);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              <Clock className="w-3 h-3" />
              {formatTimestamp(feedback.timestamp)}
            </button>
          )}
          
          <p className={cn(
            "text-sm text-slate-600 leading-relaxed",
            feedback.is_resolved && "line-through"
          )}>
            {feedback.content}
          </p>
          
          {feedback.file_urls && feedback.file_urls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {feedback.file_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageViewer(url, index);
                  }}
                  className="relative group overflow-hidden rounded-lg border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md"
                >
                  <img
                    src={url}
                    alt={`첨부파일 ${index + 1}`}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <FileIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(feedback);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-slate-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <ImageViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageUrl={viewerImage?.url}
        fileName={viewerImage?.name}
      />
    </div>
  );
}