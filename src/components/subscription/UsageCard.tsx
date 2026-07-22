import React from 'react';
import { Progress } from '@/components/ui/progress';

interface UsageCardProps {
  title: string;
  used: number;
  limit: number | null; // null = unlimited
  icon?: React.ReactNode;
  description?: string;
}

export function UsageCard({ title, used, limit, icon, description }: UsageCardProps) {
  const isUnlimited = limit === null;
  const percent = isUnlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-primary">{icon}</div>}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="text-xs font-extrabold text-foreground">
          {used} {isUnlimited ? 'Used' : `/ ${limit} Used`}
        </div>
      </div>

      <div className="space-y-1.5">
        <Progress value={percent} className="h-2 rounded-full overflow-hidden" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{description || (isUnlimited ? 'Unlimited Access' : 'Monthly Usage Limit')}</span>
          {!isUnlimited && <span>{percent}%</span>}
        </div>
      </div>
    </div>
  );
}
