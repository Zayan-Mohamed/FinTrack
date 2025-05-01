import { get } from 'svelte/store';
import { settingsStore } from '../stores/settings';

export function formatCurrency(value) {
	const settings = get(settingsStore);

	const currencyConfig = {
		USD: { locale: 'en-US', currency: 'USD' },
		EUR: { locale: 'de-DE', currency: 'EUR' },
		GBP: { locale: 'en-GB', currency: 'GBP' },
		CAD: { locale: 'en-CA', currency: 'CAD' },
		AUD: { locale: 'en-AU', currency: 'AUD' },
		JPY: { locale: 'ja-JP', currency: 'JPY' },
		LKR: { locale: 'si-LK', currency: 'LKR' }
	};

	const { locale, currency } = currencyConfig[settings?.currency] || currencyConfig.USD;

	const formatter = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2
	});

	return formatter.format(value);
}
