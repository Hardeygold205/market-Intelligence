import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CleanRecord, PriceUnitOption } from '../data/types';
import { formatNaira } from '../data/clean';
import { MapPin, Navigation } from 'lucide-react';

interface MapSectionProps {
  records: CleanRecord[];
  priceUnit: PriceUnitOption;
  onFilterByLga: (lga: string, state: string) => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
  records,
  priceUnit,
  onFilterByLga
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const isCommodityUnit = priceUnit === 'bag100';
  const unitSuffix = isCommodityUnit ? ' (₦/100kg bag)' : ' (₦/kg)';

  // Group records by unique LGA location
  interface LocationCluster {
    key: string;
    lga: string;
    state: string;
    lat: number;
    lng: number;
    count: number;
    sumPrice: number;
    avgPrice: number;
    products: Set<string>;
    latestDate: string;
  }

  const clusters: Record<string, LocationCluster> = {};
  records.forEach((r) => {
    if (r.lat && r.lng && !isNaN(r.lat) && !isNaN(r.lng)) {
      const key = `${r.state}-${r.lga}`;
      const val = r.valueChain === 'Commodity'
        ? (isCommodityUnit ? r.pricePer100KgBag : r.pricePerKg)
        : r.rawPrice;

      if (!clusters[key]) {
        clusters[key] = {
          key,
          lga: r.lga,
          state: r.state,
          lat: r.lat,
          lng: r.lng,
          count: 1,
          sumPrice: val,
          avgPrice: val,
          products: new Set([r.product]),
          latestDate: r.collectionDate
        };
      } else {
        const c = clusters[key];
        c.count += 1;
        c.sumPrice += val;
        c.avgPrice = Math.round(c.sumPrice / c.count);
        c.products.add(r.product);
        if (r.collectionDate > c.latestDate) {
          c.latestDate = r.collectionDate;
        }
      }
    }
  });

  const clusterList = Object.values(clusters);
  const minAvg = clusterList.length > 0 ? Math.min(...clusterList.map((c) => c.avgPrice)) : 0;
  const maxAvg = clusterList.length > 0 ? Math.max(...clusterList.map((c) => c.avgPrice)) : 1;

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [9.082, 8.6753], // Center of Nigeria
        zoom: 6,
        minZoom: 5,
        maxZoom: 13,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when records or clusters change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    if (clusterList.length === 0) return;

    const bounds = L.latLngBounds([]);

    clusterList.forEach((cluster) => {
      // Radius sized by record count: between 9 and 24
      const radius = Math.min(24, Math.max(9, cluster.count * 2.2));

      // Shaded by average price: higher price = brighter Olive, benchmark = deep Forest
      const ratio = maxAvg > minAvg ? (cluster.avgPrice - minAvg) / (maxAvg - minAvg) : 0.5;
      const fillColor = ratio > 0.65 ? '#B3C03E' : '#206542';
      const strokeColor = ratio > 0.65 ? '#757F26' : '#15432C';

      const circle = L.circleMarker([cluster.lat, cluster.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      });

      // Tooltip HTML content
      const productsArr = Array.from(cluster.products);
      const productsStr = productsArr.length > 3
        ? `${productsArr.slice(0, 3).join(', ')} +${productsArr.length - 3} more`
        : productsArr.join(', ');

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #000; min-width: 180px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #206542; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px; margin-bottom: 6px;">
            ${cluster.lga}, ${cluster.state}
          </div>
          <div style="margin-bottom: 3px;">
            <span style="color: #64748B;">Average Price:</span> 
            <strong style="color: #000000; font-size: 13px;">${formatNaira(cluster.avgPrice)}</strong>
          </div>
          <div style="margin-bottom: 3px;">
            <span style="color: #64748B;">Records:</span> 
            <strong>${cluster.count} field observations</strong>
          </div>
          <div style="margin-bottom: 3px;">
            <span style="color: #64748B;">Products:</span> 
            <span>${productsStr}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #64748B;">Last Survey:</span> 
            <span>${cluster.latestDate}</span>
          </div>
          <button
            id="btn-filter-${cluster.key.replace(/[^a-zA-Z0-9]/g, '-')}"
            style="width: 100%; background-color: #206542; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 5px 8px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Filter by this LGA
          </button>
        </div>
      `;

      circle.bindPopup(popupHtml);

      circle.on('popupopen', () => {
        const btnId = `btn-filter-${cluster.key.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = () => {
            onFilterByLga(cluster.lga, cluster.state);
            circle.closePopup();
          };
        }
      });

      circle.on('click', () => {
        circle.openPopup();
      });

      markersLayerRef.current?.addLayer(circle);
      bounds.extend([cluster.lat, cluster.lng]);
    });

    // Fit bounds if valid
    if (bounds.isValid() && clusterList.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [clusterList.length, isCommodityUnit, maxAvg, minAvg]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([9.082, 8.6753], 6);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 sm:p-5 shadow-xs my-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#206542]" />
            Geographic Market Map (Nigeria)
            <span className="text-xs font-normal text-[#475569]">{unitSuffix}</span>
          </h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Circle size corresponds to record count; color indicates relative price level. Click a marker to inspect details or filter.
          </p>
        </div>

        {/* Map Actions & Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold bg-[#E8F0EC] px-3 py-1.5 rounded-md border border-[#206542]/30">
            <span className="inline-flex items-center gap-1 text-[#206542]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#206542]" /> Baseline / Lower
            </span>
            <span className="inline-flex items-center gap-1 text-black">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B3C03E]" /> Higher Price
            </span>
          </div>

          <button
            type="button"
            onClick={resetView}
            className="p-1.5 text-xs font-bold text-[#206542] hover:bg-[#E8F0EC] rounded border border-[#CBD5E1] flex items-center gap-1 cursor-pointer"
            title="Reset to whole country view"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-96 rounded-md overflow-hidden border border-[#CBD5E1] z-10"
        aria-label="Map of Nigeria showing surveyed commodity and input prices"
      />
    </div>
  );
};
