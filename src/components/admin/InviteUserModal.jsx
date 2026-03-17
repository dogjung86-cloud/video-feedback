import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function InviteUserModal({ open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('올바른 이메일 주소를 입력하세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.users.inviteUser(email.trim(), role);
      toast.success(`${email}로 초대 이메일을 보냈습니다`);
      setEmail('');
      setRole('user');
      onOpenChange(false);
    } catch (error) {
      toast.error('초대에 실패했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            사용자 초대
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 주소</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="rounded-lg"
            />
          </div>
          
          <div className="space-y-3">
            <Label>역할</Label>
            <RadioGroup value={role} onValueChange={setRole}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="font-normal cursor-pointer">
                  일반 사용자 - 프로젝트 보기 및 피드백 작성
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-normal cursor-pointer">
                  관리자 - 모든 권한 포함
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-lg"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                초대 중...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                초대 보내기
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}