import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Mic,
  Bot,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Layers,
  ShieldCheck,
  Globe2,
  TrendingUp,
  PackageCheck,
  Building2,
  Sparkles,
  Clock,
  AlertCircle,
  Menu,
  X,
  Boxes,
  FileSpreadsheet,
  PhoneIncoming,
  ChevronRight,
  Database,
  Check,
  BadgeAlert,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AuthNoticeModal } from '@/components/landing/AuthNoticeModal';

/**
 * Public Marketing Landing Page for Vyapaar सेतु.
 * Route: `/`
 * 
 * Communicates:
 * - Product Identity: Vyapaar सेतु (Baatcheet se business tak.)
 * - B2B AI Voice-Commerce value proposition for Indian wholesale distributors.
 * - Conceptual voice-to-order pipeline without fabricating active phone lines or live orders.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Auth Notice Modal */}
      <AuthNoticeModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* =========================================================================
          1. NAVIGATION BAR
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-emerald-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M4 18C4 13.5817 7.58172 10 12 10C16.4183 10 20 13.5817 20 18" />
                <path d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="#A7F3D0" />
                <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                <span>Vyapaar</span>
                <span className="text-emerald-600 font-bold">सेतु</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight block mt-0.5">
                Baatcheet se business tak.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('wholesale')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Indian Wholesale
            </button>
            <button
              onClick={() => scrollToSection('languages')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Languages
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app')}
              className="shadow-subtle"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-700">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('wholesale')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Indian Wholesale
              </button>
              <button
                onClick={() => scrollToSection('languages')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Languages
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Contact
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app');
                }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
         ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
        {/* Subtle Ambient Radial Highlight */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-emerald-50/70 rounded-full blur-3xl -z-10 pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Baatcheet se business tak.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Every business call.{' '}
              <span className="text-emerald-600 block sm:inline">
                A smarter way to sell.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Meet your AI sales employee. Retailers call your business number, ask for products and prices in their language, and place orders through a simple conversation.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto shadow-subtle px-8 text-base h-12"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto text-base h-12 px-6"
              >
                <span>Explore how it works</span>
              </Button>
            </div>

            {/* Quick trust highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Multi-lingual (Hindi, Telugu, English)
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Wholesale Carton & Bori Units
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Isolated MongoDB Multi-Tenancy
              </span>
            </div>
          </div>

          {/* =========================================================================
              CONCEPTUAL PRODUCT VISUAL (Illustrative, NOT fabricated live telemetry)
             ========================================================================= */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-card p-4 sm:p-6 lg:p-8">
              {/* Card Header & Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Conceptual Voice-to-Order Architecture
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 self-start sm:self-auto">
                  Illustrative representation of upcoming voice flow
                </span>
              </div>

              {/* Grid: Audio Stream vs Structured Capture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: Retailer Inbound Voice Call Stream */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <PhoneIncoming className="w-3.5 h-3.5" /> Inbound Retailer Call
                    </span>
                    <span className="font-mono text-[11px]">Begum Bazaar, HYD</span>
                  </div>

                  {/* Audio Transcript Bubble */}
                  <div className="p-3.5 rounded-lg bg-white border border-slate-200/90 shadow-subtle space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                        LK
                      </div>
                      <span className="text-xs font-semibold text-slate-800">
                        Laxmi Kirana Store
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">Hindi / Telugu</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-amber-50/50 p-2.5 rounded border border-amber-200/40">
                      "Namaste bhaiyya! Fortune Sunlite 1-litre pouch ke 15 carton aur Parle-G 100g ke 10 carton Begum Bazaar shop pe kal subah bhej do. Current rate kya chal raha hai?"
                    </p>
                  </div>

                  {/* Processing Step Indicator */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Real-time Speech Understanding & Intent Verification</span>
                  </div>
                </div>

                {/* Right: AI Extraction & Confirmed Order Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-emerald-200/80 shadow-subtle space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <PackageCheck className="w-4 h-4 text-emerald-600" /> Structured Order Created
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      Instant Capture
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Item 1 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">Fortune Sunlite Oil (1L Pouch)</p>
                        <p className="text-[10px] text-slate-500">15 Cartons (16 pkts/carton) • Rate: ₹1,840/carton</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">₹27,600</span>
                    </div>

                    {/* Item 2 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">Parle-G Glucose Biscuit (100g)</p>
                        <p className="text-[10px] text-slate-500">10 Cartons (120 pkts/carton) • Active Scheme Applied</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">₹6,800</span>
                    </div>

                    {/* Total & Action */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-semibold">
                      <span className="text-slate-600">Draft Order Total:</span>
                      <span className="text-emerald-700 font-bold text-sm font-mono">₹34,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. THE PROBLEM SECTION
         ========================================================================= */}
      <section id="problem" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200/60">
              The Wholesale Distributor Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why manual phone ordering is breaking wholesale growth
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Indian FMCG suppliers, stockists and mandi traders handle hundreds of calls every day. Here is where business leaks away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Problem 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200/60 flex items-center justify-center font-bold">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Repeated Retailer Phone Calls
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sales clerks spend up to 4 hours every morning answering the exact same repetitive pricing, stock status, and scheme enquiries instead of expanding distribution.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Missed Orders in Busy Hours
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When phone lines are busy or retailers call after hours, kirana store owners immediately order from a competing distributor. A missed call is a lost order.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Manual Pen & Paper Errors
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scribbling orders on slips leads to wrong pack sizes, missing units, out-of-stock commitments, dispatch disputes, and delayed invoice collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. HOW VYAPAAR सेतु WORKS (4 STEPS)
         ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              The Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How Vyapaar सेतु powers your business
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Four seamless steps that turn natural telephone conversations into confirmed warehouse orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Retailer Calls Business Number
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your dedicated business phone number answers instantly 24/7 without a busy tone. Retailers talk naturally without installing apps.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <PhoneIncoming className="w-3.5 h-3.5" /> Instant Telephony Hook
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  AI Understands the Conversation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Speech is converted to text and understood in Hindi, Telugu, or Indian English with native trade vocabulary and regional accents.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5" /> Multilingual AI Voice
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Catalogue & Stock Verified
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The AI checks live inventory, calculates carton rates, applies active trade schemes, and confirms line items with the caller.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Deterministic Business Engine
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                  04
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Confirmed Orders on Dashboard
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The order lands in your distributor dashboard with full caller ID, itemized quantities, totals, and call audio recording for audit.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Dispatch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FEATURES SECTION
         ========================================================================= */}
      <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered specifically for wholesale commerce
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Designed around how Indian wholesale distributors and kirana store owners conduct business every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <PhoneIncoming className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                AI Inbound Calling
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connects to dedicated business phone lines to greet callers, answer product pricing questions, and guide retailers through order confirmation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Multilingual Speech Support
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Built to support Hindi, Telugu, and Indian English conversations, accommodating regional terms and mixed dialects used in local trading mandis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Product & Pricing Understanding
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Recognizes FMCG brand names, variant sizes, pack types, and calculates exact bill amounts based on live distributor price slabs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Wholesale Units & Bulk Packing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native support for B2B trade units including Cartons, Boxes, Boris, Bags, and Packets without confusing retail piece counts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Inventory-Aware Order Capture
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prevents commitments on out-of-stock items by verifying warehouse inventory before finalizing orders, avoiding dispatch headaches.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Centralized Order Desk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review, modify, approve, and export orders to your warehouse management system or billing software from a single unified interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BUILT FOR INDIAN WHOLESALE COMMERCE
         ========================================================================= */}
      <section id="wholesale" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                Ground Reality
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Built for Cartons, Boris, Mandi Rates and Kirana Relationships
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Generic Western e-commerce software fails Indian wholesale because it expects structured shopping carts and credit cards. Vyapaar सेतु is built for how business is actually conducted in Begum Bazaar, Azadpur, APMC and regional mandis.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Wholesale Unit Packaging</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Handles packaging hierarchies like master cartons, inner boxes, and bulk boris automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Trade Schemes & Promotions</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Supports FMCG schemes such as Buy 10 Cartons Get 1 Free and volume discounts dynamically during the call.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Retailer Identity & Credit Awareness</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Matches incoming phone numbers to established retailer accounts, credit terms, and standard delivery addresses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustrative Trade Slabs Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" /> FMCG Mandi Trade Rules
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Customizable
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Unit Type: Carton</span>
                    <span className="text-[11px] text-slate-500">12 - 24 Pouches / Packs per Master Box</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200/80">
                    Bulk Units
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Trade Scheme: Volume Slab</span>
                    <span className="text-[11px] text-slate-500">Buy 10 Cartons → 1 Free Carton Applied</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/60">
                    Auto Applied
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Caller Recognition</span>
                    <span className="text-[11px] text-slate-500">Matches Caller ID to Known Kirana Store</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200/80">
                    Verified
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic text-center pt-2">
                All business rules are configured directly in your distributor dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. LANGUAGES SECTION
         ========================================================================= */}
      <section id="languages" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              Languages
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for regional voice commerce
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Retailers communicate comfortably in their preferred regional language without switching to unfamiliar English interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Hindi */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 mx-auto flex items-center justify-center font-bold text-lg text-slate-900 shadow-subtle">
                हिन्दी
              </div>
              <h3 className="text-base font-bold text-slate-900">Hindi & Hinglish</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Natural conversational ordering for North, Central and Western Indian distribution networks.
              </p>
            </div>

            {/* Telugu */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 mx-auto flex items-center justify-center font-bold text-lg text-emerald-700 shadow-subtle">
                తెలుగు
              </div>
              <h3 className="text-base font-bold text-slate-900">Telugu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Native speech support for Andhra Pradesh and Telangana wholesale corridors and kirana retailers.
              </p>
            </div>

            {/* Indian English */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 mx-auto flex items-center justify-center font-bold text-lg text-slate-900 shadow-subtle">
                EN
              </div>
              <h3 className="text-base font-bold text-slate-900">Indian English</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear comprehension of Indian accents, brand phonetics, and standard commercial English terms.
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 mt-8 max-w-lg mx-auto">
            Language model accuracy and telephony stream latency are subject to verified AI provider capabilities as integrations are rolled out.
          </p>
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Your next order could start with a conversation.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Equip your wholesale business with an AI sales employee that never sleeps, handles peak morning calls without busy tones, and captures confirmed orders right into your dashboard.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto shadow-subtle px-8 text-base h-12"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto text-base h-12 px-6"
            >
              <span>Distributor Sign In</span>
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER SECTION
         ========================================================================= */}
      <footer id="contact" className="bg-white py-12 sm:py-16 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-100">
            {/* Brand Col */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-subtle">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M4 18C4 13.5817 7.58172 10 12 10C16.4183 10 20 13.5817 20 18" />
                    <path d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="#A7F3D0" />
                    <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  Vyapaar <span className="text-emerald-600 font-bold">सेतु</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Baatcheet se business tak.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                AI-Powered Voice Commerce & B2B Order Automation SaaS engineered for Indian wholesale distributors, super-stockists, and FMCG suppliers.
              </p>
            </div>

            {/* Navigation Anchors */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-emerald-700 transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-700 transition-colors">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('wholesale')} className="hover:text-emerald-700 transition-colors">
                    Indian Wholesale
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('languages')} className="hover:text-emerald-700 transition-colors">
                    Languages
                  </button>
                </li>
                <li>
                  <Link to="/app" className="hover:text-emerald-700 transition-colors">
                    Distributor Workspace
                  </Link>
                </li>
              </ul>
            </div>

            {/* Wholesale Trading Corridors / Contact Placeholder */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Wholesale Hubs
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Architected for high-volume trading hubs across India:
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Begum Bazaar Wholesale Mandi, Hyderabad</li>
                <li>• Azadpur & Khari Baoli, Delhi NCR</li>
                <li>• APMC Markets & Regional Hubs</li>
              </ul>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Phase 1.5 Preview
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Vyapaar सेतु. All rights reserved.</p>
            <p className="font-medium text-slate-600">
              Official Tagline: <em>Baatcheet se business tak.</em>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

