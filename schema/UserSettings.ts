import { Currencies } from "@/lib/currencies";
import { z } from "zod";

export const UpdateUserCurrencySchema = z.object({
	currency: z.custom((value) => {
		const found = Currencies.some((c: any) => c.value === value);
		if (!found) {
			throw new Error(`invalid currency: ${value}`);
		}
		return value;
	}),
});
export const UpdateAlertSettingsSchema = z.object({
	spendingLimitThreshold: z.number().min(1).max(100),
	enableAnomalyDetection: z.boolean(),
	anomalyThreshold: z.number().min(1.1).max(10),
});
