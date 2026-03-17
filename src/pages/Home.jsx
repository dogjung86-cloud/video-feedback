import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Video, FolderOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProjectCard from '../components/project/ProjectCard.jsx';
import CreateProjectModal from '../components/project/CreateProjectModal.jsx';

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list(),
  });

  const getFeedbackCount = (projectId) => {
    return feedbacks.filter(f => f.project_id === projectId).length;
  };

  const handleProjectCreated = () => {
    refetch();
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">VideoFeedback</span>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-900 hover:bg-slate-800 rounded-xl px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 프로젝트
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">내 프로젝트</h1>
          <p className="text-slate-500">영상을 업로드하고 팀과 피드백을 주고받으세요</p>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-slate-200 rounded-2xl mb-4" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">아직 프로젝트가 없습니다</h2>
            <p className="text-slate-500 mb-6">첫 프로젝트를 만들어 영상 피드백을 시작하세요</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                feedbackCount={getFeedbackCount(project.id)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}