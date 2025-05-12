import { localStore } from './localStore';

export const settingsStore = localStore('settings', {
	currency: 'LKR',
	theme: 'light', // 'light' or 'dark'
	notifications: true,
	language: 'en',
	displayDecimal: true,
	compactNumbers: false,
	dateFormat: 'MM/DD/YYYY',
	startDayOfWeek: 'sunday',
	advancedMode: false 
});
