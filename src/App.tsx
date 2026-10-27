/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Market Price Intelligence Dashboard
 * Extension Africa
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CONFIG } from './config';
import { CleanRecord, FilterState, PriceUnitOption } from './data/types';
import { fetchMarketData } from './data/fetchData';
import { generateInsights } from './data/insights';

import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { PriceGlanceRow } from './components/PriceGlanceRow';
import { CompareRow } from './components/CompareRow';
import { MapSection } from './components/MapSection';
import { InsightsCard } from './components/InsightsCard';
import { DataTable } from './components/DataTable';
import { DataQualityPanel } from './components/DataQualityPanel';
import { Footer } from './components/Footer';
import { TourGuideModal } from './components/TourGuideModal';

import { AlertCircle, RotateCcw } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = CONFIG.AUTO_REFRESH_MINUTES * 60;

// Read initial filters from URL query parameters
function getInitialFiltersFromUrl(): FilterState {
  if (typeof window === 'undefined') {
    return {
      dateRange: 'all',
      zones: [],
      states: [],
      lgas: [],
      markets: [],
      valueChain: 'all',
      categories: [],
      products: [],
      brands: [],
      priceUnit: 'kg',
      includeFlagged: false,
      searchQuery: ''
    };
  }

  const params = new URLSearchParams(window.location.search);
  const parseList = (key: string) => {
    const val = params.get(key);
    return val ? val.split(',').map((s) => decodeURIComponent(s.trim())).filter(Boolean) : [];
  };

  const dateParam = params.get('dateRange');
  const chainParam = params.get('valueChain');
  const unitParam = params.get('unit');

  return {
    dateRange: (dateParam === 'last7' || dateParam === 'last30' || dateParam === 'thisSeason') ? dateParam : 'all',
    zones: parseList('zones'),
    states: parseList('states'),
    lgas: parseList('lgas'),
    markets: parseList('markets'),
    valueChain: (chainParam === 'Commodity' || chainParam === 'Input') ? chainParam : 'all',
    categories: parseList('categories'),
    products: parseList('products'),
    brands: parseList('brands'),
    priceUnit: unitParam === 'bag100' ? 'bag100' : 'kg',
    includeFlagged: params.get('includeFlagged') === 'true',
    searchQuery: params.get('q') || ''
  };
}

export default function App() {
  // Data states
  const [allRecords, setAllRecords] = useState<CleanRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [errorNotice, setErrorNotice] = useState<string | undefined>(undefined);
  const [newRecordsNotice, setNewRecordsNotice] = useState<string | null>(null);

  // Track previous count to notify user when new records arrive
  const prevCountRef = React.useRef<number | null>(null);

  // Auto-refresh countdown (in seconds)
  const [nextRefreshSeconds, setNextRefreshSeconds] = useState<number>(REFRESH_INTERVAL_SECONDS);

  // Slicer Filter State
  const [filters, setFilters] = useState<FilterState>(getInitialFiltersFromUrl);

  // Tour guide modal state
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Check if first-time user for tour guide
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(CONFIG.LOCAL_STORAGE_TOUR_KEY);
      if (!dismissed) {
        setIsTourOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync active filters to URL query string
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
      if (filters.zones.length > 0) params.set('zones', filters.zones.map(encodeURIComponent).join(','));
      if (filters.states.length > 0) params.set('states', filters.states.map(encodeURIComponent).join(','));
      if (filters.lgas.length > 0) params.set('lgas', filters.lgas.map(encodeURIComponent).join(','));
      if (filters.markets.length > 0) params.set('markets', filters.markets.map(encodeURIComponent).join(','));
      if (filters.valueChain !== 'all') params.set('valueChain', filters.valueChain);
      if (filters.categories.length > 0) params.set('categories', filters.categories.map(encodeURIComponent).join(','));
      if (filters.products.length > 0) params.set('products', filters.products.map(encodeURIComponent).join(','));
      if (filters.brands.length > 0) params.set('brands', filters.brands.map(encodeURIComponent).join(','));
      if (filters.priceUnit !== 'kg') params.set('unit', filters.priceUnit);
      if (filters.includeFlagged) params.set('includeFlagged', 'true');

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // ignore
    }
  }, [filters]);

  // Load data function
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setIsRefreshing(true);
    }
    setErrorNotice(undefined);

    const result = await fetchMarketData();
    const newRecords = result.data.allRecords;

    // Check if new records arrived compared to previous count
    if (prevCountRef.current !== null && newRecords.length > prevCountRef.current) {
      const diff = newRecords.length - prevCountRef.current;
      setNewRecordsNotice(`${diff} new price record${diff > 1 ? 's' : ''} added`);
      setTimeout(() => setNewRecordsNotice(null), 4000);
    }
    prevCountRef.current = newRecords.length;

    setAllRecords(newRecords);
    setLastUpdated(result.data.lastUpdated);

    // Keep user's selected filters, but drop any value that no longer exists in the data quietly
    if (newRecords.length > 0) {
      const validZones = new Set(newRecords.map(r => r.zone).filter(Boolean));
      const validStates = new Set(newRecords.map(r => r.state).filter(Boolean));
      const validLgas = new Set(newRecords.map(r => r.lga).filter(Boolean));
      const validMarkets = new Set(newRecords.map(r => r.market).filter(Boolean));
      const validValueChains = new Set(newRecords.map(r => r.valueChain).filter(Boolean));
      const validCategories = new Set(newRecords.map(r => r.category).filter(Boolean));
      const validProducts = new Set(newRecords.map(r => r.product).filter(Boolean));
      const validBrands = new Set(newRecords.map(r => r.brand).filter(Boolean));

      setFilters((prev) => ({
        ...prev,
        zones: prev.zones.filter(z => validZones.has(z)),
        states: prev.states.filter(s => validStates.has(s)),
        lgas: prev.lgas.filter(l => validLgas.has(l)),
        markets: prev.markets.filter(m => validMarkets.has(m)),
        valueChain: prev.valueChain !== 'all' && !validValueChains.has(prev.valueChain) ? 'all' : prev.valueChain,
        categories: prev.categories.filter(c => validCategories.has(c)),
        products: prev.products.filter(p => validProducts.has(p)),
        brands: prev.brands.filter(b => validBrands.has(b)),
      }));
    }

    if (result.error) {
      setErrorNotice(result.error);
    }

    setIsLoading(false);
    setIsRefreshing(false);
    setNextRefreshSeconds(REFRESH_INTERVAL_SECONDS);

    // Show "Updated just now" feedback badge for 3 seconds
    setRecentlyUpdated(true);
    setTimeout(() => {
      setRecentlyUpdated(false);
    }, 3000);
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-refresh countdown & interval timer (pauses when document is hidden)
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const tick = () => {
      // Check if page is visible
      if (document.hidden) {
        return; // Pause countdown while tab is backgrounded
      }

      setNextRefreshSeconds((prev) => {
        if (prev <= 1) {
          loadData(true);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    };

    timerId = setInterval(tick, 1000);

    // Trigger immediate refresh when user switches back to this tab if expired
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible again
        loadData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      zones: [],
      states: [],
      lgas: [],
      markets: [],
      valueChain: 'all',
      categories: [],
      products: [],
      brands: [],
      priceUnit: 'kg',
      includeFlagged: false,
      searchQuery: ''
    });
  }, []);

  // Calculate active filter count for the UI badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.valueChain !== 'all') count++;
    count += filters.zones.length;
    count += filters.states.length;
    count += filters.lgas.length;
    count += filters.markets.length;
    count += filters.categories.length;
    count += filters.products.length;
    count += filters.brands.length;
    if (filters.includeFlagged) count++;
    return count;
  }, [filters]);

  // Maximum collection date in dataset so "To" date defaults to latest data date
  const maxCollectionDate = useMemo(() => {
    if (allRecords.length === 0) return '';
    return [...allRecords].map(r => r.collectionDate).sort().reverse()[0] || '';
  }, [allRecords]);

  // Apply slicer filters to the records dataset
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      // Exclude suspect records unless includeFlagged is active
      if (record.isSuspect && !filters.includeFlagged) {
        return false;
      }

      // 1. Date Range: "To" date defaults to latest collection date in the records
      if (filters.dateRange !== 'all' && maxCollectionDate) {
        const toTime = new Date(`${maxCollectionDate}T23:59:59Z`).getTime();
        const recordTime = new Date(`${record.collectionDate}T00:00:00Z`).getTime();
        const dayMs = 24 * 60 * 60 * 1000;

        if (filters.dateRange === 'last7' && (toTime - recordTime > 7 * dayMs || recordTime > toTime)) {
          return false;
        }
        if (filters.dateRange === 'last30' && (toTime - recordTime > 30 * dayMs || recordTime > toTime)) {
          return false;
        }
        if (filters.dateRange === 'thisSeason') {
          // Latest season: matching year and month of the latest survey date
          const seasonYearMonth = maxCollectionDate.slice(0, 7);
          if (!record.collectionDate.startsWith(seasonYearMonth)) {
            return false;
          }
        }
      }

      // 2. Zone
      if (filters.zones.length > 0 && !filters.zones.includes(record.zone)) {
        return false;
      }

      // 3. State
      if (filters.states.length > 0 && !filters.states.includes(record.state)) {
        return false;
      }

      // 4. LGA
      if (filters.lgas.length > 0 && !filters.lgas.includes(record.lga)) {
        return false;
      }

      // 5. Market
      if (filters.markets.length > 0 && !filters.markets.includes(record.market)) {
        return false;
      }

      // 6. Value Chain
      if (filters.valueChain !== 'all' && record.valueChain !== filters.valueChain) {
        return false;
      }

      // 7. Category
      if (filters.categories.length > 0 && !filters.categories.includes(record.category)) {
        return false;
      }

      // 8. Product
      if (filters.products.length > 0 && !filters.products.includes(record.product)) {
        return false;
      }

      // 9. Brand
      if (filters.brands.length > 0 && !filters.brands.includes(record.brand)) {
        return false;
      }

      return true;
    });
  }, [allRecords, filters]);

  // Suspect records for the Data Quality Panel
  const suspectRecords = useMemo(() => {
    return allRecords.filter((r) => r.isSuspect);
  }, [allRecords]);

  // Insights computed by rules
  const insights = useMemo(() => {
    return generateInsights(filteredRecords, filters.priceUnit);
  }, [filteredRecords, filters.priceUnit]);

  // Handler for Map marker click (filters by clicked LGA)
  const handleMapFilter = useCallback((lga: string, state: string) => {
    setFilters((prev) => ({
      ...prev,
      states: [state],
      lgas: [lga]
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-black flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        lastUpdated={lastUpdated}
        nextRefreshSeconds={nextRefreshSeconds}
        isRefreshing={isRefreshing}
        recentlyUpdated={recentlyUpdated}
        onRefresh={() => loadData(false)}
        onOpenTour={() => setIsTourOpen(true)}
        errorNotice={errorNotice}
        newRecordsNotice={newRecordsNotice}
      />

      {/* 2. Sticky Cascading Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        allRecords={allRecords}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {isLoading ? (
          // Skeleton Loader while initial fetch completes
          <div className="space-y-6 animate-pulse py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 bg-[#E8F0EC]/60 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-80 bg-gray-100 rounded-lg" />
              <div className="h-80 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg" />
          </div>
        ) : allRecords.length === 0 ? (
          // Friendly Empty State when records array is empty
          <div className="bg-[#F8FAF9] border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 sm:p-12 text-center my-8 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#E8F0EC] text-[#206542] flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-[#206542]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-black">
              No price records currently available
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
              No price data could be loaded from the live KoboCollect feed at this moment.
              The system will automatically retry syncing momentarily.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => loadData(false)}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-md bg-[#206542] text-white hover:bg-[#15432C] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Fetching live data...' : 'Check now'}</span>
              </button>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          // Friendly Empty State when filters return nothing
          <div className="bg-[#F8FAF9] border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 sm:p-12 text-center my-8 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#E8F0EC] text-[#206542] flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-[#206542]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-black">
              No prices match these filters
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
              No field records match your current combination of zone, state, LGA, and product.
              Try clearing one or more active filters to view available market intelligence.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-md bg-[#206542] text-white hover:bg-[#15432C] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3. KPI Cards */}
            <KpiCards records={filteredRecords} priceUnit={filters.priceUnit} />

            {/* 4. Price at a Glance Row */}
            <PriceGlanceRow records={filteredRecords} priceUnit={filters.priceUnit} />

            {/* 5. Compare Products and Places Row */}
            <CompareRow records={filteredRecords} priceUnit={filters.priceUnit} />

            {/* 6. Nigeria Map */}
            <MapSection
              records={filteredRecords}
              priceUnit={filters.priceUnit}
              onFilterByLga={handleMapFilter}
            />

            {/* 7. "What This Means" Analytical Insights */}
            <InsightsCard insights={insights} />

            {/* 8. Price Records Data Table & CSV Export */}
            <DataTable records={filteredRecords} priceUnit={filters.priceUnit} />

            {/* 9. Data Quality Panel (collapsible, showing outliers like ₦7 insecticide) */}
            <DataQualityPanel
              suspectRecords={suspectRecords}
              includeFlagged={filters.includeFlagged}
              onToggleIncludeFlagged={(include) =>
                setFilters((prev) => ({ ...prev, includeFlagged: include }))
              }
            />
          </>
        )}
      </main>

      {/* 10. Footer */}
      <Footer />

      {/* Tour Guide Modal */}
      <TourGuideModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}
