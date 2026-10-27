import React, { useState } from 'react';
import { CleanRecord } from '../data/types';
import { formatNaira } from '../data/clean';
import { AlertCircle, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

interface DataQualityPanelProps {
  suspectRecords: CleanRecord[];
  includeFlagged: boolean;
  onToggleIncludeFlagged: (include: boolean) => void;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  suspectRecords,
  includeFlagged,
  onToggleIncludeFlagged
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-5 rounded-lg border border-[#B3C03E] bg-[#F3F6D9] text-black shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <span className="p-1.5 rounded-md bg-[#B3C03E] text-black">
            <AlertCircle className="w-5 h-5 text-black" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-black">
                Data Quality Assurance
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-[#CBD5E1] text-black">
                {suspectRecords.length} suspect record{suspectRecords.length === 1 ? '' : 's'} flagged
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Outliers below minimum threshold (₦20/kg commodity, ₦100/input) or 4× product median are excluded by default
            </p>
          </div>
        </div>

        {/* Right: Include Checkbox & Collapse Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#CBD5E1]">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-black select-none">
            <button
              type="button"
              onClick={() => onToggleIncludeFlagged(!includeFlagged)}
              className="text-[#206542] focus:outline-none"
              aria-label="Toggle include flagged records"
            >
              {includeFlagged ? (
                <CheckSquare className="w-4 h-4 fill-[#206542] text-white" />
              ) : (
                <Square className="w-4 h-4 text-[#475569]" />
              )}
            </button>
            <span>Include flagged records</span>
          </label>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded text-black hover:bg-[#B3C03E]/30 transition-colors cursor-pointer"
            aria-expanded={isOpen}
            title={isOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Table */}
      {isOpen && (
        <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-[#CBD5E1]/60 bg-white">
          <p className="text-xs text-[#475569] mb-2 font-medium">
            Flagged submissions are isolated to safeguard overall statistical accuracy:
          </p>
          {suspectRecords.length === 0 ? (
            <div className="text-xs text-center py-4 text-[#64748B]">
              No flagged records detected in the active data load.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-[#CBD5E1]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E8F0EC] text-[#206542] font-bold text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Value Chain</th>
                    <th className="py-2 px-3">Recorded Value</th>
                    <th className="py-2 px-3">Reason for Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-black">
                  {suspectRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-[#475569] whitespace-nowrap">
                        {r.collectionDate}
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        {r.lga}, {r.state}
                      </td>
                      <td className="py-2 px-3 font-bold">
                        {r.product}
                        {r.brand && ` (${r.brand})`}
                      </td>
                      <td className="py-2 px-3 text-[#475569]">{r.valueChain}</td>
                      <td className="py-2 px-3 font-bold text-black whitespace-nowrap">
                        {formatNaira(r.rawPrice)} ({r.packDescription})
                      </td>
                      <td className="py-2 px-3 text-black font-medium">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#F3F6D9] border border-[#B3C03E] text-black text-[11px]">
                          {r.suspectReason || 'Outlier threshold exceeded'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
