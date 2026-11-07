import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Informative authentication notice modal for the public landing page.
 * Transparently informs the user that Phase 2 brings JWT auth and org onboarding,
 * and allows direct entry to the Phase 1.5 preview dashboard.
 */
export function AuthNoticeModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-popover border border-slate-200/90 p-6 z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              Roadmap Notice
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1">
              Distributor Sign In
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            Secure distributor authentication, multi-tenant organization creation, and JWT session management are scheduled for <strong>Phase 2</strong>.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Isolated Multi-Tenancy:</strong> Strict organization-level data segregation verified on MongoDB Atlas.
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Preview Access:</strong> You can explore the live distributor workspace shell and voice commerce pipeline immediately.
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => {
              onClose();
              navigate('/app');
            }}
          >
            Launch Distributor Workspace
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-center"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
