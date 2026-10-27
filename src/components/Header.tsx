import React from "react";
import { Logo } from "./Logo";
import {
  RefreshCw,
  HelpCircle,
  Check,
  Clock,
  AlertTriangle,
} from "lucide-react";

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
  newRecordsNotice,
}) => {
  const formatTimeRemaining = (totalSec: number) => {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formattedDate = !isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedTime = !isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <header className="bg-[#206542] text-white shadow-lg sticky top-0 z-40 border-b border-[#15432C] transition-colors">
      {/* Top Banner Notice: Error / Retrying */}
      {errorNotice && (
        <div className="bg-[#F3F6D9] text-[#15432C] px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-[#B3C03E]/40 shadow-inner">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#206542] shrink-0" />
            <span>{errorNotice}</span>
          </span>
          <span className="text-[11px] font-mono bg-[#206542]/10 px-2 py-0.5 rounded text-[#15432C]">
            Auto-retry: {formatTimeRemaining(nextRefreshSeconds)}
          </span>
        </div>
      )}

      {/* Top Notification: New Records */}
      {newRecordsNotice && (
        <div className="bg-[#B3C03E] text-[#15432C] px-4 py-1.5 text-xs font-black flex items-center justify-center gap-2 border-b border-[#15432C] shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 stroke-3" />
          <span className="tracking-wide uppercase">{newRecordsNotice}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Branding & Titles */}
          <div className="flex items-center gap-3.5">
            <div className="shrink-0">
              <Logo className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm" />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-white">
                  Extension Africa
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                MARKET PRICE INTELLIGENCE
              </h1>

              <p className="text-xs sm:text-sm text-[#E8F0EC]/85 font-normal leading-snug">
                Field price surveys from rural and urban markets across Nigeria
              </p>
            </div>
          </div>

          {/* Right: Live Status Pill & Action Controls */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#2b7a52]/60">
            {/* Status Panel Badge */}
            <div className="flex items-center gap-3 bg-[#15432C]/80 px-3 py-1.5 rounded-lg border border-[#2b7a52] shadow-inner text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#E8F0EC]/70 uppercase tracking-wider font-semibold">
                  Last Updated
                </span>
                <span className="font-bold text-white text-[11px] sm:text-xs">
                  {formattedDate ? `${formattedDate}, ` : ""}
                  {formattedTime || "Just now"}
                </span>
              </div>

              <div className="h-6 w-px bg-[#2b7a52]" />

              <div className="flex flex-col">
                <span className="text-[10px] text-[#B3C03E] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#B3C03E]" />
                  Auto Refresh
                </span>
                <span className="font-mono font-extrabold text-[#B3C03E] text-[11px] sm:text-xs">
                  {formatTimeRemaining(nextRefreshSeconds)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenTour}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#15432C] hover:bg-[#1a5135] text-white flex items-center gap-1.5 transition-all border border-[#2b7a52] hover:border-[#B3C03E]/50 shadow-sm active:scale-95 cursor-pointer"
                title="Open 3-step Dashboard Guide"
                aria-label="How to use this dashboard">
                <HelpCircle className="w-4 h-4 text-[#B3C03E]" />
                <span className="hidden sm:inline">Guide</span>
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#B3C03E] text-[#15432C] hover:bg-[#9fad32] disabled:opacity-75 transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer min-h-9.5 border border-[#B3C03E]"
                aria-label="Refresh price data">
                <RefreshCw
                  className={`w-4 h-4 text-[#15432C] ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span>
                  {isRefreshing
                    ? "Fetching..."
                    : recentlyUpdated
                      ? "Updated"
                      : "Refresh"}
                </span>
                {recentlyUpdated && !isRefreshing && (
                  <Check className="w-4 h-4 text-[#15432C] stroke-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
