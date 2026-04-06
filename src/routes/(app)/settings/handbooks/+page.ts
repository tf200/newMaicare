import type { PageLoad } from './$types';
import { listDepartments } from '$lib/api/settings';
import { listDepartmentTemplates, listTemplateSteps } from '$lib/api/handbooks';
import type { DepartmentItem, HandbookTemplateApi, HandbookTemplateStepApi } from '$lib/types/api';
import type {
	DepartmentOption,
	DepartmentTemplateGroup,
	HandbookSettingsLoadResult,
	HandbookStep,
	HandbookTemplateVersion,
	StepKind
} from './types';

export interface HandbookSettingsPageData {
	initialPromise: Promise<HandbookSettingsLoadResult>;
}

export const _toDepartmentOption = (department: DepartmentItem): DepartmentOption => ({
	id: department.id,
	name: department.name
});

export const _toStepKind = (kind: string): StepKind => {
	if (kind === 'ack' || kind === 'link' || kind === 'quiz') {
		return kind;
	}

	return 'content';
};

export const _mapStep = (step: HandbookTemplateStepApi): HandbookStep => ({
	id: step.id,
	templateId: step.template_id,
	title: step.title,
	kind: _toStepKind(step.kind),
	sortOrder: step.sort_order,
	body: step.body ?? '',
	content: step.content ?? null,
	isRequired: step.is_required ?? false,
	updatedAt: step.updated_at ?? null
});

export const _mapTemplateVersion = (
	template: HandbookTemplateApi,
	steps: HandbookStep[]
): HandbookTemplateVersion => ({
	id: template.id,
	departmentId: template.department_id,
	title: template.title,
	description: template.description ?? '',
	version: String(template.version),
	status: template.status,
	publishedAt: template.published_at ?? null,
	archivedAt: template.archived_at ?? null,
	createdAt: template.created_at ?? null,
	updatedAt: template.updated_at ?? null,
	steps
});

export const _createInitialHandbookSettings = (): HandbookSettingsLoadResult => ({
	departments: [],
	departmentTemplates: [],
	loadError: null
});

function _getDefaultVersionId(versions: HandbookTemplateVersion[]): string | null {
	return (
		versions.find((v) => v.status === 'draft')?.id ??
		versions.find((v) => v.status === 'published')?.id ??
		versions[0]?.id ??
		null
	);
}

export const load: PageLoad = () => {
	const initialPromise = listDepartments()
		.then((response) => {
			const departments = response.data.results.map(_toDepartmentOption);
			return {
				departments,
				departmentTemplates: [] as DepartmentTemplateGroup[],
				loadError: null
			} satisfies HandbookSettingsLoadResult;
		})
		.catch(
			(error): HandbookSettingsLoadResult => ({
				..._createInitialHandbookSettings(),
				loadError: error instanceof Error ? error.message : 'Failed to load handbook templates.'
			})
		);

	return {
		initialPromise
	};
};
