/**
 * Hook for creating transactions with offline support
 * Automatically saves to IndexedDB when offline and syncs when online
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTransaction } from "../app/(dashboard)/_actions/transaction";
import { offlineStorage } from "./offlineStorage";
import { toast } from "sonner";
import { CreateTransactionSchemaType } from "@/schema/transaction";

interface CreateTransactionInput extends CreateTransactionSchemaType {
	tags?: string[];
	attachments?: any[];
	splits?: any[];
	categoryIcon?: string;
}

export function useCreateTransaction() {
	const queryClient = useQueryClient();
	const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

	const mutation = useMutation({
		mutationFn: async (values: CreateTransactionInput) => {
			// If offline, save to IndexedDB
			if (!isOnline) {
				const offlineId = await offlineStorage.addTransaction({
					type: values.type,
					amount: values.amount,
					description: values.description || "",
					category: values.category,
					categoryIcon: values.categoryIcon || "",
					date: values.date,
					notes: values.notes,
					tags: values.tags,
				});

				toast.success("Transaction saved offline", {
					description: "Will sync when you're back online",
					id: "create-transaction",
				});

				return { id: offlineId, offline: true };
			}

			// If online, create normally
			const result = await CreateTransaction(values);
			return { id: result, offline: false };
		},
		onSuccess: (data) => {
			if (data && !data.offline) {
				toast.success("Transaction created successfully", {
					id: "create-transaction",
				});
			}

			// Invalidate queries to refresh data
			queryClient.invalidateQueries({
				queryKey: ["overview"],
			});
			queryClient.invalidateQueries({
				queryKey: ["transactions"],
			});
			queryClient.invalidateQueries({
				queryKey: ["calendar"],
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to create transaction", {
				description: error.message,
				id: "create-transaction",
			});
		},
	});

	return {
		...mutation,
		isOffline: !isOnline,
	};
}
