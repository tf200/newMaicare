export type HandbookStepKind = 'content' | 'ack' | 'link' | 'quiz';
export type HandbookStatus = 'not_started' | 'in_progress' | 'completed' | 'waived';
export type HandbookStepStatus = 'pending' | 'completed' | 'skipped';
export type StepResponse = Record<string, unknown> | string | null;

export interface HandbookStep {
	step_id: string;
	sort_order: number;
	kind: HandbookStepKind;
	title: string;
	body: string | null;
	content: unknown;
	is_required: boolean;
	status: HandbookStepStatus;
	started_at: string | null;
	completed_at: string | null;
	response: StepResponse;
}

export interface Handbook {
	handbook_id: string;
	status: HandbookStatus;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	template_id: string;
	template_title: string;
	template_description: string | null;
	template_version: string;
	department_id: string | null;
	department_name: string | null;
	steps: HandbookStep[];
}
