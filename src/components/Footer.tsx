import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 bg-white border-t border-[#CBD5E1] py-8 text-xs text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[11px] font-bold text-sm text-black">
                &copy; 2026 Extension Africa. All right reseerved.
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[#206542] font-bold">
            Market Price Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
};
