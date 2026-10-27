import React, { useState, useMemo } from 'react';
import { CleanRecord, PriceUnitOption } from '../data/types';
import { formatNaira } from '../data/clean';
import { Download, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface DataTableProps {
  records: CleanRecord[];
  priceUnit: PriceUnitOption;
}

type SortField = 'collectionDate' | 'state' | 'lga' | 'category' | 'product' | 'displayPrice';
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ records, priceUnit }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('collectionDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const isCommodityUnit = priceUnit === 'bag100';

  // Filter records by search text
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const query = search.toLowerCase();
    return records.filter(
      (r) =>
        r.product.toLowerCase().includes(query) ||
        r.state.toLowerCase().includes(query) ||
        r.lga.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        (r.market && r.market.toLowerCase().includes(query)) ||
        (r.brand && r.brand.toLowerCase().includes(query))
    );
  }, [records, search]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'displayPrice') {
        valA = a.valueChain === 'Commodity'
          ? (isCommodityUnit ? a.pricePer100KgBag : a.pricePerKg)
          : a.rawPrice;
        valB = b.valueChain === 'Commodity'
          ? (isCommodityUnit ? b.pricePer100KgBag : b.pricePerKg)
          : b.rawPrice;
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredRecords, sortField, sortOrder, isCommodityUnit]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, validCurrentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // CSV Export (strict privacy compliance: no personal details)
  const handleExportCsv = () => {
    const headers = [
      'Submission ID',
      'Date of Collection',
      'Zone',
      'State',
      'LGA',
      'Market',
      'Value Chain',
      'Category',
      'Product',
      'Brand',
      'Recorded Quantity',
      'Recorded Unit',
      'Recorded Price (NGN)',
      'Price Per Kg (NGN)',
      'Price Per 100Kg Bag (NGN)',
      'Price Basis',
      'Data Quality Status'
    ];

    const rows = sortedRecords.map((r) => [
      `"${r.submissionId}"`,
      `"${r.collectionDate}"`,
      `"${r.zone}"`,
      `"${r.state}"`,
      `"${r.lga}"`,
      `"${r.market || ''}"`,
      `"${r.valueChain}"`,
      `"${r.category}"`,
      `"${r.product}"`,
      `"${r.brand || ''}"`,
      r.rawQuantity,
      `"${r.rawUnit}"`,
      r.rawPrice,
      r.pricePerKg,
      r.pricePer100KgBag,
      `"${r.priceBasis}"`,
      `"${r.isSuspect ? 'Suspect' : 'Verified'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Extension_Africa_Market_Prices_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs my-5">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#206542]" />
            Price Records Data Table
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E8F0EC] text-[#206542]">
              {sortedRecords.length} records
            </span>
          </h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Individual market records collected by field officers with verified price calculations
          </p>
        </div>

        {/* Right: Search & CSV Export */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product, LGA, state..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#CBD5E1] focus:outline-none focus:border-[#206542] w-52 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sortedRecords.length === 0}
            className="px-3.5 py-1.5 rounded-md bg-[#206542] text-white hover:bg-[#15432C] disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            aria-label="Download CSV of filtered price data"
          >
            <Download className="w-3.5 h-3.5 text-[#B3C03E]" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F0EC] text-[#206542] uppercase text-[11px] font-bold border-b border-[#CBD5E1]">
            <tr>
              <th
                onClick={() => toggleSort('collectionDate')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#d9e6df] whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('state')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#d9e6df]"
              >
                <div className="flex items-center gap-1">
                  <span>State</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('lga')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#d9e6df]"
              >
                <div className="flex items-center gap-1">
                  <span>LGA / Market</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('category')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#d9e6df]"
              >
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('product')}
                className="py-2.5 px-3 cursor-pointer hover:bg-[#d9e6df]"
              >
                <div className="flex items-center gap-1">
                  <span>Product</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('displayPrice')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-[#d9e6df]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price ({isCommodityUnit ? '₦/100kg bag' : '₦/kg'})</span>
                  <ArrowUpDown className="w-3 h-3 text-[#206542]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">
                Pack / Recorded Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-black">
                  No prices match your search or active filters. Try resetting filters.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const effectivePrice = r.valueChain === 'Commodity'
                  ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
                  : r.rawPrice;

                return (
                  <tr key={r.id} className="hover:bg-[#F8FAF9] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#475569] whitespace-nowrap">
                      {r.collectionDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-black">
                      {r.state}
                    </td>
                    <td className="py-2.5 px-3 text-black">
                      <div className="font-medium">{r.lga}</div>
                      {r.market && (
                        <div className="text-[11px] text-[#64748B] truncate max-w-[150px]">
                          {r.market}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#475569]">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-black">{r.product}</div>
                      {r.brand && (
                        <div className="text-[11px] text-[#206542] font-semibold">
                          Brand: {r.brand}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-black whitespace-nowrap">
                      {r.valueChain === 'Commodity'
                        ? formatNaira(effectivePrice)
                        : formatNaira(r.rawPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#475569] whitespace-nowrap">
                      <div className="font-medium">{r.packDescription}</div>
                      <div className="text-[10px] text-[#64748B]">
                        (as {formatNaira(r.rawPrice)} total)
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 mt-1 text-xs text-[#475569]">
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-[#CBD5E1] rounded bg-white font-semibold text-black"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            records per page · Page {validCurrentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className="p-1.5 rounded border border-[#CBD5E1] hover:bg-[#E8F0EC] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-black">{validCurrentPage}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="p-1.5 rounded border border-[#CBD5E1] hover:bg-[#E8F0EC] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
