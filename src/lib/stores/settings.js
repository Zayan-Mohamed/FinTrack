import { localStore } from './localStore';

export const settingsStore = localStore('settings', {
  currency: 'LKR',
  theme: 'light', // 'light' or 'dark'
  notifications: true,
  language: 'en'
});