/**
 * Offline Transaction Storage using IndexedDB
 * Stores transactions locally when offline and syncs when online
 */

export interface OfflineTransaction {
	id: string; // Temporary local ID
	type: "income" | "expense";
	amount: number;
	description: string;
	category: string;
	categoryIcon: string;
	date: Date;
	notes?: string;
	tags?: string[];
	createdAt: Date;
	synced: boolean;
	syncAttempts: number;
	lastSyncAttempt?: Date;
	error?: string;
}

const DB_NAME = "BudgetBuddyOffline";
const DB_VERSION = 1;
const STORE_NAME = "pendingTransactions";

class OfflineStorageManager {
	private db: IDBDatabase | null = null;

	/**
	 * Initialize the database
	 */
	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error("Failed to open IndexedDB:", request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				this.db = request.result;
				console.log("IndexedDB initialized successfully");
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const objectStore = db.createObjectStore(STORE_NAME, {
						keyPath: "id",
					});

					// Create indexes
					objectStore.createIndex("synced", "synced", { unique: false });
					objectStore.createIndex("createdAt", "createdAt", { unique: false });
					objectStore.createIndex("type", "type", { unique: false });

					console.log("Object store created");
				}
			};
		});
	}

	/**
	 * Add a transaction to offline storage
	 */
	async addTransaction(
		transaction: Omit<
			OfflineTransaction,
			"id" | "createdAt" | "synced" | "syncAttempts"
		>,
	): Promise<string> {
		if (!this.db) await this.init();

		const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const offlineTransaction: OfflineTransaction = {
			...transaction,
			id,
			createdAt: new Date(),
			synced: false,
			syncAttempts: 0,
		};

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.add(offlineTransaction);

			request.onsuccess = () => {
				console.log("Transaction saved offline:", id);
				resolve(id);
			};

			request.onerror = () => {
				console.error("Failed to save transaction:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Get all pending (unsynced) transactions
	 */
	async getPendingTransactions(): Promise<OfflineTransaction[]> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				// Filter for unsynced transactions (synced === false)
				const allTransactions = request.result || [];
				const pending = allTransactions.filter((t) => !t.synced);
				resolve(pending);
			};

			request.onerror = () => {
				console.error("Failed to get pending transactions:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Get all transactions (synced and unsynced)
	 */
	async getAllTransactions(): Promise<OfflineTransaction[]> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result || []);
			};

			request.onerror = () => {
				console.error("Failed to get all transactions:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Mark a transaction as synced
	 */
	async markAsSynced(id: string, serverTransactionId?: string): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const getRequest = store.get(id);

			getRequest.onsuccess = () => {
				const data = getRequest.result;
				if (data) {
					data.synced = true;
					data.serverTransactionId = serverTransactionId;
					const updateRequest = store.put(data);

					updateRequest.onsuccess = () => {
						console.log("Transaction marked as synced:", id);
						resolve();
					};

					updateRequest.onerror = () => {
						reject(updateRequest.error);
					};
				} else {
					resolve(); // Transaction not found, already deleted
				}
			};

			getRequest.onerror = () => {
				reject(getRequest.error);
			};
		});
	}

	/**
	 * Update sync attempt count and error
	 */
	async updateSyncAttempt(id: string, error?: string): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const getRequest = store.get(id);

			getRequest.onsuccess = () => {
				const data = getRequest.result;
				if (data) {
					data.syncAttempts = (data.syncAttempts || 0) + 1;
					data.lastSyncAttempt = new Date();
					if (error) {
						data.error = error;
					}
					const updateRequest = store.put(data);

					updateRequest.onsuccess = () => {
						resolve();
					};

					updateRequest.onerror = () => {
						reject(updateRequest.error);
					};
				} else {
					resolve();
				}
			};

			getRequest.onerror = () => {
				reject(getRequest.error);
			};
		});
	}

	/**
	 * Delete a transaction
	 */
	async deleteTransaction(id: string): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.delete(id);

			request.onsuccess = () => {
				console.log("Transaction deleted:", id);
				resolve();
			};

			request.onerror = () => {
				console.error("Failed to delete transaction:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Clear all synced transactions (cleanup)
	 */
	async clearSyncedTransactions(): Promise<void> {
		if (!this.db) await this.init();

		const synced = await this.getAllTransactions();
		const syncedIds = synced.filter((t) => t.synced).map((t) => t.id);

		for (const id of syncedIds) {
			await this.deleteTransaction(id);
		}

		console.log(`Cleared ${syncedIds.length} synced transactions`);
	}

	/**
	 * Get count of pending transactions
	 */
	async getPendingCount(): Promise<number> {
		const pending = await this.getPendingTransactions();
		return pending.length;
	}

	/**
	 * Clear all data (use with caution)
	 */
	async clearAll(): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();

			request.onsuccess = () => {
				console.log("All offline data cleared");
				resolve();
			};

			request.onerror = () => {
				console.error("Failed to clear data:", request.error);
				reject(request.error);
			};
		});
	}
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();
