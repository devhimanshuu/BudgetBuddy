export const Currencies = [
	{ value: "USD", label: "$ Dollar", locale: "en-US" },
	{ value: "INR", label: "₹ Rupees", locale: "en-IN" },
	{ value: "EUR", label: "€ Euro", locale: "de-DE" },
	{ value: "GBP", label: "£ Pound", locale: "en-GB" },
	{ value: "JPY", label: "¥ Yen", locale: "ja-JP" },
	{ value: "CAD", label: "$ Canadian Dollar", locale: "en-CA" },
	{ value: "AUD", label: "$ Australian Dollar", locale: "en-AU" },
	{ value: "CNY", label: "¥ Yuan", locale: "zh-CN" },
	{ value: "RUB", label: "₽ Ruble", locale: "ru-RU" },
	{ value: "CHF", label: "fr Franc", locale: "de-CH" },
	{ value: "SGD", label: "$ Singapore Dollar", locale: "en-SG" },
	{ value: "KRW", label: "₩ Won", locale: "ko-KR" },
	{ value: "TRY", label: "₺ Lira", locale: "tr-TR" },
	{ value: "AED", label: "د.إ Dirham", locale: "ar-AE" },
	{ value: "ZAR", label: "R Rand", locale: "en-ZA" },
	{ value: "BRL", label: "R$ Real", locale: "pt-BR" },
];

export type Currency = (typeof Currencies)[0];
