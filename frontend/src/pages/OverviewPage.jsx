import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PhoneCall,
  Bot,
  CheckCircle2,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Building2,
  Package,
  Phone,
  Mic,
  Boxes,
  Search,
  Check
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Retailer Inbound Call',
    desc: 'Retailer dials your dedicated Vobiz business phone number from any standard mobile phone.',
    icon: PhoneCall,
    tag: 'Vobiz Telephony',
  },
  {
    step: '02',
    title: 'Multilingual AI Dialogue',
    desc: 'Voice agent converses naturally in Hindi, Telugu, or English, checking real stock and wholesale rates.',
    icon: Bot,
    tag: 'Gnani + Groq',
  },
  {
    step: '03',
    title: 'Verbal Confirmation',
    desc: 'Order items, quantities, and schemes are summarized with mandatory spoken confirmation.',
    icon: CheckCircle2,
    tag: 'Deterministic Logic',
  },
  {
    step: '04',
    title: 'Distributor Dashboard Sync',
    desc: 'Confirmed order lands instantly on your operational desk via WebSockets with an audible chime.',
    icon: LayoutDashboard,
    tag: 'Real-time WebSocket',
  },
];

const ONBOARDING_ROADMAP = [
  {
    number: 1,
    title: 'Register Distributor Organization',
    description: 'Set up your business identity, legal GSTIN, and staff permissions.',
    phase: 'Phase 2',
    status: 'Upcoming',
    icon: Building2,
  },
  {
    number: 2,
    title: 'Configure Product Catalogue & Schemes',
    description: 'Define wholesale case rates, packaging units (bori, peti, carton), and trade promotions.',
    phase: 'Phase 3',
    status: 'Upcoming',
    icon: Package,
  },
  {
    number: 3,
    title: 'Connect Business Telephony',
    description: 'Assign a dedicated virtual business phone number powered by Vobiz.',
    phase: 'Phase 4',
    status: 'Upcoming',
    icon: Phone,
  },
  {
    number: 4,
    title: 'Activate Multilingual Voice Agent',
    description: 'Deploy the AI sales employee with Gnani speech models and live catalogue tools.',
    phase: 'Phase 5 & 6',
    status: 'Upcoming',
    icon: Mic,
  },
];

/**
 * Overview Page: The honest, polished workspace introduction for Phase 1.
 * Showcases the design system, brand ethos, and intended architecture without fake business metrics.
 */
export function OverviewPage() {
  const [demoInput, setDemoInput] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('primary');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyTagline = () => {
    navigator.clipboard.writeText('Baatcheet se business tak.');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-elevated">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold select-none backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Active • Foundation & Design System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Welcome to <span className="text-white">Vyapaar</span>{' '}
            <span className="text-emerald-400 font-semibold">सेतु</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            Your business operations, connected through conversations. Vyapaar सेतु provides wholesale distributors with an always-available AI sales employee connected to your dedicated business phone line.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyTagline}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-slate-200 transition-colors"
            >
              <span className="italic font-medium">Official Tagline:</span>
              <span className="font-semibold text-emerald-300">Baatcheet se business tak.</span>
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            </button>

            <span className="text-xs text-slate-400">
              • Built for FMCG, staples, and Indian wholesale trade
            </span>
          </div>
        </div>
      </div>

      {/* 2. Product Value Workflow: Spoken Conversation to Confirmed Order */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
              The Voice Commerce Pipeline
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              The heart of Vyapaar सेतु: converting unstructured phone dialogue into structured, validated purchase orders.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
            Core Golden Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.step} className="relative hover:border-emerald-200 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      STEP {step.step}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {step.tag}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. Getting Started Roadmap (Upcoming Business Journey) */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Distributor Onboarding Journey
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Upcoming implementation milestones required to take your wholesale business live on voice commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ONBOARDING_ROADMAP.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.number} className="border-slate-200/90">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {item.number}. {item.title}
                      </h4>
                      <Badge variant="neutral" size="sm">
                        {item.phase}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Live Orders Desk Status (Honest Empty State without Mock Data) */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Orders Desk Status
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time feed for incoming voice phone orders.
          </p>
        </div>

        <EmptyState
          icon={<Boxes className="w-6 h-6 text-slate-400" />}
          title="No Active Orders (Awaiting Phase 2 & 7)"
          description="Business records, live telephone calls, and incoming purchase orders will populate here once distributor onboarding and telephony pipelines are activated."
          action={
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Real data policy: zero mock records generated</span>
            </div>
          }
        />
      </section>

      {/* 5. Design System & UI Primitives Sandbox */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Design System Verification
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Interactive preview of reusable UI primitives built for the $10,000 SaaS visual standard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Button Variants Card */}
          <Card>
            <CardHeader>
              <CardTitle>Button Primitives</CardTitle>
              <CardDescription>
                Accessible buttons supporting primary, secondary, outline, destructive, and loading states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <Button size="sm" variant="primary">Small</Button>
                <Button size="default" variant="primary">Default</Button>
                <Button size="lg" variant="primary">Large</Button>
                <Button variant="primary" isLoading>Loading State</Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Inputs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Input Controls</CardTitle>
              <CardDescription>
                High-contrast form controls and status indicators with semantic states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" showDot>Accepted</Badge>
                <Badge variant="warning" showDot>Pending Review</Badge>
                <Badge variant="info" showDot>In Transit</Badge>
                <Badge variant="destructive" showDot>Rejected</Badge>
                <Badge variant="neutral">Draft</Badge>
              </div>

              {/* Input Demo */}
              <div className="pt-1">
                <Input
                  label="Sample Search Control"
                  placeholder="Search catalogue by SKU or product name..."
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  helperText="Interactive component demonstration with focus rings."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

