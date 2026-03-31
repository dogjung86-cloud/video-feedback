import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FeedbackItem from './FeedbackItem.jsx';

export default function FeedbackList({
  feedbacks,
  onFeedbackClick,
  activeFeedbackId,
  isLoading,
  onToggleResolve,
  onDelete,
  onEdit,
  onTimestampClick
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filterResolved, setFilterResolved] = useState('all');

  const filteredFeedbacks = feedbacks
    .filter(feedback => {
      const matchesSearch = feedback.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           feedback.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResolved = filterResolved === 'all' || 
                             (filterResolved === 'resolved' && feedback.is_resolved) ||
                             (filterResolved === 'unresolved' && !feedback.is_resolved);
      return matchesSearch && matchesResolved;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_date) - new Date(b.created_date);
      } else if (sortBy === 'timestamp') {
        return (a.timestamp || 0) - (b.timestamp || 0);
      }
      return 0;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="sticky top-0 bg-slate-50/80 backdrop-blur-sm p-3 border-b border-slate-100">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="피드백 검색..."
            className="pl-9 bg-white border-slate-200 rounded-lg"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg">
                <SlidersHorizontal className="w-3 h-3 mr-1.5" />
                {sortBy === 'latest' ? '최신순' : sortBy === 'oldest' ? '오래된순' : '시간순'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('latest')}>최신순</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>오래된순</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('timestamp')}>영상 시간순</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg">
                <Filter className="w-3 h-3 mr-1.5" />
                {filterResolved === 'all' ? '전체' : filterResolved === 'resolved' ? '해결됨' : '미해결'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilterResolved('all')}>전체</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterResolved('unresolved')}>미해결</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterResolved('resolved')}>해결됨</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">
              {searchQuery ? '검색 결과가 없습니다' : '아직 피드백이 없습니다'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <FeedbackItem
              key={feedback.id}
              feedback={feedback}
              onClick={() => onFeedbackClick(feedback)}
              isActive={activeFeedbackId === feedback.id}
              onToggleResolve={onToggleResolve}
              onDelete={onDelete}
              onEdit={onEdit}
              onTimestampClick={onTimestampClick}
            />
          ))
        )}
      </div>
    </div>
  );
}