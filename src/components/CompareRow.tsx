import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { CleanRecord, PriceUnitOption } from '../data/types';
import { formatNaira } from '../data/clean';

interface CompareRowProps {
  records: CleanRecord[];
  priceUnit: PriceUnitOption;
}

export const CompareRow: React.FC<CompareRowProps> = ({ records, priceUnit }) => {
  const [lgaRankingView, setLgaRankingView] = useState<'top' | 'bottom'>('top');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const isCommodityUnit = priceUnit === 'bag100';
  const unitSuffix = isCommodityUnit ? ' (₦/100kg bag)' : ' (₦/kg)';

  // 1. Data for "Price range by product" (min, max, average)
  const productAgg: Record<string, { min: number; max: number; sum: number; count: number }> = {};
  records.forEach((r) => {
    const val = r.valueChain === 'Commodity'
      ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
      : r.rawPrice;
    if (!productAgg[r.product]) {
      productAgg[r.product] = { min: val, max: val, sum: val, count: 1 };
    } else {
      const curr = productAgg[r.product];
      curr.min = Math.min(curr.min, val);
      curr.max = Math.max(curr.max, val);
      curr.sum += val;
      curr.count += 1;
    }
  });

  const productRangeData = Object.entries(productAgg)
    .map(([product, data]) => ({
      product,
      min: data.min,
      max: data.max,
      avg: Math.round(data.sum / data.count),
      spread: data.max - data.min,
      count: data.count
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8); // Top 8 products by value

  // Available products for the LGA ranking dropdown, sorted by record count
  const availableProducts = Object.entries(productAgg)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([product]) => product);
  const currentProduct = selectedProduct && availableProducts.includes(selectedProduct)
    ? selectedProduct
    : (availableProducts[0] || '');

  // 2. Data for Top 10 / Bottom 10 LGAs for the current chosen product
  const targetRecords = records.filter((r) => r.product === currentProduct);
  const lgaAgg: Record<string, { sum: number; count: number; state: string }> = {};

  targetRecords.forEach((r) => {
    const val = r.valueChain === 'Commodity'
      ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
      : r.rawPrice;
    const key = `${r.lga} (${r.state})`;
    if (!lgaAgg[key]) {
      lgaAgg[key] = { sum: 0, count: 0, state: r.state };
    }
    lgaAgg[key].sum += val;
    lgaAgg[key].count += 1;
  });

  const lgaList = Object.entries(lgaAgg).map(([lgaLabel, data]) => ({
    lga: lgaLabel,
    avgPrice: Math.round(data.sum / data.count),
    count: data.count
  }));

  const sortedLgas = lgaRankingView === 'top'
    ? [...lgaList].sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10)
    : [...lgaList].sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-5">
      {/* 1. Price Range by Product */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
              Price Range by Product
              <span className="text-xs font-normal text-[#475569]">{unitSuffix}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#206542]" /> Min Base
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B3C03E]" /> Price Range
              </span>
            </div>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Minimum baseline and maximum recorded spread with market averages
          </p>
        </div>

        <div className="h-72 w-full mt-4">
          {productRangeData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              No products found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productRangeData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="product"
                  stroke="#000000"
                  fontSize={11}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => {
                    const row = item.payload;
                    return [
                      `Min: ${formatNaira(row.min)} | Avg: ${formatNaira(row.avg)} | Max: ${formatNaira(row.max)}`,
                      row.product
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                {/* Stacked bar to show floating min-max range */}
                <Bar dataKey="min" stackId="range" fill="#206542" name="Minimum Base" />
                <Bar dataKey="spread" stackId="range" fill="#B3C03E" name="Spread to Maximum" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Top 10 / Bottom 10 LGAs */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
                LGA Price Rankings
                <span className="text-xs font-normal text-[#475569]">{unitSuffix}</span>
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">
                Highest and lowest average prices by local government area
              </p>
            </div>

            {/* Segmented control: Top 10 vs Bottom 10 */}
            <div className="flex items-center border border-[#CBD5E1] rounded-md overflow-hidden text-xs font-bold self-start">
              <button
                type="button"
                onClick={() => setLgaRankingView('top')}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  lgaRankingView === 'top'
                    ? 'bg-[#206542] text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Top 10 Highest
              </button>
              <button
                type="button"
                onClick={() => setLgaRankingView('bottom')}
                className={`px-3 py-1 cursor-pointer transition-colors border-l border-[#CBD5E1] ${
                  lgaRankingView === 'bottom'
                    ? 'bg-[#206542] text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Bottom 10 Lowest
              </button>
            </div>
          </div>

          {/* Product Selector for LGA Ranking */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0] text-xs">
            <span className="font-bold text-[#475569] text-[11px] uppercase">
              Ranking Product:
            </span>
            <select
              value={currentProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-2 py-1 bg-white border border-[#CBD5E1] rounded text-xs font-semibold text-black focus:outline-none focus:border-[#206542]"
            >
              {availableProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#64748B]">
              ({targetRecords.length} records)
            </span>
          </div>
        </div>

        <div className="h-64 w-full mt-3">
          {sortedLgas.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              No LGA records available for {currentProduct}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sortedLgas}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  stroke="#64748B"
                  fontSize={11}
                />
                <YAxis
                  dataKey="lga"
                  type="category"
                  stroke="#000000"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [formatNaira(Number(val)), `Average for ${currentProduct}`]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgPrice" radius={[0, 4, 4, 0]}>
                  {sortedLgas.map((entry, index) => (
                    <Cell
                      key={`lga-${entry.lga}`}
                      fill={lgaRankingView === 'top' && index === 0 ? '#B3C03E' : '#206542'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
