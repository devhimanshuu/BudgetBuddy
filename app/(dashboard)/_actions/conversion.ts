"use server";

export async function GetExchangeRate(
	from: string,
	to: string,
): Promise<number | null> {
	try {
		const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
		const data = await response.json();

		if (data.result === "success") {
			return data.rates[to] || null;
		}
		return null;
	} catch (error) {
		console.error("Exchange rate fetch error:", error);
		return null;
	}
}

export async function ConvertCurrency(
	amount: number,
	from: string,
	to: string,
): Promise<
	| {
			convertedAmount: number;
			rate: number;
			success: boolean;
	  }
	| { success: false }
> {
	if (from === to) {
		return { convertedAmount: amount, rate: 1, success: true };
	}

	const rate = await GetExchangeRate(from, to);
	if (rate) {
		return {
			convertedAmount: amount * rate,
			rate: rate,
			success: true,
		};
	}

	return { success: false };
}
