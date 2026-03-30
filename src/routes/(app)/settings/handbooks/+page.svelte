<script lang="ts">
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { m } from '$lib/paraglide/messages';
	import { onDestroy } from 'svelte';
	import { AlertCircle, BookOpen, ChevronLeft, Plus } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Button from '$lib/components/ui/Button.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import {
		cloneHandbookTemplate,
		createHandbookStep,
		createHandbookTemplate,
		deleteHandbookStep,
		listDepartmentTemplates,
		listTemplateSteps,
		publishHandbookTemplate,
		reorderHandbookSteps,
		updateHandbookStep,
		updateHandbookTemplate
	} from '$lib/api/handbooks';
	import { ApiClientError } from '$lib/api/client';
	import type {
		CreateHandbookStepRequest,
		HandbookErrorCode,
		HandbookStepContentApi,
		UpdateHandbookStepRequest,
		UpdateHandbookTemplateRequest
	} from '$lib/types/api';
	import { _mapStep, _mapTemplateVersion } from './+page';
	import type {
		DepartmentOption,
		DepartmentTemplateGroup,
		DraftModalMode,
		HandbookSettingsLoadResult,
		HandbookStep,
		HandbookTemplateVersion,
		LoadStatus,
		StepFormState,
		StepKind,
		StepModalMode
	} from './types';
	import {
		compareVersionNumbers,
		createEmptyStepForm,
		getDefaultVersionId,
		getLinkContent,
		getQuizContent,
		isAbsoluteHttpUrl,
		sortSteps
	} from './utils';
	import CreateDraftModal from './_components/CreateDraftModal.svelte';
	import DeleteStepModal from './_components/DeleteStepModal.svelte';
	import DepartmentsSidebar from './_components/DepartmentsSidebar.svelte';
	import EditMetadataModal from './_components/EditMetadataModal.svelte';
	import PreviewModal from './_components/PreviewModal.svelte';
	import StepEditorModal from './_components/StepEditorModal.svelte';
	import StepsSection from './_components/StepsSection.svelte';
	import VersionHeader from './_components/VersionHeader.svelte';
	import VersionsPanel from './_components/VersionsPanel.svelte';

	let { data } = $props<{
		data: {
			initial: HandbookSettingsLoadResult;
		};
	}>();

	const initialHandbookData = $derived(data.initial);

	let handbookData = $state<HandbookSettingsLoadResult>({
		departments: [],
		departmentTemplates: [],
		loadError: null
	});
	let selectedDepartmentId = $state<string | null>(null);
	let selectedVersionId = $state<string | null>(null);
	let preferredDepartmentId = $state<string | null>(null);
	let preferredVersionId = $state<string | null>(null);
	let templateStatusByDepartmentId = $state<Record<string, LoadStatus>>({});
	let stepStatusByVersionId = $state<Record<string, LoadStatus>>({});
	let templateErrorByDepartmentId = $state<Record<string, string>>({});
	let stepErrorByVersionId = $state<Record<string, string>>({});

	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	let isPreviewOpen = $state(false);
	let isDraftModalOpen = $state(false);
	let isMetadataModalOpen = $state(false);
	let isStepModalOpen = $state(false);
	let isDeleteStepModalOpen = $state(false);
	let isEditMode = $state(false);

	let isSubmittingDraft = $state(false);
	let isUpdatingTemplate = $state(false);
	let isPublishing = $state(false);
	let isSubmittingStep = $state(false);
	let isDeletingStep = $state(false);
	let reorderingStepId = $state<string | null>(null);

	let draftModalMode = $state<DraftModalMode>('create');
	let draftModalError = $state<string | null>(null);
	let metadataModalError = $state<string | null>(null);
	let stepModalMode = $state<StepModalMode>('create');
	let stepModalError = $state<string | null>(null);
	let deleteStepModalError = $state<string | null>(null);

	let createDraftDepartmentId = $state('');
	let createDraftTitle = $state('');
	let createDraftDescription = $state('');
	let cloneSourceTemplateId = $state<string | null>(null);

	let metadataTitle = $state('');
	let metadataDescription = $state('');

	let stepForm = $state<StepFormState>(createEmptyStepForm());
	let editingStepId = $state<string | null>(null);
	let stepPendingDelete = $state<HandbookStep | null>(null);

	function syncSelection(departments: DepartmentOption[], groups: DepartmentTemplateGroup[]) {
		if (departments.length === 0) {
			selectedDepartmentId = null;
			selectedVersionId = null;
			return;
		}

		const preferredDepartment = preferredDepartmentId
			? (departments.find((department) => department.id === preferredDepartmentId) ?? null)
			: null;
		const selectedDepartment = selectedDepartmentId
			? (departments.find((department) => department.id === selectedDepartmentId) ?? null)
			: null;
		const nextDepartment = preferredDepartment ?? selectedDepartment ?? departments[0];
		const nextGroup = groups.find((group) => group.departmentId === nextDepartment.id) ?? null;

		selectedDepartmentId = nextDepartment.id;

		const preferredVersion = preferredVersionId
			? (nextGroup?.versions.find((version) => version.id === preferredVersionId) ?? null)
			: null;
		const selectedVersion = selectedVersionId
			? (nextGroup?.versions.find((version) => version.id === selectedVersionId) ?? null)
			: null;

		selectedVersionId =
			preferredVersion?.id ?? selectedVersion?.id ?? getDefaultVersionId(nextGroup);
		preferredDepartmentId = null;
		preferredVersionId = null;
	}

	function upsertDepartmentGroup(group: DepartmentTemplateGroup) {
		const nextGroups = handbookData.departmentTemplates.filter(
			(candidate) => candidate.departmentId !== group.departmentId
		);

		nextGroups.push({
			...group,
			versions: [...group.versions].sort(compareVersionNumbers)
		});
		nextGroups.sort((a, b) => {
			const aIndex = handbookData.departments.findIndex(
				(department) => department.id === a.departmentId
			);
			const bIndex = handbookData.departments.findIndex(
				(department) => department.id === b.departmentId
			);
			return aIndex - bIndex;
		});

		handbookData = {
			...handbookData,
			departmentTemplates: nextGroups
		};
	}

	function updateDepartmentVersion(version: HandbookTemplateVersion) {
		const group =
			handbookData.departmentTemplates.find(
				(candidate) => candidate.departmentId === version.departmentId
			) ?? null;
		const nextVersions = group
			? group.versions
					.map((candidate) =>
						candidate.id === version.id ? { ...candidate, ...version } : candidate
					)
					.sort(compareVersionNumbers)
			: [version];

		upsertDepartmentGroup({
			departmentId: version.departmentId,
			departmentName:
				group?.departmentName ??
				handbookData.departments.find((department) => department.id === version.departmentId)
					?.name ??
				'Unknown department',
			versions: nextVersions
		});
	}

	async function ensureDepartmentTemplatesLoaded(departmentId: string, force = false) {
		const status = templateStatusByDepartmentId[departmentId] ?? 'idle';
		if (!force && (status === 'loading' || status === 'loaded')) return;

		const department = handbookData.departments.find((item) => item.id === departmentId);
		if (!department) return;

		templateStatusByDepartmentId = { ...templateStatusByDepartmentId, [departmentId]: 'loading' };
		templateErrorByDepartmentId = Object.fromEntries(
			Object.entries(templateErrorByDepartmentId).filter(([id]) => id !== departmentId)
		);

		try {
			const response = await listDepartmentTemplates(departmentId);
			const existingGroup =
				handbookData.departmentTemplates.find((group) => group.departmentId === departmentId) ??
				null;
			const existingStepsByVersionId = new Map(
				(existingGroup?.versions ?? []).map((version) => [version.id, version.steps])
			);

			const versions = response.data.results
				.map((template) =>
					_mapTemplateVersion(template, existingStepsByVersionId.get(template.id) ?? [])
				)
				.sort(compareVersionNumbers);

			upsertDepartmentGroup({
				departmentId,
				departmentName: department.name,
				versions
			});

			templateStatusByDepartmentId = { ...templateStatusByDepartmentId, [departmentId]: 'loaded' };

			if (selectedDepartmentId === departmentId) {
				const nextGroup = handbookData.departmentTemplates.find(
					(group) => group.departmentId === departmentId
				);
				selectedVersionId =
					preferredVersionId ||
					nextGroup?.versions.find((version) => version.id === selectedVersionId)?.id ||
					getDefaultVersionId(nextGroup ?? null);
				preferredVersionId = null;
			}
		} catch (error) {
			templateStatusByDepartmentId = { ...templateStatusByDepartmentId, [departmentId]: 'error' };
			templateErrorByDepartmentId = {
				...templateErrorByDepartmentId,
				[departmentId]:
					error instanceof Error
						? `Failed to load templates for ${department.name}: ${error.message}`
						: `Failed to load templates for ${department.name}.`
			};
		}
	}

	function updateVersionSteps(versionId: string, steps: HandbookStep[]) {
		handbookData = {
			...handbookData,
			departmentTemplates: handbookData.departmentTemplates.map((group) => ({
				...group,
				versions: group.versions.map((version) =>
					version.id === versionId ? { ...version, steps: sortSteps(steps) } : version
				)
			}))
		};
	}

	async function ensureVersionStepsLoaded(versionId: string, force = false) {
		const status = stepStatusByVersionId[versionId] ?? 'idle';
		if (!force && (status === 'loading' || status === 'loaded')) return;

		stepStatusByVersionId = { ...stepStatusByVersionId, [versionId]: 'loading' };
		stepErrorByVersionId = Object.fromEntries(
			Object.entries(stepErrorByVersionId).filter(([id]) => id !== versionId)
		);

		try {
			const response = await listTemplateSteps(versionId);
			updateVersionSteps(versionId, response.data.map(_mapStep));
			stepStatusByVersionId = { ...stepStatusByVersionId, [versionId]: 'loaded' };
		} catch (error) {
			stepStatusByVersionId = { ...stepStatusByVersionId, [versionId]: 'error' };
			stepErrorByVersionId = {
				...stepErrorByVersionId,
				[versionId]:
					error instanceof Error
						? `Failed to load steps: ${error.message}`
						: 'Failed to load steps for this version.'
			};
		}
	}

	$effect(() => {
		if (
			handbookData.departments.length > 0 ||
			handbookData.departmentTemplates.length > 0 ||
			handbookData.loadError !== null
		) {
			return;
		}

		handbookData = initialHandbookData;
		syncSelection(initialHandbookData.departments, initialHandbookData.departmentTemplates);
	});

	$effect(() => {
		if (!selectedDepartmentId) return;
		void ensureDepartmentTemplatesLoaded(selectedDepartmentId);
	});

	$effect(() => {
		if (!selectedVersionId) return;
		void ensureVersionStepsLoaded(selectedVersionId);
	});

	const selectedDepartment = $derived(
		handbookData.departments.find((department) => department.id === selectedDepartmentId) ?? null
	);

	const selectedDepartmentGroup = $derived(
		handbookData.departmentTemplates.find((group) => group.departmentId === selectedDepartmentId) ??
			null
	);

	const selectedVersion = $derived(
		selectedDepartmentGroup?.versions.find((version) => version.id === selectedVersionId) ?? null
	);

	const selectedVersionSteps = $derived(selectedVersion ? sortSteps(selectedVersion.steps) : []);
	const canEditSelectedDraft = $derived(
		Boolean(selectedVersion && selectedVersion.status === 'draft')
	);
	const isDraftVersion = $derived(selectedVersion?.status === 'draft');
	const isPublishedVersion = $derived(selectedVersion?.status === 'published');
	const isArchivedVersion = $derived(selectedVersion?.status === 'archived');
	const selectedDepartmentTemplateStatus = $derived(
		selectedDepartmentId ? (templateStatusByDepartmentId[selectedDepartmentId] ?? 'idle') : 'idle'
	);
	const selectedVersionStepStatus = $derived(
		selectedVersionId ? (stepStatusByVersionId[selectedVersionId] ?? 'idle') : 'idle'
	);
	const canPublishSelectedDraft = $derived(
		Boolean(
			selectedVersion &&
			selectedVersion.status === 'draft' &&
			selectedVersionStepStatus === 'loaded' &&
			selectedVersionSteps.length > 0
		)
	);
	const draftTitleError = $derived(
		draftModalMode === 'create' && !createDraftTitle.trim() ? 'Title is required.' : null
	);
	const metadataTitleError = $derived(!metadataTitle.trim() ? 'Title is required.' : null);
	const stepTitleError = $derived(!stepForm.title.trim() ? 'Step title is required.' : null);
	const stepLinkUrlError = $derived(
		stepForm.kind === 'link'
			? !stepForm.linkUrl.trim()
				? 'External URL is required.'
				: !isAbsoluteHttpUrl(stepForm.linkUrl.trim())
					? 'Use a valid absolute http or https URL.'
					: null
			: null
	);
	const stepQuizQuestionError = $derived(
		stepForm.kind === 'quiz' && !stepForm.quizQuestion.trim() ? 'Quiz question is required.' : null
	);
	const stepQuizOptions = $derived(
		stepForm.quizOptionsText
			.split('\n')
			.map((option) => option.trim())
			.filter(Boolean)
	);
	const stepQuizOptionsError = $derived(
		stepForm.kind === 'quiz' && stepQuizOptions.length < 2
			? 'Add at least two answer options.'
			: null
	);
	const stepQuizCorrectOptionError = $derived.by(() => {
		if (stepForm.kind !== 'quiz') return null;

		const index = Number(stepForm.quizCorrectOptionIndex);
		if (!stepForm.quizCorrectOptionIndex.trim()) {
			return 'Correct option index is required.';
		}

		if (!Number.isInteger(index) || index < 0 || index >= stepQuizOptions.length) {
			return 'Correct option index must match one of the listed options.';
		}

		return null;
	});
	const canSubmitDraft = $derived(
		Boolean(createDraftDepartmentId && (draftModalMode === 'clone' || !draftTitleError))
	);
	const canSaveMetadata = $derived(
		Boolean(selectedVersion && selectedVersion.status === 'draft' && !metadataTitleError)
	);
	const canSubmitStep = $derived.by(() => {
		if (!selectedVersion || selectedVersion.status !== 'draft') return false;
		if (stepTitleError) return false;
		if (stepForm.kind === 'link' && stepLinkUrlError) return false;
		if (stepForm.kind === 'quiz') {
			if (stepQuizQuestionError || stepQuizOptionsError || stepQuizCorrectOptionError) {
				return false;
			}
		}

		return true;
	});

	function formatError(error: unknown, fallback: string) {
		return error instanceof Error ? error.message : fallback;
	}

	function getErrorCode(error: unknown): HandbookErrorCode | null {
		if (error instanceof ApiClientError && error.code) {
			return error.code as HandbookErrorCode;
		}

		return null;
	}

	function showToast(message: string, type: 'success' | 'warning' | 'error') {
		toast = { message, type };

		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		toastTimer = setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 4000);
	}

	function closeToast() {
		if (toastTimer) {
			clearTimeout(toastTimer);
			toastTimer = null;
		}

		toast = null;
	}

	function selectDepartment(departmentId: string) {
		selectedDepartmentId = departmentId;
		selectedVersionId = getDefaultVersionId(
			handbookData.departmentTemplates.find((group) => group.departmentId === departmentId) ?? null
		);
		isEditMode = false;
		closeToast();
	}

	function selectVersion(versionId: string) {
		selectedVersionId = versionId;
		isEditMode = false;
		closeToast();
	}

	function toggleEditMode() {
		isEditMode = !isEditMode;
		closeToast();
	}

	function openCreateDraftModal() {
		draftModalMode = 'create';
		createDraftDepartmentId = selectedDepartmentId ?? handbookData.departments[0]?.id ?? '';
		createDraftTitle = selectedDepartment ? `${selectedDepartment.name} Handbook` : '';
		createDraftDescription = '';
		cloneSourceTemplateId = null;
		draftModalError = null;
		isDraftModalOpen = true;
	}

	function openCloneDraftModal(fromVersion: HandbookTemplateVersion) {
		draftModalMode = 'clone';
		createDraftDepartmentId = fromVersion.departmentId;
		createDraftTitle = fromVersion.title;
		createDraftDescription = fromVersion.description;
		cloneSourceTemplateId = fromVersion.id;
		draftModalError = null;
		isDraftModalOpen = true;
	}

	function openMetadataModal() {
		if (!selectedVersion || selectedVersion.status !== 'draft') return;

		metadataTitle = selectedVersion.title;
		metadataDescription = selectedVersion.description;
		metadataModalError = null;
		isMetadataModalOpen = true;
	}

	function hydrateStepForm(step: HandbookStep | null) {
		if (!step) {
			stepForm = createEmptyStepForm();
			return;
		}

		const linkContent = getLinkContent(step.content);
		const quizContent = getQuizContent(step.content);

		stepForm = {
			title: step.title,
			kind: step.kind,
			body: step.body,
			linkUrl: linkContent?.url ?? '',
			quizQuestion: quizContent?.question ?? '',
			quizOptionsText: quizContent?.options.join('\n') ?? '',
			quizCorrectOptionIndex:
				quizContent?.correct_option_index !== undefined
					? String(quizContent.correct_option_index)
					: '0',
			isRequired: step.isRequired
		};
	}

	function openAddStepModal() {
		hydrateStepForm(null);
		stepModalMode = 'create';
		editingStepId = null;
		stepModalError = null;
		isStepModalOpen = true;
	}

	function openEditStepModal(step: HandbookStep) {
		hydrateStepForm(step);
		stepModalMode = 'edit';
		editingStepId = step.id;
		stepModalError = null;
		isStepModalOpen = true;
	}

	function openDeleteStepModal(step: HandbookStep) {
		stepPendingDelete = step;
		deleteStepModalError = null;
		isDeleteStepModalOpen = true;
	}

	async function reloadData(
		options: { departmentId?: string | null; versionId?: string | null } = {}
	) {
		preferredDepartmentId = options.departmentId ?? selectedDepartmentId;
		preferredVersionId = options.versionId ?? selectedVersionId;
		const targetDepartmentId = preferredDepartmentId ?? selectedDepartmentId;
		if (!targetDepartmentId) return;

		await ensureDepartmentTemplatesLoaded(targetDepartmentId, true);

		const targetVersionId = preferredVersionId ?? selectedVersionId;
		if (!targetVersionId) return;

		await ensureVersionStepsLoaded(targetVersionId, true);
	}

	function getTemplateMutationError(error: unknown, fallback: string) {
		switch (getErrorCode(error)) {
			case 'HANDBOOK_DRAFT_ALREADY_EXISTS':
				return 'This department already has a draft. Open the draft version instead of creating another one.';
			case 'HANDBOOK_TEMPLATE_NOT_DRAFT':
				return 'Only draft templates can be edited.';
			case 'INVALID_REQUEST':
				return formatError(error, fallback);
			default:
				return formatError(error, fallback);
		}
	}

	async function handleSubmitDraft() {
		if (!createDraftDepartmentId) {
			draftModalError = 'Department is required.';
			return;
		}

		if (draftModalMode === 'create' && !createDraftTitle.trim()) {
			draftModalError = 'Title is required.';
			return;
		}

		isSubmittingDraft = true;
		draftModalError = null;
		closeToast();

		try {
			const response =
				draftModalMode === 'clone' && cloneSourceTemplateId
					? await cloneHandbookTemplate({ source_template_id: cloneSourceTemplateId })
					: await createHandbookTemplate({
							department_id: createDraftDepartmentId,
							title: createDraftTitle.trim(),
							description: createDraftDescription.trim() || undefined
						});

			isDraftModalOpen = false;
			isEditMode = true;
			showToast(
				draftModalMode === 'clone'
					? 'Draft cloned from the selected version.'
					: 'Draft version created.',
				'success'
			);
			await reloadData({
				departmentId: response.data.department_id,
				versionId: response.data.id
			});
		} catch (error) {
			draftModalError = getTemplateMutationError(error, 'Failed to create handbook draft.');
		} finally {
			isSubmittingDraft = false;
		}
	}

	async function handleUpdateTemplateMetadata() {
		if (!selectedVersion || selectedVersion.status !== 'draft') {
			metadataModalError = 'Only draft templates can be edited.';
			return;
		}

		if (!metadataTitle.trim()) {
			metadataModalError = 'Title is required.';
			return;
		}

		isUpdatingTemplate = true;
		metadataModalError = null;
		closeToast();

		const payload: UpdateHandbookTemplateRequest = {
			title: metadataTitle.trim(),
			description: metadataDescription.trim() ? metadataDescription.trim() : null
		};

		try {
			const response = await updateHandbookTemplate(selectedVersion.id, payload);
			updateDepartmentVersion(_mapTemplateVersion(response.data, selectedVersion.steps));
			isMetadataModalOpen = false;
			showToast('Draft details saved.', 'success');
		} catch (error) {
			metadataModalError = getTemplateMutationError(error, 'Failed to update draft details.');
		} finally {
			isUpdatingTemplate = false;
		}
	}

	async function handlePublish() {
		if (!selectedVersion || selectedVersion.status !== 'draft') {
			return;
		}

		isPublishing = true;
		closeToast();

		try {
			await publishHandbookTemplate({ template_id: selectedVersion.id });
			isEditMode = false;
			showToast('Draft published. The version list is up to date.', 'success');
			await reloadData({
				departmentId: selectedVersion.departmentId,
				versionId: selectedVersion.id
			});
		} catch (error) {
			showToast(
				getErrorCode(error) === 'HANDBOOK_TEMPLATE_NO_STEPS'
					? 'Add at least one step before publishing this draft.'
					: getTemplateMutationError(error, 'Failed to publish handbook draft.'),
				'error'
			);
		} finally {
			isPublishing = false;
		}
	}

	function buildStepPayloadContent(kind: StepKind): HandbookStepContentApi {
		if (kind === 'link') {
			const url = stepForm.linkUrl.trim();
			if (!url) {
				throw new Error('External URL is required for link steps.');
			}

			if (!isAbsoluteHttpUrl(url)) {
				throw new Error('External URL must be a valid absolute http or https URL.');
			}

			return { url };
		}

		if (kind === 'quiz') {
			const question = stepForm.quizQuestion.trim();
			const options = stepForm.quizOptionsText
				.split('\n')
				.map((option) => option.trim())
				.filter(Boolean);
			const index = Number(stepForm.quizCorrectOptionIndex);

			if (!question) {
				throw new Error('Quiz question is required.');
			}

			if (options.length < 2) {
				throw new Error('Quiz steps need at least two answer options.');
			}

			if (!Number.isInteger(index) || index < 0 || index >= options.length) {
				throw new Error('Correct answer index must point to one of the listed options.');
			}

			return {
				question,
				options,
				correct_option_index: index
			};
		}

		return null;
	}

	function getStepMutationError(error: unknown, fallback: string) {
		switch (getErrorCode(error)) {
			case 'HANDBOOK_TEMPLATE_NOT_DRAFT':
				return 'Only draft templates can be edited.';
			case 'HANDBOOK_LINK_URL_INVALID':
				return 'External URL must be a valid absolute http or https URL.';
			case 'HANDBOOK_QUIZ_CONTENT_INVALID':
				return 'Quiz content is invalid. Check the question, options, and correct answer.';
			case 'HANDBOOK_STEP_NOT_FOUND':
				return 'This step no longer exists. Refresh the draft and try again.';
			case 'HANDBOOK_STEP_REORDER_SET_MISMATCH':
				return 'The draft changed while reordering. Refresh the steps and try again.';
			case 'INVALID_REQUEST':
				return formatError(error, fallback);
			default:
				return formatError(error, fallback);
		}
	}

	async function handleSubmitStep() {
		if (!selectedVersion || selectedVersion.status !== 'draft') {
			stepModalError = 'Only draft templates can accept step changes.';
			return;
		}

		if (!stepForm.title.trim()) {
			stepModalError = 'Step title is required.';
			return;
		}

		let payloadContent: HandbookStepContentApi;

		try {
			payloadContent = buildStepPayloadContent(stepForm.kind);
		} catch (error) {
			stepModalError = formatError(error, 'Failed to validate step content.');
			return;
		}

		isSubmittingStep = true;
		stepModalError = null;
		closeToast();

		const trimmedBody = stepForm.body.trim();

		try {
			if (stepModalMode === 'edit' && editingStepId) {
				const payload: UpdateHandbookStepRequest = {
					title: stepForm.title.trim(),
					body: trimmedBody || null,
					content: payloadContent,
					is_required: stepForm.isRequired
				};
				const response = await updateHandbookStep(editingStepId, payload);
				const nextSteps = selectedVersionSteps.map((step) =>
					step.id === editingStepId ? _mapStep(response.data) : step
				);
				updateVersionSteps(selectedVersion.id, nextSteps);
				showToast('Draft step updated.', 'success');
			} else {
				const payload: CreateHandbookStepRequest = {
					template_id: selectedVersion.id,
					kind: stepForm.kind,
					title: stepForm.title.trim(),
					is_required: stepForm.isRequired,
					content: payloadContent
				};

				if (trimmedBody) {
					payload.body = trimmedBody;
				}

				const response = await createHandbookStep(payload);
				updateVersionSteps(selectedVersion.id, [...selectedVersionSteps, _mapStep(response.data)]);
				showToast('Step added to the draft.', 'success');
			}

			isStepModalOpen = false;
			isEditMode = true;
		} catch (error) {
			stepModalError = getStepMutationError(error, 'Failed to save draft step.');
		} finally {
			isSubmittingStep = false;
		}
	}

	async function handleDeleteStep() {
		if (!selectedVersion || selectedVersion.status !== 'draft' || !stepPendingDelete) {
			deleteStepModalError = 'Only draft steps can be deleted.';
			return;
		}

		isDeletingStep = true;
		deleteStepModalError = null;
		closeToast();
		const stepIdToDelete = stepPendingDelete.id;

		try {
			await deleteHandbookStep(stepIdToDelete);
			const nextSteps = sortSteps(
				selectedVersionSteps
					.filter((step) => step.id !== stepIdToDelete)
					.map((step, index) => ({ ...step, sortOrder: index + 1 }))
			);
			updateVersionSteps(selectedVersion.id, nextSteps);
			isDeleteStepModalOpen = false;
			stepPendingDelete = null;
			showToast('Draft step deleted.', 'success');
		} catch (error) {
			deleteStepModalError = getStepMutationError(error, 'Failed to delete draft step.');
		} finally {
			isDeletingStep = false;
		}
	}

	async function handleReorderStep(stepId: string, direction: 'up' | 'down') {
		if (!selectedVersion || selectedVersion.status !== 'draft') {
			showToast('Only draft templates can be reordered.', 'error');
			return;
		}

		const currentIndex = selectedVersionSteps.findIndex((step) => step.id === stepId);
		if (currentIndex === -1) return;

		const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		if (targetIndex < 0 || targetIndex >= selectedVersionSteps.length) return;

		const reordered = [...selectedVersionSteps];
		const [movedStep] = reordered.splice(currentIndex, 1);
		reordered.splice(targetIndex, 0, movedStep);
		const orderedStepIds = reordered.map((step) => step.id);

		reorderingStepId = stepId;
		closeToast();

		try {
			const response = await reorderHandbookSteps(selectedVersion.id, {
				ordered_step_ids: orderedStepIds
			});
			updateVersionSteps(selectedVersion.id, response.data.steps.map(_mapStep));
			showToast('Draft step order updated.', 'success');
		} catch (error) {
			showToast(getStepMutationError(error, 'Failed to reorder draft steps.'), 'error');
			await ensureVersionStepsLoaded(selectedVersion.id, true);
		} finally {
			reorderingStepId = null;
		}
	}

	function openExternalResource(url: string) {
		if (!url || !isAbsoluteHttpUrl(url)) return;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	onDestroy(() => {
		if (toastTimer) {
			clearTimeout(toastTimer);
		}
	});
</script>

<div class="mx-auto max-w-7xl space-y-8 pb-20">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div class="space-y-2">
			<div class="hidden"></div>
			<h1 class="text-4xl font-bold tracking-tight text-text">Handbook Templates</h1>
			<p class="text-text-muted">
				Manage department handbook versions, publish drafts, and maintain draft steps without
				leaving the page.
			</p>
		</div>
	</header>

	{#if handbookData.loadError}
		<div
			class="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800"
		>
			{handbookData.loadError}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<aside class="space-y-6 lg:col-span-4">
			<DepartmentsSidebar
				departments={handbookData.departments}
				departmentTemplates={handbookData.departmentTemplates}
				{selectedDepartmentId}
				{templateStatusByDepartmentId}
				onSelectDepartment={selectDepartment}
			/>

			<VersionsPanel
				{selectedDepartment}
				{selectedDepartmentGroup}
				{selectedDepartmentTemplateStatus}
				templateError={selectedDepartment
					? (templateErrorByDepartmentId[selectedDepartment.id] ?? null)
					: null}
				{selectedVersionId}
				onSelectVersion={selectVersion}
				onRetry={() => {
					if (selectedDepartment) {
						void ensureDepartmentTemplatesLoaded(selectedDepartment.id, true);
					}
				}}
			/>
		</aside>

		<main class="space-y-8 lg:col-span-8">
			{#if selectedDepartmentGroup && selectedVersion}
				<VersionHeader
					{selectedDepartmentGroup}
					{selectedVersion}
					{isDraftVersion}
					{isPublishedVersion}
					{isArchivedVersion}
					{isEditMode}
					{isPublishing}
					{canPublishSelectedDraft}
					selectedVersionStepsLength={selectedVersionSteps.length}
					onToggleEditMode={toggleEditMode}
					onOpenPreview={() => (isPreviewOpen = true)}
					onPublish={() => void handlePublish()}
					onCloneDraft={openCloneDraftModal}
					onOpenMetadata={openMetadataModal}
					onAddStep={openAddStepModal}
				/>

				<StepsSection
					{selectedVersion}
					{selectedVersionSteps}
					{selectedVersionStepStatus}
					stepError={stepErrorByVersionId[selectedVersion.id] ?? null}
					{isDraftVersion}
					{isEditMode}
					{canEditSelectedDraft}
					{reorderingStepId}
					onAddStep={openAddStepModal}
					onRetry={() => void ensureVersionStepsLoaded(selectedVersion.id, true)}
					onReorderStep={(stepId, direction) => void handleReorderStep(stepId, direction)}
					onEditStep={openEditStepModal}
					onDeleteStep={openDeleteStepModal}
					onOpenExternalResource={openExternalResource}
				/>
			{:else if selectedDepartment && selectedDepartmentTemplateStatus === 'loading'}
				<div
					class="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-border bg-surface/50 p-12 text-center"
				>
					<div class="rounded-3xl bg-brand/10 p-6 text-brand">
						<BookOpen class="h-12 w-12" />
					</div>
					<h2 class="mt-6 text-2xl font-bold text-text">Loading department templates</h2>
					<p class="mt-2 max-w-md text-text-muted">
						Fetching handbook versions for {selectedDepartment.name}.
					</p>
				</div>
			{:else if selectedDepartment && selectedDepartmentTemplateStatus === 'error'}
				<div
					class="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center"
				>
					<div class="rounded-3xl bg-rose-500/10 p-6 text-rose-600">
						<AlertCircle class="h-12 w-12" />
					</div>
					<h2 class="mt-6 text-2xl font-bold text-text">Unable to load versions</h2>
					<p class="mt-2 max-w-md text-text-muted">
						{templateErrorByDepartmentId[selectedDepartment.id] ??
							'Failed to load handbook templates.'}
					</p>
					<Button
						class="mt-6"
						onclick={() => void ensureDepartmentTemplatesLoaded(selectedDepartment.id, true)}
					>
						Retry
					</Button>
				</div>
			{:else if selectedDepartmentGroup}
				<div
					class="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-border bg-surface/50 p-12 text-center"
				>
					<div class="rounded-3xl bg-secondary/10 p-6 text-secondary">
						<BookOpen class="h-12 w-12" />
					</div>
					<h2 class="mt-6 text-2xl font-bold text-text">No versions for this department</h2>
					<p class="mt-2 max-w-md text-text-muted">
						Create the first draft for {selectedDepartmentGroup.departmentName} to start managing its
						handbook template lifecycle.
					</p>
					<Button class="mt-6 gap-2" onclick={openCreateDraftModal}>
						<Plus class="h-4 w-4" />
						Create Draft
					</Button>
				</div>
			{:else}
				<div
					class="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-border bg-surface/50 p-12 text-center"
				>
					<div class="rounded-3xl bg-info/10 p-6 text-info">
						<BookOpen class="h-12 w-12" />
					</div>
					<h2 class="mt-6 text-2xl font-bold text-text">Select a department</h2>
					<p class="mt-2 max-w-md text-text-muted">
						Choose a department on the left to review handbook versions and manage draft actions.
					</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<CreateDraftModal
	bind:open={isDraftModalOpen}
	{draftModalMode}
	{draftModalError}
	departments={handbookData.departments}
	bind:createDraftDepartmentId
	bind:createDraftTitle
	bind:createDraftDescription
	{draftTitleError}
	{canSubmitDraft}
	{isSubmittingDraft}
	onSubmit={() => void handleSubmitDraft()}
/>

<EditMetadataModal
	bind:open={isMetadataModalOpen}
	{metadataModalError}
	bind:metadataTitle
	bind:metadataDescription
	{metadataTitleError}
	{canSaveMetadata}
	{isUpdatingTemplate}
	onSubmit={() => void handleUpdateTemplateMetadata()}
/>

<StepEditorModal
	bind:open={isStepModalOpen}
	{stepModalMode}
	{stepModalError}
	bind:stepForm
	{stepTitleError}
	{stepLinkUrlError}
	{stepQuizQuestionError}
	{stepQuizOptionsError}
	{stepQuizCorrectOptionError}
	{canSubmitStep}
	{isSubmittingStep}
	onSubmit={() => void handleSubmitStep()}
/>

<DeleteStepModal
	bind:open={isDeleteStepModalOpen}
	{deleteStepModalError}
	{stepPendingDelete}
	{isDeletingStep}
	onSubmit={() => void handleDeleteStep()}
/>

<PreviewModal
	bind:open={isPreviewOpen}
	{selectedDepartmentGroup}
	{selectedVersion}
	{selectedVersionSteps}
	onOpenExternalResource={openExternalResource}
/>

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={closeToast} />
