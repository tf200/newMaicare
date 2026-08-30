export type EvaluationPageKey = 'upcoming_page' | 'drafts_page' | 'submitted_page';

export const EVALUATION_PAGE_SIZE = 10;

export function readEvaluationPage(searchParams: URLSearchParams, key: EvaluationPageKey): number {
	const value = Number(searchParams.get(key) ?? '1');
	return Number.isInteger(value) && value > 0 ? value : 1;
}

export function evaluationPageHref(url: URL, key: EvaluationPageKey, nextPage: number): string {
	const searchParams = new URLSearchParams(url.searchParams);
	searchParams.delete('page');
	if (nextPage <= 1) searchParams.delete(key);
	else searchParams.set(key, String(nextPage));

	const query = searchParams.toString();
	return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
}
