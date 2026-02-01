export interface PaginationState<TFilters = Record<string, unknown>> {
	count: number;
	page: number;
	pageSize: number;
	next: string | null;
	previous: string | null;
	filters: TFilters;
}
