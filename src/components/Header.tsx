import React from 'react';
import { Logo } from './Logo';
import { RefreshCw, HelpCircle, Check, Database } from 'lucide-react';

interface HeaderProps {
  lastUpdated: Date;
  nextRefreshSeconds: number;
  isRefreshing: boolean;
  recentlyUpdated: boolean;
  onRefresh: () => void;
  onOpenTour: () => void;
  errorNotice?: string;
  newRecordsNotice?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  nextRefreshSeconds,
  isRefreshing,
  recentlyUpdated,
  onRefresh,
  onOpenTour,
  errorNotice,
  newRecordsNotice
}) => {
  const formatTimeRemaining = (totalSec: number) => {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedDate = !isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  const formattedTime = !isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <header className="bg-[#206542] text-white shadow-md sticky top-0 z-40 border-b border-[#15432C]">
      {/* Top Banner Notice if refresh failed */}
      {errorNotice && (
        <div className="bg-[#F3F6D9] text-black px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-[#CBD5E1]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#B3C03E]" />
            {errorNotice}
          </span>
          <span className="text-[11px] text-[#475569]">Auto-retrying in {formatTimeRemaining(nextRefreshSeconds)}</span>
        </div>
      )}

      {/* Top Notification if new records arrived */}
      {newRecordsNotice && (
        <div className="bg-[#B3C03E] text-black px-4 py-1 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b border-[#15432C] transition-all animate-in fade-in">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{newRecordsNotice}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Logo and Titles */}
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Logo className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#B3C03E]">
                  EXTENSION AFRICA
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                MARKET PRICE INTELLIGENCE
              </h1>
              <p className="text-xs sm:text-sm text-[#E8F0EC]/90 hidden sm:block">
                Field price surveys from rural and urban markets across Nigeria
              </p>
            </div>
          </div>

          {/* Right: Refresh Controls & Tour Guide */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#2b7a52]">
            {/* Status indicators */}
            <div className="text-left md:text-right text-xs">
              <div className="text-[#E8F0EC] font-medium flex items-center md:justify-end gap-1.5">
                <span>Last updated:</span>
                <span className="font-semibold text-white">
                  {formattedDate ? `${formattedDate}, ` : ''}{formattedTime || 'Just now'}
                </span>
              </div>
              <div className="text-[#B3C03E] text-[11px] flex items-center md:justify-end gap-1">
                <span>Next refresh in</span>
                <span className="font-mono font-bold bg-[#15432C] px-1.5 py-0.2 rounded text-white">
                  {formatTimeRemaining(nextRefreshSeconds)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenTour}
                className="p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded bg-[#1a5135] hover:bg-[#15432C] text-white flex items-center gap-1 transition-colors border border-[#2b7a52]"
                title="Open 3-step Dashboard Guide"
                aria-label="How to use this dashboard"
              >
                <HelpCircle className="w-4 h-4 text-[#B3C03E]" />
                <span className="hidden sm:inline">Guide</span>
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-md bg-[#B3C03E] text-black hover:bg-[#9fad32] disabled:opacity-75 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer min-h-[40px]"
                aria-label="Refresh price data"
              >
                <RefreshCw
                  className={`w-4 h-4 text-black ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>
                  {isRefreshing
                    ? 'Fetching...'
                    : recentlyUpdated
                    ? 'Updated just now'
                    : 'Refresh'}
                </span>
                {recentlyUpdated && !isRefreshing && (
                  <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
