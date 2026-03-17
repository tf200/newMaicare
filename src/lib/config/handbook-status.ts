/**
 * Centralized status configuration for handbook assignments.
 *
 * Provides label, colors, and class names used across the handbooks table
 * and the assignment detail sheet.
 */
import type { HandbookAssignmentStatusApi } from '$lib/types/api';

export type HandbookStatus = HandbookAssignmentStatusApi;

export interface HandbookStatusConfig {
	label: string;
	/** Small colored dot (e.g. inside a badge). */
	dotClass: string;
	/** Badge with border + background + text color. */
	badgeClass: string;
	/** Pill variant with ring (used in detail sheet). */
	pillClass: string;
}

export const handbookStatusConfig: Record<HandbookStatus, HandbookStatusConfig> = {
	unassigned: {
		label: 'Unassigned',
		dotClass: 'bg-zinc-400',
		badgeClass: 'border border-border bg-surface-alt/70 text-text-muted',
		pillClass: 'bg-zinc-400/10 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-400/20'
	},
	completed: {
		label: 'Completed',
		dotClass: 'bg-emerald-500',
		badgeClass:
			'border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
		pillClass:
			'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20'
	},
	in_progress: {
		label: 'In Progress',
		dotClass: 'bg-blue-500',
		badgeClass: 'border border-blue-500/15 bg-blue-500/10 text-blue-700 dark:text-blue-300',
		pillClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20'
	},
	not_started: {
		label: 'Not Started',
		dotClass: 'bg-zinc-500',
		badgeClass: 'border border-zinc-500/10 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
		pillClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-500/20'
	},
	waived: {
		label: 'Waived',
		dotClass: 'bg-orange-500',
		badgeClass:
			'border border-orange-500/15 bg-orange-500/10 text-orange-700 dark:text-orange-300',
		pillClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/20'
	}
};

/** Get a human-readable label for a status value. */
export const getStatusLabel = (status: HandbookStatus): string =>
	handbookStatusConfig[status]?.label ?? status;
