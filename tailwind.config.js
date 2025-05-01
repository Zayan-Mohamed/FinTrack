/* tailwind.config.js */
export const content = [
  './src/**/*.{html,js,svelte,ts,css}',
  './src/styles/**/*.{css}'
];
export const safelist = [
  'bg-gray-100',
  'bg-gray-900',
  'text-gray-100',
  'text-gray-800',
  'dark:bg-gray-900',
  'dark:text-gray-100',
  'dark:bg-gray-800',
  'dark:bg-blue-600'
];
export const darkMode = 'class';
export const theme = {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#4F46E5',
        '50': '#eef2ff',
        light: '#818cf8'
      },
      secondary: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B'
    }
  }
};
export const plugins = [];