"use client";

import { useEffect, useState } from "react";
import { Zap, BarChart3, TrendingUp, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AIUsageData {
  used: number;
  limit: number | null;
  isPro: boolean;
  featureUsage: Record<string, number>;
}

export function UsageDashboard({ userId }: { userId?: string }) {
  const [aiUsage, setAiUsage] = useState<AIUsageData>({
    used: 0,
    limit: 2,
    isPro: false,
    featureUsage: {},
  });

  // Fetch subscription and usage data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription
        const subResponse = await fetch("/api/user-plan/current");
        const subData = await subResponse.json();
        
        // Fetch usage
        let usageData = null;
        if (userId) {
          const usageResponse = await fetch(`/api/user/usage?userId=${userId}`);
          const usageResult = await usageResponse.json();
          usageData = usageResult.data;
        }

        setAiUsage({
          used: usageData?.todayUsage || 0,
          limit: subData.data?.planId === "free" ? 2 : null,
          isPro: subData.data?.planId !== "free",
          featureUsage: usageData?.featureUsage || {},
        });
      } catch (error) {
        console.error("Failed to fetch usage data:", error);
      }
    };

    fetchData();
  }, [userId]);

  const usagePercentage = aiUsage.limit ? (aiUsage.used / aiUsage.limit) * 100 : 0;
  const isNearLimit = aiUsage.limit && aiUsage.used >= aiUsage.limit - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Usage
        </CardTitle>
        <CardDescription>
          Track your daily AI requests and usage limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pro Badge */}
        {aiUsage.isPro && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <Crown className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Pro Plan - Unlimited AI Requests
            </span>
          </div>
        )}

        {/* Usage Progress */}
        {!aiUsage.isPro && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Requests Today</span>
              <span className={`text-sm font-bold ${isNearLimit ? "text-amber-500" : ""}`}>
                {aiUsage.used} / {aiUsage.limit}
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={isNearLimit ? "h-2" : "h-2"}
            />
            {isNearLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                You're approaching your daily limit. Upgrade to Pro for unlimited access.
              </p>
            )}
          </div>
        )}

        {/* Feature Breakdown */}
        {Object.keys(aiUsage.featureUsage).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Feature Usage
            </h4>
            <div className="space-y-2">
              {Object.entries(aiUsage.featureUsage).map(([feature, count]) => (
                <div key={feature} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">
                    {feature.replace(/-/g, " ")}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Total This Week</span>
            </div>
            <p className="text-2xl font-bold">
              {Object.values(aiUsage.featureUsage).reduce((sum, count) => sum + count, 0)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>Status</span>
            </div>
            <p className={`text-lg font-bold ${aiUsage.isPro ? "text-purple-500" : "text-blue-500"}`}>
              {aiUsage.isPro ? "Unlimited" : "Limited"}
            </p>
          </div>
        </div>

        {/* Reset Info */}
        {!aiUsage.isPro && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Usage resets daily at midnight
          </div>
        )}
      </CardContent>
    </Card>
  );
}
