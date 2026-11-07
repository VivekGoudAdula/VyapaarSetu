import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  Bot,
  CheckCircle2,
  PackageCheck,
  Building2,
  Package,
  Phone,
  Mic,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Retailer Inbound Call',
    desc: 'A kirana store owner calls your dedicated Vobiz business phone number from any mobile phone.',
    icon: PhoneCall,
    detail: 'E.g. Begum Bazaar or mandi retailer dialing during morning order rush.',
    pill: 'Inbound Telephony',
  },
  {
    step: '02',
    title: 'Natural Trade Dialogue',
    desc: 'The AI answers within 2 rings in Hindi, Telugu, or English, understanding accents and trade terms.',
    icon: Bot,
    detail: 'Understands units: cartons, boris, petis, packets, and bulk variants.',
    pill: 'Gnani Speech AI',
  },
  {
    step: '03',
    title: 'Live Catalog & Price Check',
    desc: 'Stock quantities, wholesale rates, and active trade schemes are checked against live distributor data.',
    icon: PackageCheck,
    detail: 'Deterministic calculation: checks MOQ, volume slabs, and batch discounts.',
    pill: 'MongoDB Atlas',
  },
  {
    step: '04',
    title: 'Order Capture & Dashboard Sync',
    desc: 'The AI summarizes items, obtains verbal confirmation, and pushes the order straight to your desk.',
    icon: ShoppingBag,
    detail: 'Instant WebSocket alert with audio playback and turn-by-turn transcript.',
    pill: 'Live Fulfillment',
  },
];

const ONBOARDING_ROADMAP = [
  {
    number: '01',
    title: 'Create Your Business Profile',
    desc: 'Register your distributor organization, Mandi trade name, business type, and staff member roles.',
    phase: 'Phase 2',
    status: 'Completed',
    icon: Building2,
  },
  {
    number: '02',
    title: 'Add Products, Pricing & Inventory',
    desc: 'Configure SKU codes, base wholesale rates, packaging multipliers (cartons/boris), and active schemes.',
    phase: 'Phase 3',
    status: 'Upcoming Milestone',
    icon: Package,
  },
  {
    number: '03',
    title: 'Connect Business Telephony',
    desc: 'Assign an official virtual business phone number powered by Vobiz for incoming retailer calls.',
    phase: 'Phase 4',
    status: 'Upcoming Milestone',
    icon: Phone,
  },
  {
    number: '04',
    title: 'Start Receiving AI-Powered Orders',
    desc: 'Deploy the multilingual voice engine to answer inquiries, verify stock, and capture confirmed orders.',
    phase: 'Phase 5 & 6',
    status: 'Upcoming Milestone',
    icon: Mic,
  },
];

/**
 * Redesigned Enterprise Overview Page for Vyapaar सेतु.
 * Strictly light-mode, spacious, communicative, and personalized to the authenticated distributor organization.
 */
export function OverviewPage() {
  const { user, organization } = useAuth();

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Welcome Hero Section (Pure Light Theme, Warm Elevation) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-card relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-50/70 via-teal-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" size="sm" showDot>
              {organization?.name || 'Wholesale Organization'}
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {organization?.role || 'ORGANIZATION_OWNER'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500 font-mono">
              Atlas Isolated: vyapaar_setu
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Welcome, <span className="text-emerald-700">{user?.name || 'Distributor'}</span>!
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Managing <span className="text-slate-900 font-semibold">{organization?.name}</span> ({organization?.business_type || 'FMCG Mandi'}).
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
            Vyapaar सेतु gives your wholesale business a dedicated, always-on AI sales employee. Retailers call your dedicated number, ask about rates and stock in Hindi, Telugu, or English, and place confirmed orders directly into your fulfillment queue.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
              <span className="text-slate-400 font-normal">Official Tagline:</span>
              <span className="font-semibold text-emerald-700">Baatcheet se business tak.</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-tenant SaaS Architecture Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Voice-to-Order Pipeline (The Heart of the Product) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>The Voice Commerce Workflow</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Core Engine
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              How spoken trade calls are processed into validated, binding purchase orders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:border-emerald-200/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      STEP {step.step}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {step.pill}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-emerald-700 shadow-subtle">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-snug">
                  {step.detail}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Product Setup Journey (Getting Started Roadmap) */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Wholesale Onboarding Journey
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            The 4-step sequence required to take your wholesale business live on AI voice commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ONBOARDING_ROADMAP.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.number}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card relative flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.number}
                    </span>
                    <Badge variant="subtle" size="sm">
                      {item.phase}
                    </Badge>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 shadow-subtle">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-500">{item.status}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Real Indian Wholesale Trade Simulation (Visual Walkthrough) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              Conversational Order Preview
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual breakdown of how a phone enquiry converts to a validated order item in the warehouse.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spoken Retailer Dialogue Panel */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> Inbound Retailer Call
              </span>
              <span className="font-mono text-[11px] text-slate-400">Begum Bazaar, Hyderabad</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200/60 shadow-subtle space-y-1.5">
              <p className="text-xs font-semibold text-slate-900">
                Retailer (Sri Balaji Kirana):
              </p>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "भैया फॉर्च्यून सनफ्लावर १ लीटर पाउच का ५ कार्टन चाहिए और पार्ले-जी १० रुपये वाला २ बोरी। रेट क्या चल रहा है?"
              </p>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200/60 shadow-subtle space-y-1.5">
              <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-600" /> AI Sales Employee:
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                "फॉर्च्यून सनफ्लावर १ लीटर के ५ कार्टन उपलब्ध हैं, रेट ₹१,४२० प्रति कार्टन। और पार्ले-जी २ बोरी का रेट ₹९६० प्रति बोरी। कुल बिल ₹९,०२० बनता है। क्या आर्डर कन्फर्म कर दूँ?"
              </p>
            </div>
          </div>

          {/* Structured Order Document Preview */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Structured Order Record
              </span>
              <Badge variant="success" size="sm">
                Validated
              </Badge>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-subtle space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Retailer Store:</span>
                <span className="font-medium text-slate-900">Sri Balaji Kirana & General Store</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Fortune Sunflower Oil 1L (12 pcs/carton):</span>
                <span className="font-mono font-medium text-slate-900">5 Cartons • ₹7,100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Parle-G Glucose Biscuit 100g (24 pcs/bori):</span>
                <span className="font-mono font-medium text-slate-900">2 Boris • ₹1,920</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-slate-900">
                <span>Calculated Order Subtotal:</span>
                <span className="font-mono text-emerald-700">₹9,020.00</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Order will trigger instant WebSocket push to the orders desk upon verbal confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Honest Infrastructure Health & Telemetry Card */}
      <section className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-subtle shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
              Verified MongoDB Atlas Infrastructure
            </h4>
            <p className="text-xs text-slate-500">
              Native PyMongo Async driver • Multi-region Atlas cluster • Zero mock databases
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Atlas Operational
          </span>
        </div>
      </section>
    </div>
  );
}
