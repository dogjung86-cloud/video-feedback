import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Link as LinkIcon, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function CreateProjectModal({ open, onOpenChange, onCreated }) {
  const { user } = useAuth();
  const [videoType, setVideoType] = useState('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadedFile(file);
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    const videoUrl = videoType === 'youtube' ? youtubeUrl : uploadedUrl;
    if (!videoUrl) return;
    
    setIsSubmitting(true);
    
    const project = await base44.entities.Project.create({
      title: title.trim(),
      description: description.trim(),
      video_url: videoUrl,
      video_type: videoType,
      status: 'in_progress',
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
      user_id: user?.id || null
    });
    
    setIsSubmitting(false);
    onCreated?.(project);
    onOpenChange(false);
    
    // Reset form
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setUploadedFile(null);
    setUploadedUrl('');
    setDeadline(null);
  };

  const isValid = title.trim() && 
    ((videoType === 'youtube' && youtubeUrl) || 
     (videoType === 'upload' && uploadedUrl));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">새 프로젝트 만들기</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">프로젝트 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="프로젝트 제목을 입력하세요"
              className="rounded-lg"
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프로젝트에 대한 설명을 입력하세요"
              className="rounded-lg resize-none h-20"
            />
          </div>
          
          {/* Video Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">영상</Label>
            <Tabs value={videoType} onValueChange={setVideoType}>
              <TabsList className="w-full bg-slate-100 rounded-lg p-1">
                <TabsTrigger value="youtube" className="flex-1 rounded-md data-[state=active]:bg-white">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  YouTube URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1 rounded-md data-[state=active]:bg-white">
                  <Upload className="w-4 h-4 mr-2" />
                  직접 업로드
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="youtube" className="mt-3">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="rounded-lg"
                />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                      uploadedFile 
                        ? "border-green-300 bg-green-50" 
                        : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    )}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>업로드 중...</span>
                      </div>
                    ) : uploadedFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                        <p className="text-xs text-green-600 mt-1">업로드 완료</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">클릭하여 영상 업로드</p>
                        <p className="text-xs text-slate-400 mt-1">MP4, MOV, WebM</p>
                      </div>
                    )}
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Deadline */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">마감일 (선택)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-lg",
                    !deadline && "text-slate-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, 'PPP', { locale: ko }) : '마감일 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              '프로젝트 생성'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}