import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Settings, Share2, MessageSquare, FileText, Pencil, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import VideoPlayer from '../components/video/VideoPlayer.jsx';
import FeedbackList from '../components/feedback/FeedbackList.jsx';
import FeedbackInput from '../components/feedback/FeedbackInput.jsx';

const statusConfig = {
  draft: { label: '초안', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: '진행 중', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' }
};

export default function ProjectView() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const videoRef = useRef(null);
  const queryClient = useQueryClient();

  const [currentTime, setCurrentTime] = useState(0);
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);
  const { user } = useAuth();

  // Overall comment editing state
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const handleCaptureRequest = async () => {
    if (videoRef.current && videoRef.current.captureFrame) {
      return await videoRef.current.captureFrame();
    }
    return null;
  };

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: feedbacks = [], isLoading: feedbacksLoading } = useQuery({
    queryKey: ['feedbacks', projectId],
    queryFn: () => base44.entities.Feedback.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId
  });

  const createFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.Feedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', projectId] });
      toast.success('피드백이 추가되었습니다');
    }
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.Feedback.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', projectId] });
      toast.success('피드백이 수정되었습니다');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.Project.update(projectId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('상태가 변경되었습니다');
    }
  });

  const updateOverallCommentMutation = useMutation({
    mutationFn: (overall_comment) => base44.entities.Project.update(projectId, { overall_comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('전체 코멘트가 저장되었습니다');
    }
  });

  const toggleResolveMutation = useMutation({
    mutationFn: (feedback) => base44.entities.Feedback.update(feedback.id, { is_resolved: !feedback.is_resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', projectId] });
    }
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (feedbackId) => base44.entities.Feedback.delete(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', projectId] });
      toast.success('피드백이 삭제되었습니다');
    }
  });

  const handleFeedbackSubmit = (data) => {
    createFeedbackMutation.mutate({
      project_id: projectId,
      content: data.content,
      timestamp: data.timestamp,
      author_name: user?.full_name || '익명',
      author_email: user?.email || null,
      file_urls: data.file_urls || [],
      user_id: user?.id || null
    });
  };

  const handleFeedbackEdit = (feedback, newContent) => {
    updateFeedbackMutation.mutate({ id: feedback.id, content: newContent });
  };

  const handleFeedbackClick = (feedback) => {
    setActiveFeedbackId(feedback.id);
  };

  const handleTimestampClick = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.seekTo(timestamp);
    }
  };

  const handleToggleResolve = (feedback) => {
    toggleResolveMutation.mutate(feedback);
  };

  const handleDeleteFeedback = (feedback) => {
    if (confirm('이 피드백을 삭제하시겠습니까?')) {
      deleteFeedbackMutation.mutate(feedback.id);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('링크가 복사되었습니다');
  };

  const startEditComment = () => {
    setCommentDraft(project?.overall_comment || '');
    setIsEditingComment(true);
  };

  const saveComment = () => {
    updateOverallCommentMutation.mutate(commentDraft.trim());
    setIsEditingComment(false);
  };

  const cancelEditComment = () => {
    setIsEditingComment(false);
    setCommentDraft('');
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">프로젝트를 찾을 수 없습니다</h2>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="mt-4 rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status] || statusConfig.draft;
  const unresolvedCount = feedbacks.filter(f => !f.is_resolved).length;

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-800 text-lg">{project.title}</h1>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              {project.deadline && (
                <p className="text-xs text-slate-500">마감일: {project.deadline}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="rounded-lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-lg">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate('draft')}>
                  상태: 초안으로 변경
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate('in_progress')}>
                  상태: 진행 중으로 변경
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate('completed')}>
                  상태: 완료로 변경
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Video Section */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <VideoPlayer
              ref={videoRef}
              videoUrl={project.video_url}
              videoType={project.video_type}
              onTimeUpdate={setCurrentTime}
              markers={feedbacks.filter(f => f.timestamp !== null && f.timestamp !== undefined)}
            />

            {/* Video Info */}
            <div className="mt-6 bg-white rounded-xl border border-slate-100 p-5">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">{project.title}</h2>
              {project.description && (
                <p className="text-slate-600">{project.description}</p>
              )}
            </div>

            {/* Overall Comment Section */}
            <div className="mt-4 bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-800">전체 수정 코멘트</h3>
                </div>
                {!isEditingComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditComment}
                    className="text-slate-500 hover:text-slate-800 rounded-lg"
                  >
                    <Pencil className="w-4 h-4 mr-1.5" />
                    {project.overall_comment ? '수정' : '작성'}
                  </Button>
                )}
              </div>

              {isEditingComment ? (
                <div className="space-y-3">
                  <Textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="영상 전체에 대한 수정 방향, 종합 의견을 작성하세요..."
                    className="min-h-[120px] resize-none border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-200 rounded-lg"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        saveComment();
                      }
                      if (e.key === 'Escape') cancelEditComment();
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={saveComment}
                      disabled={updateOverallCommentMutation.isPending}
                      className="bg-slate-900 hover:bg-slate-800 rounded-lg"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditComment}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      취소
                    </Button>
                    <span className="text-xs text-slate-400 ml-auto">Ctrl+Enter로 저장</span>
                  </div>
                </div>
              ) : project.overall_comment ? (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {project.overall_comment}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  아직 전체 코멘트가 작성되지 않았습니다
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Sidebar */}
        <div className="w-[400px] border-l border-slate-200 bg-slate-50 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">피드백</h3>
                <span className="text-sm text-slate-500">({feedbacks.length})</span>
              </div>
              {unresolvedCount > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                  미해결 {unresolvedCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Feedback List */}
          <div className="flex-1 overflow-hidden">
            <FeedbackList
              feedbacks={feedbacks}
              onFeedbackClick={handleFeedbackClick}
              activeFeedbackId={activeFeedbackId}
              isLoading={feedbacksLoading}
              onToggleResolve={handleToggleResolve}
              onDelete={handleDeleteFeedback}
              onEdit={handleFeedbackEdit}
              onTimestampClick={handleTimestampClick}
            />
          </div>

          {/* Feedback Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <FeedbackInput
              currentTime={currentTime}
              onSubmit={handleFeedbackSubmit}
              isSubmitting={createFeedbackMutation.isPending}
              onCaptureRequest={handleCaptureRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
