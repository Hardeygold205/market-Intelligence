/**
 * Rule-based insights engine (no AI API call needed)
 * Generates 3 clear, plain-language bullet points tailored to the active filtered view.
 */
import { CleanRecord, PriceUnitOption } from './types';
import { formatNaira } from './clean';

export interface MarketInsight {
  title: string;
  detail: string;
  highlight?: string;
}

export function generateInsights(
  records: CleanRecord[],
  priceUnit: PriceUnitOption
): MarketInsight[] {
  if (records.length === 0) {
    return [
      {
        title: 'No Data for Active Filters',
        detail: 'Clear or broaden your selection to generate price intelligence insights.'
      }
    ];
  }

  const insights: MarketInsight[] = [];
  const unitLabel = priceUnit === 'bag100' ? '/100kg bag' : '/kg';

  // 1. Cheapest vs Highest State for dominant commodity
  // Find the commodity with the most records in the filtered set
  const commodityCounts: Record<string, number> = {};
  records.forEach(r => {
    if (r.valueChain === 'Commodity') {
      commodityCounts[r.product] = (commodityCounts[r.product] || 0) + 1;
    }
  });

  const sortedCommodities = Object.entries(commodityCounts).sort((a, b) => b[1] - a[1]);
  const primaryCommodity = sortedCommodities.length > 0 ? sortedCommodities[0][0] : null;

  if (primaryCommodity) {
    const matching = records.filter(r => r.product === primaryCommodity);
    // Group by state
    const stateAverages: Record<string, { sum: number; count: number }> = {};
    matching.forEach(r => {
      const p = priceUnit === 'bag100' ? r.pricePer100KgBag : r.pricePerKg;
      if (!stateAverages[r.state]) {
        stateAverages[r.state] = { sum: 0, count: 0 };
      }
      stateAverages[r.state].sum += p;
      stateAverages[r.state].count += 1;
    });

    const statesList = Object.entries(stateAverages)
      .map(([state, data]) => ({ state, avg: Math.round(data.sum / data.count) }))
      .sort((a, b) => a.avg - b.avg);

    if (statesList.length >= 2) {
      const cheapest = statesList[0];
      const highest = statesList[statesList.length - 1];
      const diffPercent = Math.round(((highest.avg - cheapest.avg) / cheapest.avg) * 100);

      insights.push({
        title: `${primaryCommodity} Geographic Spread`,
        detail: `${primaryCommodity} is lowest in ${cheapest.state} (${formatNaira(cheapest.avg)}${unitLabel}) and highest in ${highest.state} (${formatNaira(highest.avg)}${unitLabel}), representing a ${diffPercent}% price variance across reporting states.`
      });
    } else if (statesList.length === 1) {
      insights.push({
        title: `${primaryCommodity} Benchmark`,
        detail: `Average price in ${statesList[0].state} is currently ${formatNaira(statesList[0].avg)}${unitLabel} across ${matching.length} field observations.`
      });
    }
  }

  // 2. Price spread or input stability
  const inputRecords = records.filter(r => r.valueChain === 'Input');
  if (inputRecords.length > 0 && records.length < 15) {
    // Input focused insight
    const sampleInput = inputRecords[0];
    insights.push({
      title: 'Farm-Input Price Monitoring',
      detail: `${sampleInput.product} (${sampleInput.brand || 'standard'}) recorded at ${formatNaira(sampleInput.rawPrice)} per ${sampleInput.packDescription} in ${sampleInput.state}.`
    });
  } else {
    // Commodity price variance
    const prices = records.map(r => (priceUnit === 'bag100' && r.valueChain === 'Commodity' ? r.pricePer100KgBag : r.displayPrice));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    const statesCount = new Set(records.map(r => r.state)).size;
    const lgasCount = new Set(records.map(r => `${r.state}-${r.lga}`)).size;

    insights.push({
      title: 'Market Arbitrage & Spread',
      detail: `Across ${lgasCount} LGAs in ${statesCount} states, monitored prices range from ${formatNaira(min)} to ${formatNaira(max)}, with an overall weighted average of ${formatNaira(avg)}.`
    });
  }

  // 3. Collection recency & field coverage
  const dates = records.map(r => r.collectionDate).sort();
  const latestDate = dates[dates.length - 1];
  const earliestDate = dates[0];

  const formattedLatest = new Date(latestDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const uniqueMarkets = new Set(records.map(r => r.market).filter(Boolean)).size;
  const marketText = uniqueMarkets > 0 ? `across ${uniqueMarkets} designated grain and produce markets` : 'across field enumerator locations';

  insights.push({
    title: 'Field Verification & Freshness',
    detail: `Latest field price surveys collected on ${formattedLatest} ${marketText}. Data points are confirmed by Extension Africa field officers.`
  });

  return insights.slice(0, 3);
}
