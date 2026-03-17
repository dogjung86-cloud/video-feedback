import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserPlus, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InviteUserModal from './components/admin/InviteUserModal.jsx';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    };
    loadAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end gap-3">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  사용자 초대
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <User className="w-4 h-4 mr-2" />
                    {user?.full_name || user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user?.full_name}</div>
                    <div className="text-xs text-slate-500">{user?.email}</div>
                    {user?.role === 'admin' && (
                      <div className="text-xs text-blue-600 mt-1">관리자</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleLogin}
              className="rounded-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              로그인
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Invite Modal */}
      {user?.role === 'admin' && (
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
        />
      )}
    </div>
  );
}