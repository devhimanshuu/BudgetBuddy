export const Currencies = [
  { value: "USD", label: "$ Dollar", locale: "en-US" },
  { value: "INR", label: "₹ Rupees", locale: "en-IN" },
  { value: "EUR", label: "€ Euro", locale: "de-DE" },
  { value: "GBP", label: "£ Pound", locale: "en-GU" },
  { value: "JPY", label: "¥ Yen", locale: "ja-JP" },
];

export type Currency = (typeof Currencies)[0];
