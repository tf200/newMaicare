import type {
	HandbookStepContentApi,
	HandbookStepKindApi,
	HandbookTemplateStatusApi
} from '$lib/types/api';

export type StepKind = HandbookStepKindApi;

export type VersionStatus = HandbookTemplateStatusApi;
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type DraftModalMode = 'create' | 'clone';
export type StepModalMode = 'create' | 'edit';

export interface DepartmentOption {
	id: string;
	name: string;
}

export interface HandbookStep {
	id: string;
	templateId: string;
	title: string;
	kind: StepKind;
	sortOrder: number;
	body: string;
	content: HandbookStepContentApi;
	isRequired: boolean;
	updatedAt: string | null;
}

export interface HandbookTemplateVersion {
	id: string;
	departmentId: string;
	title: string;
	description: string;
	version: string;
	status: VersionStatus;
	publishedAt: string | null;
	archivedAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	steps: HandbookStep[];
}

export interface DepartmentTemplateGroup {
	departmentId: string;
	departmentName: string;
	versions: HandbookTemplateVersion[];
}

export interface HandbookSettingsLoadResult {
	departments: DepartmentOption[];
	departmentTemplates: DepartmentTemplateGroup[];
	loadError: string | null;
}

export interface StepFormState {
	title: string;
	kind: HandbookStepKindApi;
	body: string;
	linkUrl: string;
	quizQuestion: string;
	quizOptionsText: string;
	quizCorrectOptionIndex: string;
	isRequired: boolean;
}
