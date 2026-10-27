import React from 'react';
import { MarketInsight } from '../data/insights';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface InsightsCardProps {
  insights: MarketInsight[];
}

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
  return (
    <div className="bg-[#E8F0EC] border-2 border-[#206542] rounded-lg p-4 sm:p-5 my-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-md bg-[#206542] text-white">
          <Lightbulb className="w-5 h-5 text-[#B3C03E]" />
        </span>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#206542] uppercase tracking-wide">
            What This Means
          </h2>
          <p className="text-xs text-[#000000]">
            Automated market takeaways computed directly from surveyed price data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-md p-3.5 border border-[#CBD5E1] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#206542] mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#757F26] shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-black leading-relaxed">
                {item.detail}
              </p>
            </div>
            {item.highlight && (
              <div className="mt-2 text-[11px] font-bold text-[#206542]">
                {item.highlight}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
