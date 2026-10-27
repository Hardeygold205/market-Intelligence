/**
 * Data fetcher and local cache manager
 * Extension Africa Market Price Intelligence
 *
 * Connects directly to live Google Apps Script proxy endpoint
 * with a plain GET and no custom headers.
 */
import { CONFIG } from '../config';
import { CleanRecord, DataPayload, RawProxyRecord } from './types';
import { cleanRawRecords } from './clean';

interface FetchResult {
  data: DataPayload;
  error?: string;
}

export async function fetchMarketData(): Promise<FetchResult> {
  const dataUrl = CONFIG.DATA_URL.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for mobile connections

    // Plain GET request with no custom headers (allows Google Apps Script 302 redirect without CORS preflight failures)
    const response = await fetch(dataUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const rawList: RawProxyRecord[] = Array.isArray(json.records) ? json.records : [];
    const generatedAt = json.generatedAt || new Date().toISOString();

    const cleaned = cleanRawRecords(rawList);
    const valid = cleaned.filter(r => !r.isSuspect);

    const payload: DataPayload = {
      records: valid,
      allRecords: cleaned,
      generatedAt,
      isDemo: false,
      lastUpdated: new Date(generatedAt)
    };

    // Cache the good response in localStorage
    try {
      localStorage.setItem(
        CONFIG.LOCAL_STORAGE_CACHE_KEY,
        JSON.stringify({
          rawRecords: rawList,
          generatedAt,
          cachedAt: new Date().toISOString()
        })
      );
    } catch {
      // ignore storage quota error
    }

    return { data: payload };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Network error';

    // Fallback to localStorage cache
    try {
      const cachedStr = localStorage.getItem(CONFIG.LOCAL_STORAGE_CACHE_KEY);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed?.rawRecords) && parsed.rawRecords.length > 0) {
          const cachedCleaned = cleanRawRecords(parsed.rawRecords);
          const cachedValid = cachedCleaned.filter(r => !r.isSuspect);
          const genDate = new Date(parsed.generatedAt || parsed.cachedAt || Date.now());
          const timeStr = genDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            data: {
              records: cachedValid,
              allRecords: cachedCleaned,
              generatedAt: parsed.generatedAt || new Date().toISOString(),
              isDemo: false,
              lastUpdated: genDate
            },
            error: `Could not refresh. Showing data from ${timeStr}`
          };
        }
      }
    } catch {
      // ignore cache read error
    }

    // No cache available
    return {
      data: {
        records: [],
        allRecords: [],
        generatedAt: new Date().toISOString(),
        isDemo: false,
        lastUpdated: new Date()
      },
      error: `Could not refresh (${errMsg}). Please check connection and try again.`
    };
  }
}
