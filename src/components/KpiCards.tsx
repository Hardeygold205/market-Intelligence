import React from 'react';
import { CleanRecord, PriceUnitOption } from '../data/types';
import { formatNaira, formatNumber } from '../data/clean';
import { TrendingUp, ArrowDownRight, ArrowUpRight, FileSpreadsheet, MapPin } from 'lucide-react';

interface KpiCardsProps {
  records: CleanRecord[];
  priceUnit: PriceUnitOption;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ records, priceUnit }) => {
  const isCommodityUnit = priceUnit === 'bag100';
  const unitSuffix = isCommodityUnit ? '/100kg bag' : '/kg';

  if (records.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 my-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-[#CBD5E1] p-4 text-center">
            <div className="text-xs text-[#64748B]">No matching data</div>
            <div className="text-lg font-bold text-[#CBD5E1] mt-1">—</div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate prices based on active records
  const priceValues = records.map(r => {
    if (r.valueChain === 'Commodity') {
      return priceUnit === 'bag100' ? r.pricePer100KgBag : r.pricePerKg;
    }
    return r.rawPrice;
  });

  const avgPrice = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);

  // Lowest record
  let lowestRecord = records[0];
  let lowestVal = priceValues[0];
  let highestRecord = records[0];
  let highestVal = priceValues[0];

  records.forEach((r, idx) => {
    const val = priceValues[idx];
    if (val < lowestVal) {
      lowestVal = val;
      lowestRecord = r;
    }
    if (val > highestVal) {
      highestVal = val;
      highestRecord = r;
    }
  });

  // Unique counts
  const statesSet = new Set(records.map(r => r.state));
  const lgasSet = new Set(records.map(r => `${r.state}-${r.lga}`));

  // Check if mixed value chain or purely inputs
  const onlyInputs = records.every(r => r.valueChain === 'Input');
  const displayUnit = onlyInputs ? 'per pack' : unitSuffix;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-4">
      {/* 1. Average Price */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs hover:border-[#206542] transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between text-[#206542] mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Average Price
          </span>
          <span className="p-1.5 rounded-md bg-[#E8F0EC]">
            <TrendingUp className="w-4 h-4 text-[#206542]" />
          </span>
        </div>
        <div className="text-2xl font-extrabold text-black tracking-tight">
          {formatNaira(avgPrice)}
        </div>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Weighted {displayUnit} across selection
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#206542]" />
      </div>

      {/* 2. Lowest Price */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs hover:border-[#206542] transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between text-[#206542] mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Lowest Price
          </span>
          <span className="p-1.5 rounded-md bg-[#F3F6D9]">
            <ArrowDownRight className="w-4 h-4 text-[#757F26]" />
          </span>
        </div>
        <div className="text-2xl font-extrabold text-black tracking-tight">
          {formatNaira(lowestVal)}
        </div>
        <p className="text-xs text-[#475569] mt-1 font-medium truncate" title={`${lowestRecord.product} in ${lowestRecord.lga}, ${lowestRecord.state}`}>
          <span className="font-bold text-black">{lowestRecord.product}</span> · {lowestRecord.lga}, {lowestRecord.state}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B3C03E]" />
      </div>

      {/* 3. Highest Price */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs hover:border-[#206542] transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between text-[#206542] mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Highest Price
          </span>
          <span className="p-1.5 rounded-md bg-[#E8F0EC]">
            <ArrowUpRight className="w-4 h-4 text-[#206542]" />
          </span>
        </div>
        <div className="text-2xl font-extrabold text-black tracking-tight">
          {formatNaira(highestVal)}
        </div>
        <p className="text-xs text-[#475569] mt-1 font-medium truncate" title={`${highestRecord.product} in ${highestRecord.lga}, ${highestRecord.state}`}>
          <span className="font-bold text-black">{highestRecord.product}</span> · {highestRecord.lga}, {highestRecord.state}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#15432C]" />
      </div>

      {/* 4. Price Records Count */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs hover:border-[#206542] transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between text-[#206542] mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Price Records
          </span>
          <span className="p-1.5 rounded-md bg-[#E8F0EC]">
            <FileSpreadsheet className="w-4 h-4 text-[#206542]" />
          </span>
        </div>
        <div className="text-2xl font-extrabold text-black tracking-tight">
          {formatNumber(records.length)}
        </div>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Surveyed field observations
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#206542]" />
      </div>

      {/* 5. Coverage */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs hover:border-[#206542] transition-colors relative overflow-hidden sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-[#206542] mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Geographic Coverage
          </span>
          <span className="p-1.5 rounded-md bg-[#F3F6D9]">
            <MapPin className="w-4 h-4 text-[#757F26]" />
          </span>
        </div>
        <div className="text-2xl font-extrabold text-black tracking-tight">
          {statesSet.size} States · {lgasSet.size} LGAs
        </div>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Reporting markets & farm centers
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B3C03E]" />
      </div>
    </div>
  );
};
