"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2, BarChart3, TrendingUp, HelpCircle } from "lucide-react";

interface ChartData {
  date: string;
  value: number;
}

interface SourceData {
  name: string;
  value: number;
}

interface ParsingRateData {
  name: string;
  value: number;
  color: string;
}

interface WeeklyActivityData {
  day: string;
  signups: number;
  uploads: number;
  applications: number;
}

interface AnalyticsPayload {
  userGrowth: {
    daily: ChartData[];
    weekly: ChartData[];
    monthly: ChartData[];
  };
  resumeUploads: ChartData[];
  jobApplications: ChartData[];
  jobSourceDistribution: SourceData[];
  aiParsingSuccessRate: ParsingRateData[];
  topExtractedSkills: SourceData[];
  weeklyActivity: WeeklyActivityData[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGrowthTimeframe, setUserGrowthTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to retrieve analytical reports.");
      }
    } catch (err: any) {
      setError(err.message || "Connection timeout accessing analytics endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-[#a1a1aa] font-semibold">Generating analytical charts...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-8 max-w-md mx-auto text-center space-y-3">
        <HelpCircle className="w-10 h-10 text-[#71717a] mx-auto" />
        <h3 className="text-sm font-bold text-[#f4f4f5]">Analytics Unavailable</h3>
        <p className="text-xs text-[#a1a1aa]">{error || "No database metrics returned."}</p>
      </div>
    );
  }

  // Color arrays
  const DONUT_COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];

  // Helper checking if dataset has values
  const hasValues = (arr: any[]) => arr && arr.some((item) => (item.value !== undefined ? item.value > 0 : item.signups > 0 || item.uploads > 0 || item.applications > 0));

  // Timeframe selector dataset
  const userGrowthData = data.userGrowth[userGrowthTimeframe];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Analytics Center
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Platform analytics and database trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. User Growth Chart */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">1. User Growth Trend</h3>
            {/* Toggle tabs */}
            <div className="flex gap-1 p-0.5 bg-[#18181b] border border-[#27272a] rounded-xl w-fit">
              {(["daily", "weekly", "monthly"] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setUserGrowthTimeframe(time)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                    userGrowthTimeframe === time ? "bg-[#27272a] text-[#ffffff]" : "text-[#71717a] hover:text-[#e4e4e7]"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(userGrowthData) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No user registration data in database.</p>
            )}
          </div>
        </div>

        {/* 2. Resume Upload Trend */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">2. Resume Upload Trend</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.resumeUploads) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.resumeUploads} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No resume uploads logged.</p>
            )}
          </div>
        </div>

        {/* 3. Job Applications Trend */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">3. Job Applications Trend</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.jobApplications) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.jobApplications} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No applications registered yet.</p>
            )}
          </div>
        </div>

        {/* 4. Job Source Distribution */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">4. Job Source Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.jobSourceDistribution) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.jobSourceDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.jobSourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No jobs in database to distribute.</p>
            )}
          </div>
        </div>

        {/* 5. AI Parsing Success Rate */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">5. AI Parsing Success Rate</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.aiParsingSuccessRate) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.aiParsingSuccessRate}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.aiParsingSuccessRate.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No parsing log history exists.</p>
            )}
          </div>
        </div>

        {/* 6. Top Extracted Skills */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">6. Top Extracted Skills</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.topExtractedSkills) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.topExtractedSkills}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={9} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={9} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No extracted skills found in profiles.</p>
            )}
          </div>
        </div>

        {/* 7. Weekly Platform Activity */}
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">7. Weekly Platform Activity</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasValues(data.weeklyActivity) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="signups" fill="#3b82f6" name="Signups" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="uploads" fill="#8b5cf6" name="Uploads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applications" fill="#ec4899" name="Applications" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#71717a]">No activities in the last 7 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
