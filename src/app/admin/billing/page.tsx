"use client";

import { useState, useEffect } from "react";
import { CreditCard, Activity, Loader2, HelpCircle } from "lucide-react";

interface BillingPayload {
  revenue: {
    monthly: number;
    mrr: number;
  };
  transactions: Array<{
    _id: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    user?: { fullName: string; email: string; profileImage: string };
  }>;
}

export default function AdminBilling() {
  const [billingData, setBillingData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/admin/billing");
      const json = await res.json();
      if (json.success) {
        setBillingData(json.data);
      } else {
        setError(json.error || "Failed to retrieve billing data.");
      }
    } catch (err: any) {
      setError(err.message || "Connection error accessing billing endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs text-[#a1a1aa] font-semibold">Loading billing metrics...</p>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-8 max-w-md mx-auto text-center space-y-3">
        <HelpCircle className="w-10 h-10 text-[#71717a] mx-auto" />
        <h3 className="text-sm font-bold text-[#f4f4f5]">Billing Unavailable</h3>
        <p className="text-xs text-[#a1a1aa]">{error || "No data returned."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Billing & Revenue Management
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Monitor subscriptions, transactions, and revenue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Monthly Revenue</p>
            <p className="text-3xl font-bold text-[#f4f4f5] tabular-nums mt-1">₹{billingData.revenue.monthly.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
        
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Monthly Recurring Revenue (MRR)</p>
            <p className="text-3xl font-bold text-[#f4f4f5] tabular-nums mt-1">₹{billingData.revenue.mrr.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#27272a] bg-[#18181b]/40">
          <h3 className="text-xs font-bold text-[#f4f4f5] uppercase tracking-wider">All Transactions</h3>
        </div>
        {billingData.transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/20 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {billingData.transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[#18181b]/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-[#a1a1aa]">{tx._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      {tx.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-[#27272a] overflow-hidden bg-[#09090b] flex items-center justify-center">
                            {tx.user.profileImage ? (
                              <img src={tx.user.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-semibold text-indigo-400">{tx.user.fullName[0]}</span>
                            )}
                          </div>
                          <span className="font-bold text-[#e4e4e7]">{tx.user.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-[#71717a] italic">Unknown User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#f4f4f5]">
                      {tx.currency === 'INR' ? '₹' : '$'}{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tx.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        tx.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#71717a] tabular-nums">
                      {new Date(tx.date).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
