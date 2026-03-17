import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MessageSquare, Play, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  draft: { label: '초안', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: '진행 중', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' }
};

const getYouTubeThumbnail = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
  }
  return null;
};

export default function ProjectCard({ project, feedbackCount = 0 }) {
  const status = statusConfig[project.status] || statusConfig.draft;
  const thumbnail = project.thumbnail_url || 
                    (project.video_type === 'youtube' ? getYouTubeThumbnail(project.video_url) : null);

  return (
    <Link to={createPageUrl(`ProjectView?id=${project.id}`)}>
      <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 hover:shadow-lg transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-100 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <Play className="w-12 h-12 text-slate-400" />
            </div>
          )}
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg">
              <Play className="w-6 h-6 text-slate-800 ml-1" />
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge className={cn("absolute top-3 left-3", status.color)}>
            {status.label}
          </Badge>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          
          {project.description && (
            <p className="text-slate-500 text-sm mb-3 line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              {project.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(project.deadline), 'M월 d일', { locale: ko })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                피드백 {feedbackCount}
              </span>
            </div>
            
            {project.created_date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(project.created_date), 'M월 d일', { locale: ko })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}