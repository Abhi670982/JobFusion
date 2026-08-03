'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CreditCard, Sparkles, Clock,
  DollarSign, CheckCircle2, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { UsageCard } from '@/components/subscription/UsageCard';
import { formatPrice } from '@/lib/plans';

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function loadBillingData() {
      try {
        setLoading(true);
        // Fetch current subscription details
        const subRes = await fetch('/api/user-plan/current');
        const subData = await subRes.json();
        if (subData && subData.subscription) {
          setSubscription(subData.subscription);
        }

        // Fetch payment history logs
        const payRes = await fetch('/api/user-plan/payments');
        const payData = await payRes.json();
        if (payData && payData.payments) {
          setPayments(payData.payments);
        }
      } catch (error) {
        console.error('Error loading billing configuration:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBillingData();
  }, []);

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <main className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-6 animate-pulse skeleton-shimmer">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-muted rounded-2xl" />
          <div className="h-28 bg-muted rounded-2xl" />
        </div>
        <div className="h-48 bg-muted rounded-2xl" />
      </main>
    );
  }

  const isFree = !subscription || subscription.planId === 'free';

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Back Link */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings')}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Billing &amp; Subscriptions</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage plan upgrades, invoices, and limits</p>
        </div>
        <SubscriptionBadge planId={subscription?.planId || 'free'} />
      </div>

      {/* Subscription Card Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Active Plan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{subscription?.planName || 'Free Plan'}</p>
            </div>
          </div>

          <div className="text-right sm:text-left">
            <span className="text-2xl font-extrabold">
              {isFree ? '₹0' : subscription.planId === 'pro_yearly' ? '₹2,999' : '₹299'}
            </span>
            <span className="text-xs text-muted-foreground">
              /{subscription?.interval === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
            <div className="text-muted-foreground font-medium mb-1">Status</div>
            <div className="flex items-center gap-1.5 text-foreground capitalize">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {subscription?.status || 'Active'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
            <div className="text-muted-foreground font-medium mb-1">Billing Cycle</div>
            <div className="text-foreground capitalize">
              {subscription?.interval || 'N/A (Free)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
            <div className="text-muted-foreground font-medium mb-1">
              {subscription?.cancelAtPeriodEnd ? 'Expires on' : 'Renews on'}
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {formatDate(subscription?.currentPeriodEnd)}
            </div>
          </div>
        </div>

        {subscription?.providerSubscriptionId && (
          <p className="text-[10px] text-muted-foreground/60 leading-none">
            Subscription ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[9px]">{subscription.providerSubscriptionId}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {isFree ? (
            <Button
              onClick={() => router.push('/pricing')}
              className="flex-1 gradient-brand text-white border-0 shadow-md hover:opacity-90 transition-all font-bold rounded-xl h-10"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              View Plans &amp; Upgrade
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
                className="flex-1 rounded-xl h-10 border-border"
              >
                Change Plan
              </Button>
              <Button
                variant="ghost"
                disabled
                title="Self-service cancellation coming soon"
                className="flex-1 rounded-xl h-10 text-muted-foreground cursor-not-allowed opacity-60 bg-muted/20 border border-border/30"
              >
                Cancel Subscription
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Usage section */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm px-1">Feature Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageCard
            title="AI Resume Builder"
            used={subscription?.usage?.aiOperations?.used || 0}
            limit={subscription?.usage?.aiOperations?.limit || null}
            description="Resume parsing and AI insights"
          />
          <UsageCard
            title="Saved Jobs"
            used={subscription?.usage?.savedJobs?.used || 0}
            limit={subscription?.usage?.savedJobs?.limit || 20}
            description="Unified dashboard saved listings limit"
          />
        </div>
      </div>

      {/* Payment History Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <History className="w-4.5 h-4.5 text-muted-foreground" />
          <h3 className="font-bold text-sm">Payment History</h3>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <DollarSign className="w-8 h-8 text-muted-foreground/35 mx-auto" />
            <p className="text-sm text-muted-foreground">No invoices or payments found.</p>
            <p className="text-xs text-muted-foreground/80">When you purchase a paid plan, your invoice history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Provider ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 font-medium">
                    <td className="py-3 px-2 text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-foreground font-semibold">
                      {formatPrice(p.amount / 100)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {p.status === 'paid' ? 'Paid' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-muted-foreground text-[10px]">
                      {p.providerPaymentId || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </main>
  );
}
