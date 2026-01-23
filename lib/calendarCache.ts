/**
 * Calendar Data Cache Utility
 * Provides localStorage caching for calendar data to improve performance
 */

import { CalendarData } from "@/lib/type";

const CACHE_PREFIX = "calendar_cache_";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedData {
	data: CalendarData;
	timestamp: number;
	month: string;
	year: string;
	multiplier: number;
}

export class CalendarCache {
	/**
	 * Generate cache key from parameters
	 */
	private static getCacheKey(
		month: string,
		year: string,
		multiplier: number,
	): string {
		return `${CACHE_PREFIX}${year}_${month}_${multiplier}`;
	}

	/**
	 * Get cached data if valid
	 */
	static get(
		month: string,
		year: string,
		multiplier: number,
	): CalendarData | null {
		try {
			const key = this.getCacheKey(month, year, multiplier);
			const cached = localStorage.getItem(key);

			if (!cached) return null;

			const parsedCache: CachedData = JSON.parse(cached);
			const now = Date.now();

			// Check if cache is still valid
			if (now - parsedCache.timestamp > CACHE_DURATION) {
				// Cache expired, remove it
				localStorage.removeItem(key);
				return null;
			}

			// Verify cache matches requested parameters
			if (
				parsedCache.month === month &&
				parsedCache.year === year &&
				parsedCache.multiplier === multiplier
			) {
				return parsedCache.data;
			}

			return null;
		} catch (error) {
			console.error("Error reading from calendar cache:", error);
			return null;
		}
	}

	/**
	 * Save data to cache
	 */
	static set(
		month: string,
		year: string,
		multiplier: number,
		data: CalendarData,
	): void {
		try {
			const key = this.getCacheKey(month, year, multiplier);
			const cacheData: CachedData = {
				data,
				timestamp: Date.now(),
				month,
				year,
				multiplier,
			};

			localStorage.setItem(key, JSON.stringify(cacheData));
		} catch (error) {
			console.error("Error writing to calendar cache:", error);
			// If localStorage is full, clear old cache entries
			this.clearOldEntries();
		}
	}

	/**
	 * Clear cache for specific month
	 */
	static clear(month: string, year: string, multiplier: number): void {
		try {
			const key = this.getCacheKey(month, year, multiplier);
			localStorage.removeItem(key);
		} catch (error) {
			console.error("Error clearing calendar cache:", error);
		}
	}

	/**
	 * Clear all calendar cache entries
	 */
	static clearAll(): void {
		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith(CACHE_PREFIX)) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.error("Error clearing all calendar cache:", error);
		}
	}

	/**
	 * Clear old/expired cache entries
	 */
	static clearOldEntries(): void {
		try {
			const keys = Object.keys(localStorage);
			const now = Date.now();

			keys.forEach((key) => {
				if (key.startsWith(CACHE_PREFIX)) {
					try {
						const cached = localStorage.getItem(key);
						if (cached) {
							const parsedCache: CachedData = JSON.parse(cached);
							if (now - parsedCache.timestamp > CACHE_DURATION) {
								localStorage.removeItem(key);
							}
						}
					} catch {
						// If parsing fails, remove the entry
						localStorage.removeItem(key);
					}
				}
			});
		} catch (error) {
			console.error("Error clearing old calendar cache entries:", error);
		}
	}

	/**
	 * Get cache statistics
	 */
	static getStats(): {
		totalEntries: number;
		totalSize: number;
		oldestEntry: number | null;
	} {
		try {
			const keys = Object.keys(localStorage);
			const calendarKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
			let totalSize = 0;
			let oldestTimestamp: number | null = null;

			calendarKeys.forEach((key) => {
				const item = localStorage.getItem(key);
				if (item) {
					totalSize += item.length;
					try {
						const parsed: CachedData = JSON.parse(item);
						if (!oldestTimestamp || parsed.timestamp < oldestTimestamp) {
							oldestTimestamp = parsed.timestamp;
						}
					} catch {
						// Ignore parsing errors
					}
				}
			});

			return {
				totalEntries: calendarKeys.length,
				totalSize,
				oldestEntry: oldestTimestamp,
			};
		} catch (error) {
			console.error("Error getting calendar cache stats:", error);
			return {
				totalEntries: 0,
				totalSize: 0,
				oldestEntry: null,
			};
		}
	}
}
