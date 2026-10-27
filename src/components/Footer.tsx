import React from 'react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 bg-white border-t border-[#CBD5E1] py-8 text-xs text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <div className="font-extrabold text-sm text-black">
                EXTENSION AFRICA
              </div>
              <div className="text-[11px] text-[#206542] font-bold">
                Market Price Intelligence Dashboard
              </div>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <p className="font-semibold text-black">
              &copy; Extension Africa &middot; Market Price Intelligence
            </p>
            <p className="text-[11px] text-[#475569]">
              Data source: KoboCollect digital survey platform verified by field officers.
            </p>
            <p className="text-[11px] italic text-[#64748B]">
              Prices are collected by field officers and may vary by day and market.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
