'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Briefcase, Sparkles, CheckCheck, X, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchJobs } from '@/lib/api-helper';
import { cn } from '@/lib/utils';

const typeConfig = {
  job_match: { icon: Briefcase, color: '#6366f1', bg: 'bg-indigo-500/10' },
  ai_recommendation: { icon: Sparkles, color: '#f59e0b', bg: 'bg-amber-500/10' },
  system: { icon: Bell, color: '#64748b', bg: 'bg-slate-500/10' },
};

function formatTime(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function loadNotifications() {
      try {
        const allJobs = await fetchJobs();
        if (allJobs && allJobs.length > 0) {
          // Sort by posting date (newest first)
          const sortedJobs = [...allJobs].sort((a, b) => 
            new Date(b.createdAt || b.postedAt).getTime() - new Date(a.createdAt || a.postedAt).getTime()
          );

          // Get read and dismissed IDs from localStorage
          const readIds = JSON.parse(localStorage.getItem('jobfusion_read_notifs') || '[]');
          const dismissedIds = JSON.parse(localStorage.getItem('jobfusion_dismissed_notifs') || '[]');

          // Filter out dismissed
          const filteredJobs = sortedJobs.filter(j => !dismissedIds.includes(j._id));

          // Map to notifications
          const formatted = filteredJobs.map((job, idx) => ({
            id: job._id,
            // Vary type slightly between job_match and ai_recommendation for visual diversity
            type: idx % 3 === 0 ? 'ai_recommendation' : 'job_match',
            title: `New Job: ${job.title}`,
            message: `${job.company} is hiring for ${job.title} in ${job.location}. Skills: ${job.skills.slice(0, 3).join(', ')}`,
            time: formatTime(job.createdAt || job.postedAt),
            read: readIds.includes(job._id)
          }));
          setNotifs(formatted);
        } else {
          setNotifs([]);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifs(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      const allIds = next.map(n => n.id);
      localStorage.setItem('jobfusion_read_notifs', JSON.stringify(allIds));
      return next;
    });
  };

  const dismiss = (id: string) => {
    setNotifs(prev => {
      const next = prev.filter(n => n.id !== id);
      const dismissedIds = JSON.parse(localStorage.getItem('jobfusion_dismissed_notifs') || '[]');
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
      }
      localStorage.setItem('jobfusion_dismissed_notifs', JSON.stringify(dismissedIds));
      return next;
    });
  };

  const markRead = (id: string) => {
    setNotifs(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      const readIds = next.filter(n => n.read).map(n => n.id);
      localStorage.setItem('jobfusion_read_notifs', JSON.stringify(readIds));
      return next;
    });
  };

  const filtered = notifs.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'jobs') return n.type === 'job_match' || n.type === 'ai_recommendation';
    return true;
  });

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto w-full">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread notifications</p>
          )}
        </div>
        <div className="flex gap-2">
          {notifs.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs touch-auto" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl mb-4 lg:mb-5 h-9 flex gap-1 w-full max-w-[280px] mx-auto">
          <TabsTrigger value="all" className="rounded-lg text-xs flex-1">
            All
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px] gradient-brand text-white border-0 touch-auto">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg text-xs flex-1">Unread</TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-xs flex-1">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-2">
            <AnimatePresence>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border bg-card border-border">
                    <Skeleton className="w-10 h-10 rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3 animate-pulse" />
                      <Skeleton className="h-3 w-3/4 animate-pulse" />
                      <Skeleton className="h-2.5 w-16 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
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
                  const config = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.system;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group touch-auto',
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex-shrink-0 touch-auto"
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
  );
}
