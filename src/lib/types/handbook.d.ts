export type HandbookStatus = 'no_handbook' | 'not_started' | 'in_progress' | 'completed';
export type StepKind = 'content' | 'ack' | 'link' | 'quiz';
export type StepStatus = 'not_started' | 'in_progress' | 'completed';

export interface HandbookStep {
	step_id: string;
	sort_order: number;
	kind: StepKind;
	title: string;
	body: string;
	content: any;
	is_required: boolean;
	status: StepStatus;
	started_at: string | null;
	completed_at: string | null;
	response: any;
}

export interface Handbook {
	handbook_id: string;
	status: HandbookStatus;
	template_id: string;
	template_title: string;
	template_description: string;
	template_version: string;
	department_id: string;
	department_name: string;
	steps: HandbookStep[];
}
