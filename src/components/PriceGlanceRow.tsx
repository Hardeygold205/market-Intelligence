import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { CleanRecord, PriceUnitOption } from '../data/types';
import { formatNaira } from '../data/clean';
import { CONFIG } from '../config';
import { Info } from 'lucide-react';

interface PriceGlanceRowProps {
  records: CleanRecord[];
  priceUnit: PriceUnitOption;
}

export const PriceGlanceRow: React.FC<PriceGlanceRowProps> = ({ records, priceUnit }) => {
  const isCommodityUnit = priceUnit === 'bag100';
  const unitSuffix = isCommodityUnit ? ' (₦/100kg bag)' : ' (₦/kg)';

  // 1. Data for "Price by State" (Horizontal bar, sorted, forest green, olive highlight for highest)
  const stateAgg: Record<string, { sum: number; count: number }> = {};
  records.forEach((r) => {
    const val = r.valueChain === 'Commodity'
      ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
      : r.rawPrice;
    if (!stateAgg[r.state]) {
      stateAgg[r.state] = { sum: 0, count: 0 };
    }
    stateAgg[r.state].sum += val;
    stateAgg[r.state].count += 1;
  });

  const stateChartData = Object.entries(stateAgg)
    .map(([state, data]) => ({
      state,
      avgPrice: Math.round(data.sum / data.count),
      count: data.count
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice);

  const highestStatePrice = stateChartData.length > 0
    ? Math.max(...stateChartData.map((d) => d.avgPrice))
    : 0;

  // 2. Data for "Price trend over time"
  // Group by collectionDate
  const uniqueDates = Array.from(new Set(records.map((r) => r.collectionDate))).sort();

  // Pick up to 5 top products in the filtered set
  const productFrequency: Record<string, number> = {};
  records.forEach((r) => {
    productFrequency[r.product] = (productFrequency[r.product] || 0) + 1;
  });
  const topProducts = Object.entries(productFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p);

  // Build date-indexed data rows
  const trendData = uniqueDates.map((date) => {
    const dateRecords = records.filter((r) => r.collectionDate === date);
    const row: Record<string, any> = {
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      rawDate: date
    };

    // Overall Average on this date
    const allVals = dateRecords.map((r) =>
      r.valueChain === 'Commodity'
        ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
        : r.rawPrice
    );
    row['Average'] = Math.round(allVals.reduce((a, b) => a + b, 0) / (allVals.length || 1));

    // Individual top product prices
    topProducts.forEach((prod) => {
      const prodRecords = dateRecords.filter((r) => r.product === prod);
      if (prodRecords.length > 0) {
        const prodVals = prodRecords.map((r) =>
          r.valueChain === 'Commodity'
            ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
            : r.rawPrice
        );
        row[prod] = Math.round(prodVals.reduce((a, b) => a + b, 0) / prodVals.length);
      }
    });

    return row;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-5">
      {/* Chart 1: Price by State */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
              Price by State
              <span className="text-xs font-normal text-[#475569]">{unitSuffix}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B3C03E]" /> Highest
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#206542]" /> Benchmark
              </span>
            </div>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Average price across reporting states; olive highlight marks the highest average
          </p>
        </div>

        <div className="h-72 w-full mt-4">
          {stateChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              No price data available for current selection
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stateChartData}
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
                  dataKey="state"
                  type="category"
                  stroke="#000000"
                  fontSize={12}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  formatter={(val: any) => [formatNaira(Number(val)), 'Average Price']}
                  labelFormatter={(state) => `${state} State`}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgPrice" radius={[0, 4, 4, 0]}>
                  {stateChartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.state}`}
                      fill={entry.avgPrice === highestStatePrice ? '#B3C03E' : '#206542'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Price trend over time */}
      <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
            Price Trend Over Time
            <span className="text-xs font-normal text-[#475569]">{unitSuffix}</span>
          </h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Temporal fluctuation by collection date across monitored products
          </p>
        </div>

        <div className="h-72 w-full mt-4 flex items-center justify-center">
          {uniqueDates.length <= 1 ? (
            <div className="p-4 rounded-lg bg-[#F3F6D9] border border-[#CBD5E1] text-black text-center max-w-sm">
              <Info className="w-5 h-5 mx-auto text-[#757F26] mb-1.5" />
              <div className="text-xs font-bold">Single Survey Date</div>
              <p className="text-[11px] text-[#475569] mt-1">
                Data was surveyed on{' '}
                <span className="font-semibold text-black">
                  {uniqueDates[0] ? new Date(uniqueDates[0]).toLocaleDateString() : 'recent dates'}
                </span>
                . Trend line will show temporal progression when multiple dates are recorded.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [formatNaira(Number(val)), String(name)]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  iconType="plainline"
                />
                {/* Average line */}
                <Line
                  type="monotone"
                  dataKey="Average"
                  name="All Average"
                  stroke="#206542"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#206542' }}
                />
                {/* Top products lines */}
                {topProducts.slice(0, 4).map((prod, idx) => {
                  const colors = CONFIG.COLORS.chartSeries;
                  const color = colors[(idx + 1) % colors.length];
                  return (
                    <Line
                      key={prod}
                      type="monotone"
                      dataKey={prod}
                      name={prod}
                      stroke={color}
                      strokeWidth={1.8}
                      strokeDasharray={idx % 2 === 1 ? '4 4' : undefined}
                      dot={{ r: 2.5, fill: color }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
