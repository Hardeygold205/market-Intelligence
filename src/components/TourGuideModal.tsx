import React, { useState } from 'react';
import { Filter, RefreshCw, Download, X, ArrowRight, Check } from 'lucide-react';
import { CONFIG } from '../config';

interface TourGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourGuideModal: React.FC<TourGuideModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem(CONFIG.LOCAL_STORAGE_TOUR_KEY, 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#206542] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B3C03E]" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Welcome to Market Price Intelligence
            </h3>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="text-white hover:text-[#B3C03E] cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 1 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F0EC] text-[#206542] flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6 text-[#206542]" />
              </div>
              <h4 className="text-center font-bold text-base text-black">
                Step 1: Cascading Slicers & Unit Toggle
              </h4>
              <p className="text-xs text-[#475569] text-center leading-relaxed">
                Filter agricultural produce and farm inputs by Geopolitical Zone, State, LGA, and Product.
                Toggle between <strong>Price per Kg</strong> and <strong>100 kg bag</strong> at any time.
                Active filter chips let you remove criteria with a single tap.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F3F6D9] text-[#757F26] flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 text-[#206542]" />
              </div>
              <h4 className="text-center font-bold text-base text-black">
                Step 2: Auto-Sync & Field Freshness
              </h4>
              <p className="text-xs text-[#475569] text-center leading-relaxed">
                Data refreshes automatically every 10 minutes and when your browser tab re-opens.
                Use the top-right <strong>Refresh</strong> button anytime for immediate data checks.
                If offline or signal drops, last verified prices remain instantly accessible.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F0EC] text-[#206542] flex items-center justify-center mx-auto">
                <Download className="w-6 h-6 text-[#206542]" />
              </div>
              <h4 className="text-center font-bold text-base text-black">
                Step 3: Interactive Map & CSV Export
              </h4>
              <p className="text-xs text-[#475569] text-center leading-relaxed">
                Click any market circle on the Nigeria map to inspect local prices and apply an LGA filter.
                When ready, hit <strong>Download CSV</strong> to export the verified data table
                strictly cleaned of personal enumerator details.
              </p>
            </div>
          )}

          {/* Stepper Dots & Action Buttons */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    s === step ? 'bg-[#206542] w-5' : 'bg-[#CBD5E1]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-black hover:bg-gray-100 rounded"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-1.5 text-xs font-bold rounded-md bg-[#206542] text-white hover:bg-[#15432C] flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-1.5 text-xs font-bold rounded-md bg-[#B3C03E] text-black hover:bg-[#9fad32] flex items-center gap-1 cursor-pointer"
                >
                  <span>Got it</span>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
