'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPARISON_ROWS, type ComparisonRow } from '@/lib/plans';

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="flex justify-center">
        <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Check className="w-3 h-3 text-emerald-500" aria-hidden="true" />
        </span>
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="flex justify-center">
        <Minus className="w-4 h-4 text-muted-foreground/40" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  // String value (e.g. "5/month", "Unlimited")
  return (
    <span className="text-xs font-medium text-center block">
      {String(value)}
    </span>
  );
}

function groupRows(rows: ComparisonRow[]): Map<string, ComparisonRow[]> {
  const groups = new Map<string, ComparisonRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.category) ?? [];
    existing.push(row);
    groups.set(row.category, existing);
  }
  return groups;
}

interface FeatureComparisonProps {
  className?: string;
}

export function FeatureComparison({ className }: FeatureComparisonProps) {
  const groups = groupRows(COMPARISON_ROWS);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table
        className="w-full min-w-[600px] border-collapse"
        aria-label="Feature comparison across plans"
      >
        {/* Header */}
        <thead>
          <tr>
            <th scope="col" className="text-left py-4 pr-6 text-sm font-semibold text-muted-foreground w-1/2">
              Features
            </th>
            {['Free', 'Pro', 'Recruiter'].map((plan) => (
              <th
                key={plan}
                scope="col"
                className={cn(
                  'text-center py-4 px-4 text-sm font-bold w-[16%]',
                  plan === 'Pro' ? 'text-primary' : 'text-foreground'
                )}
              >
                {plan}
              </th>
            ))}
          </tr>
          <tr>
            <td className="pb-2" />
            {['₹0', '₹299/mo', 'Custom'].map((price) => (
              <td key={price} className="text-center text-xs text-muted-foreground pb-2 px-4">
                {price}
              </td>
            ))}
          </tr>
          <tr>
            <td colSpan={4}>
              <div className="h-px bg-border mb-2" />
            </td>
          </tr>
        </thead>

        <tbody>
          {Array.from(groups.entries()).map(([category, rows]) => (
            <>
              {/* Category header */}
              <tr key={`cat-${category}`}>
                <td
                  colSpan={4}
                  className="pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60"
                >
                  {category}
                </td>
              </tr>

              {/* Feature rows */}
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className="group hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <td className="py-3 pr-6 text-sm font-medium text-foreground/80 rounded-l-lg group-hover:pl-2 transition-all">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <FeatureCell value={row.free} />
                  </td>
                  <td className="py-3 px-4 text-center bg-primary/[0.02] rounded">
                    <FeatureCell value={row.pro} />
                  </td>
                  <td className="py-3 px-4 text-center rounded-r-lg">
                    <FeatureCell value={row.recruiter} />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
