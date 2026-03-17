import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Send, X, Paperclip, FileIcon, Loader2, Camera } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ScreenshotEditor from './ScreenshotEditor.jsx';

export default function FeedbackInput({ 
  currentTime, 
  onSubmit, 
  isSubmitting,
  disabled,
  onCaptureRequest
}) {
  const [content, setContent] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showScreenshotEditor, setShowScreenshotEditor] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newFileUrls = results.map(r => r.file_url);
      setUploadedFiles([...uploadedFiles, ...newFileUrls]);
      toast.success(`${files.length}개 파일 업로드 완료`);
    } catch (error) {
      toast.error('파일 업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleCapture = async () => {
    if (onCaptureRequest) {
      const imageUrl = await onCaptureRequest();
      if (imageUrl) {
        setCapturedImage(imageUrl);
        setShowScreenshotEditor(true);
      }
    }
  };

  const handleScreenshotSave = async (blob) => {
    setIsUploading(true);
    try {
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
      const result = await base44.integrations.Core.UploadFile({ file });
      setUploadedFiles([...uploadedFiles, result.file_url]);
      toast.success('화면 캡처가 추가되었습니다');
    } catch (error) {
      toast.error('이미지 업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    onSubmit({
      content: content.trim(),
      timestamp: includeTimestamp ? Math.floor(currentTime) : null,
      file_urls: uploadedFiles.length > 0 ? uploadedFiles : null
    });
    
    setContent('');
    setUploadedFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newFileUrls = results.map(r => r.file_url);
      setUploadedFiles([...uploadedFiles, ...newFileUrls]);
      toast.success(`${files.length}개 파일 업로드 완료`);
    } catch (error) {
      toast.error('파일 업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-xl border p-4 shadow-sm transition-colors",
        isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setIncludeTimestamp(!includeTimestamp)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            includeTimestamp 
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          )}
        >
          {includeTimestamp ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              {formatTimestamp(currentTime)}
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              타임스탬프 없음
            </>
          )}
        </button>
        <span className="text-xs text-slate-400">
          클릭하여 {includeTimestamp ? '제거' : '추가'}
        </span>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="영상에 대한 피드백을 작성하세요..."
        className="min-h-[80px] resize-none border-0 bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-200 rounded-lg"
        disabled={disabled}
      />
      
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedFiles.map((url, index) => (
            <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">
              <FileIcon className="w-3 h-3" />
              <span>파일 {index + 1}</span>
              <button
                onClick={() => removeFile(index)}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCapture}
            disabled={disabled || isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            화면 캡처
          </Button>
          
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={disabled || isUploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              disabled={disabled || isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4 mr-2" />
                )}
                파일 첨부
              </span>
            </Button>
          </label>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting || disabled}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 whitespace-nowrap"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? '전송 중...' : '피드백'}
        </Button>
      </div>

      <ScreenshotEditor
        open={showScreenshotEditor}
        onOpenChange={setShowScreenshotEditor}
        imageUrl={capturedImage}
        onSave={handleScreenshotSave}
      />
    </div>
  );
}