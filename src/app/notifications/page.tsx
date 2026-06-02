'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Briefcase, MessageSquare, Sparkles, Settings2,
  CheckCheck, X, ChevronRight, Filter, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import { notifications } from '@/lib/data';
import { cn } from '@/lib/utils';

const typeConfig = {
  job_match: { icon: Briefcase, color: '#6366f1', bg: 'bg-indigo-500/10' },
  application: { icon: CheckCheck, color: '#10b981', bg: 'bg-emerald-500/10' },
  recruiter: { icon: MessageSquare, color: '#8b5cf6', bg: 'bg-purple-500/10' },
  ai_recommendation: { icon: Sparkles, color: '#f59e0b', bg: 'bg-amber-500/10' },
  system: { icon: Bell, color: '#64748b', bg: 'bg-slate-500/10' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const filtered = notifs.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'jobs') return n.type === 'job_match' || n.type === 'ai_recommendation';
    if (activeTab === 'applications') return n.type === 'application';
    if (activeTab === 'messages') return n.type === 'recruiter';
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread notifications</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={markAllRead}>
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="rounded-xl mb-4 lg:mb-5 h-9 flex flex-wrap sm:flex-nowrap gap-1 w-full overflow-x-auto">
              <TabsTrigger value="all" className="rounded-lg text-xs">
                All
                {unreadCount > 0 && <Badge className="ml-1.5 h-4 px-1.5 text-[10px] gradient-brand text-white border-0">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-lg text-xs">Unread</TabsTrigger>
              <TabsTrigger value="jobs" className="rounded-lg text-xs">Jobs</TabsTrigger>
              <TabsTrigger value="applications" className="rounded-lg text-xs">Applications</TabsTrigger>
              <TabsTrigger value="messages" className="rounded-lg text-xs">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-2">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-1">All caught up!</h3>
                      <p className="text-sm text-muted-foreground">No notifications in this category.</p>
                    </motion.div>
                  ) : (
                    filtered.map((notif) => {
                      const config = typeConfig[notif.type];
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          className={cn(
                            'flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group',
                            !notif.read
                              ? 'bg-primary/5 border-primary/10 hover:bg-primary/8'
                              : 'bg-card border-border hover:bg-accent/50'
                          )}
                          onClick={() => markRead(notif.id)}
                        >
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={cn('text-sm font-medium', !notif.read && 'font-semibold')}>{notif.title}</p>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">{notif.time}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
