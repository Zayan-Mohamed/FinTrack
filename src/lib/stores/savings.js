import { localStore } from './localStore';

// Demo data
const initialSavings = [
    {
        id: '1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 3500,
        targetDate: '2025-12-31',
        color: 'blue',
        category: 'emergency',
        priority: 'high',
        notes: 'Aim for 6 months of expenses'
    },
    {
        id: '2',
        name: 'Dream Vacation',
        targetAmount: 5000,
        currentAmount: 1250,
        targetDate: '2025-08-01',
        color: 'green',
        category: 'travel',
        priority: 'medium',
        notes: 'Trip to Japan'
    },
    {
        id: '3',
        name: 'New Car',
        targetAmount: 25000,
        currentAmount: 7500,
        targetDate: '2026-06-30',
        color: 'red',
        category: 'car',
        priority: 'low',
        notes: ''
    }
];

export const savings = localStore('savings', initialSavings);