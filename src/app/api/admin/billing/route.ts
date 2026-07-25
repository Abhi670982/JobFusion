import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 1. Subscriptions stats
    const [
      activeSubscriptions,
      cancelledSubscriptions,
      trialingSubscriptions
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: "active", planId: { not: "free" } } }),
      prisma.subscription.count({ where: { status: "cancelled", planId: { not: "free" } } }),
      prisma.subscription.count({ where: { status: "trialing", planId: { not: "free" } } })
    ]);

    const subscriptionStatus = [
      { name: 'Active', value: activeSubscriptions, color: '#10b981' },
      { name: 'Cancelled', value: cancelledSubscriptions, color: '#f43f5e' },
      { name: 'Trialing', value: trialingSubscriptions, color: '#3b82f6' }
    ];

    // 2. Monthly Revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: firstDayOfMonth }
      },
      _sum: { amount: true }
    });

    const allTimeRevenue = await prisma.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true }
    });

    // 3. Failed Payments
    const failedPayments = await prisma.payment.count({
      where: { status: "failed" }
    });

    // 4. Recent Transactions
    const recentTransactions = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        subscription: {
          include: {
            user: { select: { fullName: true, email: true, profileImage: true } }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptionStatus,
        revenue: {
          monthly: monthlyRevenue._sum.amount || 0,
          allTime: allTimeRevenue._sum.amount || 0
        },
        failedPayments,
        recentTransactions: recentTransactions.map(tx => ({
          _id: tx.id,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          date: tx.createdAt,
          user: tx.subscription?.user ? {
            fullName: tx.subscription.user.fullName,
            email: tx.subscription.user.email,
            profileImage: tx.subscription.user.profileImage
          } : undefined
        }))
      }
    });
  } catch (error: any) {
    console.error("Error in billing analytics API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
