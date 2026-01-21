/**
 * Sync Manager for Offline Transactions
 * Handles syncing offline transactions to the server when online
 */

import { offlineStorage, OfflineTransaction } from "./offlineStorage";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
	success: number;
	failed: number;
	total: number;
	errors: Array<{ id: string; error: string }>;
}

class SyncManager {
	private isSyncing = false;
	private syncListeners: Array<
		(status: SyncStatus, result?: SyncResult) => void
	> = [];

	/**
	 * Register a listener for sync status changes
	 */
	onSyncStatusChange(
		callback: (status: SyncStatus, result?: SyncResult) => void,
	) {
		this.syncListeners.push(callback);
		return () => {
			this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
		};
	}

	/**
	 * Notify all listeners of status change
	 */
	private notifyListeners(status: SyncStatus, result?: SyncResult) {
		this.syncListeners.forEach((listener) => listener(status, result));
	}

	/**
	 * Sync all pending transactions
	 */
	async syncPendingTransactions(): Promise<SyncResult> {
		if (this.isSyncing) {
			console.log("Sync already in progress");
			return { success: 0, failed: 0, total: 0, errors: [] };
		}

		// Check if online
		if (!navigator.onLine) {
			console.log("Cannot sync: offline");
			toast.error("Cannot sync while offline");
			return { success: 0, failed: 0, total: 0, errors: [] };
		}

		this.isSyncing = true;
		this.notifyListeners("syncing");

		try {
			const pending = await offlineStorage.getPendingTransactions();

			if (pending.length === 0) {
				console.log("No pending transactions to sync");
				this.isSyncing = false;
				this.notifyListeners("idle");
				return { success: 0, failed: 0, total: 0, errors: [] };
			}

			console.log(`Syncing ${pending.length} pending transactions...`);
			toast.loading(
				`Syncing ${pending.length} transaction${pending.length > 1 ? "s" : ""}...`,
				{
					id: "sync-toast",
				},
			);

			const result: SyncResult = {
				success: 0,
				failed: 0,
				total: pending.length,
				errors: [],
			};

			// Sync each transaction
			for (const transaction of pending) {
				try {
					const serverTransactionId = await this.syncTransaction(transaction);
					await offlineStorage.markAsSynced(
						transaction.id,
						serverTransactionId,
					);
					result.success++;
				} catch (error: any) {
					console.error(`Failed to sync transaction ${transaction.id}:`, error);
					await offlineStorage.updateSyncAttempt(transaction.id, error.message);
					result.failed++;
					result.errors.push({
						id: transaction.id,
						error: error.message || "Unknown error",
					});
				}
			}

			// Clean up synced transactions
			await offlineStorage.clearSyncedTransactions();

			// Show result toast
			toast.dismiss("sync-toast");
			if (result.success > 0) {
				toast.success(
					`Synced ${result.success} transaction${result.success > 1 ? "s" : ""}!`,
					{
						description:
							result.failed > 0 ? `${result.failed} failed to sync` : undefined,
					},
				);
			}

			if (result.failed > 0 && result.success === 0) {
				toast.error(
					`Failed to sync ${result.failed} transaction${result.failed > 1 ? "s" : ""}`,
					{
						description: "Will retry automatically when online",
					},
				);
			}

			this.isSyncing = false;
			this.notifyListeners(result.failed === 0 ? "success" : "error", result);

			return result;
		} catch (error: any) {
			console.error("Sync error:", error);
			toast.dismiss("sync-toast");
			toast.error("Sync failed", {
				description: error.message || "Unknown error",
			});

			this.isSyncing = false;
			this.notifyListeners("error");

			return { success: 0, failed: 0, total: 0, errors: [] };
		}
	}

	/**
	 * Sync a single transaction to the server
	 */
	private async syncTransaction(
		transaction: OfflineTransaction,
	): Promise<string> {
		const response = await fetch("/api/transactions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: transaction.type,
				amount: transaction.amount,
				description: transaction.description,
				category: transaction.category,
				categoryIcon: transaction.categoryIcon,
				date: transaction.date,
				notes: transaction.notes,
				tags: transaction.tags,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}`);
		}

		const data = await response.json();
		return data.id || data.transactionId;
	}

	/**
	 * Check if there are pending transactions
	 */
	async hasPendingTransactions(): Promise<boolean> {
		const count = await offlineStorage.getPendingCount();
		return count > 0;
	}

	/**
	 * Get pending transaction count
	 */
	async getPendingCount(): Promise<number> {
		return await offlineStorage.getPendingCount();
	}

	/**
	 * Auto-sync when coming online
	 */
	setupAutoSync() {
		window.addEventListener("online", async () => {
			console.log("Network online - checking for pending transactions");
			const hasPending = await this.hasPendingTransactions();

			if (hasPending) {
				// Wait a bit to ensure connection is stable
				setTimeout(() => {
					this.syncPendingTransactions();
				}, 2000);
			}
		});

		// Also check on page load if online
		if (navigator.onLine) {
			setTimeout(async () => {
				const hasPending = await this.hasPendingTransactions();
				if (hasPending) {
					this.syncPendingTransactions();
				}
			}, 3000);
		}
	}
}

// Singleton instance
export const syncManager = new SyncManager();

// Initialize auto-sync
if (typeof window !== "undefined") {
	syncManager.setupAutoSync();
}
