import React, { useState } from 'react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { FilterState, CleanRecord } from '../data/types';
import { RotateCcw, Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  allRecords: CleanRecord[];
  activeFilterCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  allRecords,
  activeFilterCount
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Compute cascading options dynamically from available records
  // 1. Zones present in all data
  const availableZones = Array.from(new Set(allRecords.map(r => r.zone).filter(Boolean))).sort();

  // 2. States filtered by active zones if any
  const statesPool = filters.zones.length > 0
    ? allRecords.filter(r => filters.zones.includes(r.zone))
    : allRecords;
  const availableStates = Array.from(new Set(statesPool.map(r => r.state).filter(Boolean))).sort();

  // 3. LGAs filtered by active states / zones
  const lgaPool = filters.states.length > 0
    ? statesPool.filter(r => filters.states.includes(r.state))
    : statesPool;
  const availableLgas = Array.from(new Set(lgaPool.map(r => r.lga).filter(Boolean))).sort();

  // 4. Markets (show only if at least one record has a non-empty market value)
  const allMarketsWithValues = allRecords.map(r => r.market).filter(m => Boolean(m && m.trim().length > 0));
  const hasMarkets = allMarketsWithValues.length > 0;
  const marketPool = filters.lgas.length > 0
    ? lgaPool.filter(r => filters.lgas.includes(r.lga))
    : lgaPool;
  const availableMarkets = Array.from(
    new Set(marketPool.map(r => r.market).filter(m => Boolean(m && m.trim().length > 0)))
  ).sort();

  // 5. Value chains
  const availableValueChains = Array.from(new Set(allRecords.map(r => r.valueChain))).sort();

  // 6. Categories filtered by value chain
  const categoryPool = filters.valueChain !== 'all'
    ? allRecords.filter(r => r.valueChain === filters.valueChain)
    : allRecords;
  const availableCategories = Array.from(new Set(categoryPool.map(r => r.category).filter(Boolean))).sort();

  // 7. Products filtered by category & value chain
  const productPool = filters.categories.length > 0
    ? categoryPool.filter(r => filters.categories.includes(r.category))
    : categoryPool;
  const availableProducts = Array.from(new Set(productPool.map(r => r.product).filter(Boolean))).sort();

  // 8. Brands (fully data-driven: appear whenever matching records contain brand names)
  const availableBrands = Array.from(
    new Set(
      productPool
        .map(r => r.brand)
        .filter(b => Boolean(b && b.trim().length > 0))
    )
  ).sort();
  const showBrandFilter = availableBrands.length > 0;

  // Latest collection date from records
  const latestDateStr = allRecords.length > 0
    ? [...allRecords].map(r => r.collectionDate).sort().reverse()[0]
    : '';

  const seasonLabel = latestDateStr
    ? `This Season (${new Date(latestDateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})`
    : 'This Season';

  // Quick Date Range Buttons
  const dateRanges = [
    { id: 'all', label: 'All Dates' },
    { id: 'last7', label: 'Last 7 Days' },
    { id: 'last30', label: 'Last 30 Days' },
    { id: 'thisSeason', label: seasonLabel },
  ] as const;

  const removeChip = (type: keyof FilterState, value?: string) => {
    if (type === 'valueChain') {
      onChange({ ...filters, valueChain: 'all' });
    } else if (type === 'dateRange') {
      onChange({ ...filters, dateRange: 'all' });
    } else if (Array.isArray(filters[type]) && value) {
      const arr = filters[type] as string[];
      onChange({ ...filters, [type]: arr.filter(v => v !== value) });
    }
  };

  return (
    <div className="bg-white border-b border-[#CBD5E1] shadow-sm sticky top-[68px] sm:top-[76px] z-30 transition-all">
      {/* Mobile Bar Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#E8F0EC] text-[#206542] font-bold text-xs border border-[#206542]"
            aria-expanded={mobileDrawerOpen}
          >
            <Filter className="w-4 h-4 text-[#206542]" />
            <span>Filters ({activeFilterCount})</span>
            {mobileDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Mobile Price Unit Toggle */}
          <div className="flex items-center border border-[#CBD5E1] rounded-md overflow-hidden text-xs font-bold">
            <button
              type="button"
              onClick={() => onChange({ ...filters, priceUnit: 'kg' })}
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                filters.priceUnit === 'kg'
                  ? 'bg-[#B3C03E] text-black'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Per Kg
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filters, priceUnit: 'bag100' })}
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                filters.priceUnit === 'bag100'
                  ? 'bg-[#B3C03E] text-black'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Per 100kg Bag
            </button>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 text-xs font-semibold text-black hover:text-[#206542]"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls (visible on desktop or when mobile drawer open) */}
        <div className={`${mobileDrawerOpen ? 'block' : 'hidden'} lg:block pt-2 lg:pt-0`}>
          {/* Top Row: Date range & Value Chain & Price Unit toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            {/* Date Range quick buttons */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-[#206542]" />
                Date:
              </span>
              {dateRanges.map((r) => {
                const isActive = filters.dateRange === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onChange({ ...filters, dateRange: r.id })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer min-h-[32px] ${
                      isActive
                        ? 'bg-[#206542] text-white'
                        : 'bg-gray-100 text-black hover:bg-[#E8F0EC]'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Right side of top row: Value Chain & Unit Toggle */}
            <div className="flex items-center flex-wrap gap-3">
              {/* Value Chain selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] mr-1">
                  Chain:
                </span>
                <div className="flex rounded-md border border-[#CBD5E1] overflow-hidden text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, valueChain: 'all', categories: [], products: [] })}
                    className={`px-2.5 py-1 transition-colors cursor-pointer min-h-[32px] ${
                      filters.valueChain === 'all'
                        ? 'bg-[#206542] text-white'
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  {availableValueChains.map(vc => (
                    <button
                      key={vc}
                      type="button"
                      onClick={() => onChange({ ...filters, valueChain: vc as any, categories: [], products: [] })}
                      className={`px-2.5 py-1 transition-colors border-l border-[#CBD5E1] cursor-pointer min-h-[32px] ${
                        filters.valueChain === vc
                          ? 'bg-[#206542] text-white'
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      {vc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Unit Toggle (Desktop) */}
              <div className="hidden lg:flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] mr-1">
                  Price per:
                </span>
                <div className="flex rounded-md border border-[#CBD5E1] overflow-hidden text-xs font-bold shadow-xs">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, priceUnit: 'kg' })}
                    className={`px-3 py-1 transition-colors cursor-pointer min-h-[32px] ${
                      filters.priceUnit === 'kg'
                        ? 'bg-[#B3C03E] text-black font-extrabold'
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, priceUnit: 'bag100' })}
                    className={`px-3 py-1 transition-colors border-l border-[#CBD5E1] cursor-pointer min-h-[32px] ${
                      filters.priceUnit === 'bag100'
                        ? 'bg-[#B3C03E] text-black font-extrabold'
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    100 kg bag
                  </button>
                </div>
              </div>

              {/* Reset button */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="hidden lg:flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#206542] hover:bg-[#E8F0EC] rounded transition-colors cursor-pointer border border-[#206542]"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Cascading Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2.5 pt-3">
            {/* 1. Zone */}
            <div className="flex-1 min-w-[130px]">
              <MultiSelectDropdown
                label="Zone"
                placeholder="All Zones"
                options={availableZones}
                selected={filters.zones}
                onChange={(zones) => onChange({ ...filters, zones, states: [], lgas: [] })}
              />
            </div>

            {/* 2. State */}
            <div className="flex-1 min-w-[130px]">
              <MultiSelectDropdown
                label="State"
                placeholder="All States"
                options={availableStates}
                selected={filters.states}
                onChange={(states) => onChange({ ...filters, states, lgas: [] })}
              />
            </div>

            {/* 3. LGA */}
            <div className="flex-1 min-w-[130px]">
              <MultiSelectDropdown
                label="LGA"
                placeholder="All LGAs"
                options={availableLgas}
                selected={filters.lgas}
                onChange={(lgas) => onChange({ ...filters, lgas })}
              />
            </div>

            {/* 4. Market (conditional) */}
            {hasMarkets && (
              <div className="flex-1 min-w-[140px]">
                <MultiSelectDropdown
                  label="Market"
                  placeholder="All Markets"
                  options={availableMarkets}
                  selected={filters.markets}
                  onChange={(markets) => onChange({ ...filters, markets })}
                />
              </div>
            )}

            {/* 5. Category */}
            <div className="flex-1 min-w-[140px]">
              <MultiSelectDropdown
                label="Category"
                placeholder="All Categories"
                options={availableCategories}
                selected={filters.categories}
                onChange={(categories) => onChange({ ...filters, categories, products: [] })}
              />
            </div>

            {/* 6. Product */}
            <div className="flex-1 min-w-[150px]">
              <MultiSelectDropdown
                label="Product"
                placeholder="All Products"
                options={availableProducts}
                selected={filters.products}
                onChange={(products) => onChange({ ...filters, products })}
              />
            </div>

            {/* 7. Brand (Input only) */}
            {showBrandFilter && availableBrands.length > 0 && (
              <div className="flex-1 min-w-[130px]">
                <MultiSelectDropdown
                  label="Brand"
                  placeholder="All Brands"
                  options={availableBrands}
                  selected={filters.brands}
                  onChange={(brands) => onChange({ ...filters, brands })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#475569] uppercase mr-1">
              Active Filters:
            </span>

            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                Date: {dateRanges.find(d => d.id === filters.dateRange)?.label}
                <button
                  type="button"
                  onClick={() => removeChip('dateRange')}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.valueChain !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                Chain: {filters.valueChain}
                <button
                  type="button"
                  onClick={() => removeChip('valueChain')}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.zones.map(z => (
              <span key={z} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                Zone: {z}
                <button
                  type="button"
                  onClick={() => removeChip('zones', z)}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.states.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                State: {s}
                <button
                  type="button"
                  onClick={() => removeChip('states', s)}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.lgas.map(l => (
              <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                LGA: {l}
                <button
                  type="button"
                  onClick={() => removeChip('lgas', l)}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.markets.map(m => (
              <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#206542] border border-[#206542]">
                Market: {m}
                <button
                  type="button"
                  onClick={() => removeChip('markets', m)}
                  className="hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.categories.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F3F6D9] text-black border border-[#B3C03E]">
                Category: {c}
                <button
                  type="button"
                  onClick={() => removeChip('categories', c)}
                  className="hover:text-[#206542]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.products.map(p => (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#F3F6D9] text-black border border-[#B3C03E]">
                Product: {p}
                <button
                  type="button"
                  onClick={() => removeChip('products', p)}
                  className="hover:text-[#206542]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.brands.map(b => (
              <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F3F6D9] text-black border border-[#B3C03E]">
                Brand: {b}
                <button
                  type="button"
                  onClick={() => removeChip('brands', b)}
                  className="hover:text-[#206542]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-[#206542] hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
