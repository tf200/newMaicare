import { getContext, setContext } from 'svelte';

const BREADCRUMBS_KEY = Symbol('BREADCRUMBS');

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

export class BreadcrumbsState {
	items = $state<BreadcrumbItem[]>([]);
}

export function setBreadcrumbsState(): BreadcrumbsState {
	const state = new BreadcrumbsState();
	setContext(BREADCRUMBS_KEY, state);
	return state;
}

export function getBreadcrumbsState(): BreadcrumbsState {
	return getContext<BreadcrumbsState>(BREADCRUMBS_KEY);
}
