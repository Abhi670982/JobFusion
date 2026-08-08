'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ_ITEMS } from '@/lib/plans';

interface PricingFAQProps {
  className?: string;
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <button
        id={id}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full text-left px-5 py-4 flex items-center justify-between gap-4',
          'hover:bg-muted/50 transition-colors focus-ring',
          open && 'bg-muted/30'
        )}
      >
        <span className="text-sm font-semibold leading-snug">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-muted-foreground"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFAQ({ className }: PricingFAQProps) {
  return (
    <section
      className={cn('w-full', className)}
      aria-labelledby="faq-heading"
    >
      <div className="text-center mb-10">
        <h2
          id="faq-heading"
          className="text-2xl sm:text-3xl font-bold mb-3"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Everything you need to know about Gohyred&apos;s plans and billing.
        </p>
      </div>

      <div
        className="max-w-2xl mx-auto space-y-3"
        role="list"
        aria-label="Frequently asked questions"
      >
        {FAQ_ITEMS.map((item, i) => (
          <FAQItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
