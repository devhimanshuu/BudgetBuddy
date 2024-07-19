import { Currencies } from "./currencies";

export function DateToUTCDate(data: Date) {
  return new Date(
    Date.UTC(
      data.getFullYear(),
      data.getMonth(),
      data.getDate(),
      data.getHours(),
      data.getMinutes(),
      data.getSeconds(),
      data.getMilliseconds()
    )
  );
}

export function GetFormatterForCurrency(currency: string) {
  const locale = Currencies.find((c) => c.value === currency)?.locale;

  return new Intl.NumberFormat(locale, { style: "currency", currency });
}
