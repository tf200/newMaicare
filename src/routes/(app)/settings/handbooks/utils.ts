import { CheckCircle2, FileText, Link as LinkIcon, type Icon as LucideIcon } from 'lucide-svelte';
import type {
	HandbookStepContentApi,
	LinkStepContentApi,
	QuizStepContentApi
} from '$lib/types/api';
import type {
	DepartmentTemplateGroup,
	HandbookStep,
	HandbookTemplateVersion,
	StepFormState,
	StepKind
} from './types';

export const cardClass =
	'rounded-3xl border border-border/60 bg-surface/90 p-6 shadow-sm backdrop-blur-sm';

export function createEmptyStepForm(): StepFormState {
	return {
		title: '',
		kind: 'content',
		body: '',
		linkUrl: '',
		quizQuestion: '',
		quizOptionsText: '',
		quizCorrectOptionIndex: '0',
		isRequired: true
	};
}

export function getDefaultVersionId(group: DepartmentTemplateGroup | null): string | null {
	if (!group) return null;

	return (
		group.versions.find((version) => version.status === 'draft')?.id ??
		group.versions.find((version) => version.status === 'published')?.id ??
		group.versions[0]?.id ??
		null
	);
}

export function compareVersionNumbers(a: HandbookTemplateVersion, b: HandbookTemplateVersion) {
	return Number(b.version) - Number(a.version);
}

export function sortSteps(steps: HandbookStep[]) {
	return [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function formatDate(value: string | null) {
	if (!value) return '-';

	return new Date(value).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

export function formatVersion(version: string) {
	return version.startsWith('v') ? version : `v${version}`;
}

export function versionStatusTone(status: HandbookTemplateVersion['status']) {
	if (status === 'published') return 'bg-success/10 text-success ring-success/20';
	if (status === 'draft') return 'bg-warning/10 text-warning ring-warning/20';
	return 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/20';
}

export function versionMetaLabel(version: HandbookTemplateVersion) {
	if (version.status === 'published' && version.publishedAt) {
		return `Published ${formatDate(version.publishedAt)}`;
	}

	if (version.status === 'archived' && version.archivedAt) {
		return `Archived ${formatDate(version.archivedAt)}`;
	}

	if (version.updatedAt) {
		return `Updated ${formatDate(version.updatedAt)}`;
	}

	if (version.createdAt) {
		return `Created ${formatDate(version.createdAt)}`;
	}

	return 'Version metadata unavailable';
}

export function getLinkContent(content: HandbookStepContentApi): LinkStepContentApi | null {
	if (
		content &&
		typeof content === 'object' &&
		'url' in content &&
		typeof content.url === 'string'
	) {
		return { url: content.url };
	}

	return null;
}

export function getQuizContent(content: HandbookStepContentApi): QuizStepContentApi | null {
	if (
		content &&
		typeof content === 'object' &&
		'question' in content &&
		typeof content.question === 'string' &&
		'options' in content &&
		Array.isArray(content.options) &&
		'correct_option_index' in content &&
		typeof content.correct_option_index === 'number'
	) {
		return {
			question: content.question,
			options: content.options.filter((option) => typeof option === 'string'),
			correct_option_index: content.correct_option_index
		};
	}

	return null;
}

export function isAbsoluteHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export function getFieldBorderClass(error: string | null) {
	return error ? 'border-rose-500/40 focus:ring-rose-500/20' : '';
}

export function getStepIcon(kind: StepKind): typeof LucideIcon {
	if (kind === 'ack') return CheckCircle2;
	if (kind === 'link') return LinkIcon;
	return FileText;
}

export function getStepColorClasses(kind: StepKind) {
	if (kind === 'link')
		return { bg: 'bg-info/10', text: 'text-info', badge: 'bg-info/10 text-info' };
	if (kind === 'ack')
		return { bg: 'bg-success/10', text: 'text-success', badge: 'bg-success/10 text-success' };
	if (kind === 'quiz')
		return {
			bg: 'bg-secondary/10',
			text: 'text-secondary',
			badge: 'bg-secondary/10 text-secondary'
		};
	return { bg: 'bg-brand/10', text: 'text-brand', badge: 'bg-brand/10 text-brand' };
}

export function getLinkTarget(step: HandbookStep) {
	return getLinkContent(step.content)?.url ?? '';
}

export function getStepSummary(step: HandbookStep) {
	if (step.kind === 'link') {
		return getLinkTarget(step) || step.body || 'No link configured.';
	}

	if (step.kind === 'quiz') {
		const quiz = getQuizContent(step.content);
		return quiz
			? `${quiz.options.length} options • correct answer ${quiz.correct_option_index + 1}`
			: 'Quiz content unavailable.';
	}

	return step.body || 'No body provided.';
}
