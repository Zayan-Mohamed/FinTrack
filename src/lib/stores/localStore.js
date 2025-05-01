import { writable } from 'svelte/store';

export function localStore(key, initial) {
	const storedValue =
		typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(key)) : null;

	const store = writable(storedValue !== null ? storedValue : initial);

	store.subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return store;
}
