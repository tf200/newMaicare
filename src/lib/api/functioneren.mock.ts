import type { ApiEnvelope } from '$lib/types/api';
import type {
	Assessment,
	AssessmentScore,
	WorkAssignment,
	PopConversation,
	Competency
} from '$lib/types/api/functioneren';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Competencies
// ---------------------------------------------------------------------------
const mockCompetencies: Competency[] = [
	{
		id: 'comp-01',
		name: 'Veilig leefklimaat',
		description: 'Bieden van een veilig en stabiel leefklimaat',
		category: 'Pedagogisch',
		is_active: true
	},
	{
		id: 'comp-02',
		name: 'ADL-begeleiding',
		description: 'Begeleiden van de dagelijkse leefsituatie',
		category: 'Pedagogisch',
		is_active: true
	},
	{
		id: 'comp-03',
		name: 'Ontwikkeling stimuleren',
		description: 'Stimuleren van ontwikkeling',
		category: 'Pedagogisch',
		is_active: true
	},
	{
		id: 'comp-04',
		name: 'Opvoeden en begrenzen',
		description: 'Opvoeden en begrenzen',
		category: 'Pedagogisch',
		is_active: true
	},
	{
		id: 'comp-05',
		name: 'Individuele begeleiding',
		description: 'Individuele begeleiding bieden',
		category: 'Pedagogisch',
		is_active: true
	},
	{
		id: 'comp-06',
		name: 'Samenwerken',
		description: "Samenwerken met collega's en externe partijen",
		category: 'Professioneel',
		is_active: true
	},
	{
		id: 'comp-07',
		name: 'Reflectie',
		description: 'Reflecteren op eigen handelen',
		category: 'Professioneel',
		is_active: true
	}
];

// ---------------------------------------------------------------------------
// Mock employees (subset for functioneren)
// ---------------------------------------------------------------------------
const mockEmployeeList = [
	{ id: 'emp-001', name: 'Sophie de Vries' },
	{ id: 'emp-002', name: 'Ahmed El Amrani' },
	{ id: 'emp-004', name: 'Mohammed Hassan' },
	{ id: 'emp-005', name: 'Emma Bakker' },
	{ id: 'emp-007', name: 'Fatima Zorgman' },
	{ id: 'emp-008', name: 'Julia Smit' },
	{ id: 'emp-010', name: 'Anna Jansen' }
];

// ---------------------------------------------------------------------------
// Mock Assessment Scores
// ---------------------------------------------------------------------------
function generateScores(assessmentId: string, seed: number): AssessmentScore[] {
	const domains = [
		'veilig-stabiel-leefklimaat',
		'adl-begeleiding',
		'stimuleren-ontwikkeling',
		'opvoeden-begrenzen',
		'individuele-begeleiding'
	];
	const itemsPerDomain = ['vsl', 'adl', 'so', 'ob', 'ib'];
	const remarksPool = [
		null,
		null,
		'Mag meer structuur bieden in de dagelijkse routines.',
		'Goede voortgang zichtbaar, blijven stimuleren.',
		'Nog extra aandacht nodig voor emotieregulatie.',
		null,
		'Uitstekende samenwerking met ouders.',
		'Kan nog meer gebruikmaken van methodische interventies.',
		null,
		null
	];
	const scores: AssessmentScore[] = [];
	let scoreId = 1000 + seed * 100;

	for (let d = 0; d < domains.length; d++) {
		for (let q = 1; q <= 5; q++) {
			const baseRating = 5 + (seed % 4);
			const variation = ((q * 7 + d * 3 + seed) % 5) - 1;
			const rating = Math.min(10, Math.max(3, baseRating + variation));
			scores.push({
				id: `score-${scoreId++}`,
				assessment_id: assessmentId,
				domain_id: domains[d],
				item_id: `${itemsPerDomain[d]}-${q}`,
				rating,
				remarks: remarksPool[(q + d + seed) % remarksPool.length]
			});
		}
	}
	return scores;
}

// ---------------------------------------------------------------------------
// Mock Assessments
// ---------------------------------------------------------------------------
const mockAssessments: Assessment[] = [
	{
		id: 'assess-001',
		employee_id: 'emp-001',
		assessment_date: '2026-02-15',
		total_score: 7.4,
		status: 'completed',
		notes:
			'Sophie laat zien dat ze goed kan omgaan met complexe situaties. Aandachtspunt: meer structuur bieden in de ochtendroutine.',
		created_at: '2026-02-15T10:00:00Z',
		employee: { id: 'emp-001', name: 'Sophie de Vries' },
		scores: generateScores('assess-001', 1)
	},
	{
		id: 'assess-002',
		employee_id: 'emp-002',
		assessment_date: '2026-01-20',
		total_score: 6.8,
		status: 'completed',
		notes: 'Ahmed werkt goed samen met het team. Kan nog stappen zetten in het methodisch werken.',
		created_at: '2026-01-20T14:00:00Z',
		employee: { id: 'emp-002', name: 'Ahmed El Amrani' },
		scores: generateScores('assess-002', 2)
	},
	{
		id: 'assess-003',
		employee_id: 'emp-004',
		assessment_date: '2025-12-10',
		total_score: 8.1,
		status: 'completed',
		notes:
			'Mohammed excelleert in het bieden van emotionele veiligheid. Blijven inzetten op cognitieve ontwikkeling.',
		created_at: '2025-12-10T09:00:00Z',
		employee: { id: 'emp-004', name: 'Mohammed Hassan' },
		scores: generateScores('assess-003', 3)
	},
	{
		id: 'assess-004',
		employee_id: 'emp-005',
		assessment_date: '2026-03-01',
		total_score: 5.9,
		status: 'completed',
		notes:
			'Emma heeft nog extra ondersteuning nodig bij het begrenzen en het hanteren van conflicten.',
		created_at: '2026-03-01T11:00:00Z',
		employee: { id: 'emp-005', name: 'Emma Bakker' },
		scores: generateScores('assess-004', 4)
	},
	{
		id: 'assess-005',
		employee_id: 'emp-007',
		assessment_date: '2025-11-05',
		total_score: 7.9,
		status: 'completed',
		notes: "Fatima toont veel ervaring en kan goed als mentor fungeren voor jongere collega's.",
		created_at: '2025-11-05T15:00:00Z',
		employee: { id: 'emp-007', name: 'Fatima Zorgman' },
		scores: generateScores('assess-005', 5)
	},
	{
		id: 'assess-006',
		employee_id: 'emp-008',
		assessment_date: '2026-02-28',
		total_score: null,
		status: 'draft',
		notes: null,
		created_at: '2026-02-28T16:00:00Z',
		employee: { id: 'emp-008', name: 'Julia Smit' },
		scores: []
	},
	{
		id: 'assess-007',
		employee_id: 'emp-010',
		assessment_date: '2025-10-15',
		total_score: 6.5,
		status: 'completed',
		notes:
			'Anna maakt goede voortgang sinds de vorige beoordeling. Blijven focussen op zelfredzaamheid.',
		created_at: '2025-10-15T10:00:00Z',
		employee: { id: 'emp-010', name: 'Anna Jansen' },
		scores: generateScores('assess-007', 7)
	}
];

// ---------------------------------------------------------------------------
// Mock Work Assignments
// ---------------------------------------------------------------------------
const mockWorkAssignments: WorkAssignment[] = [
	{
		id: 'wa-001',
		assessment_id: 'assess-004',
		employee_id: 'emp-005',
		question_id: 'ob-1',
		domain_id: 'opvoeden-begrenzen',
		question_text:
			'Positief en constructief corrigeren: Focus leggen op gewenst gedrag in plaats van alleen op het ongewenste.',
		score: 4,
		assignment_description:
			'Reflecteer op het gebied van begrenzen waar je onvoldoende hebt gescoord.\n\nOpdracht:\n1. Beschrijf concreet wat je hebt gedaan op dit gebied\n2. Analyseer waarom dit nog niet op niveau is\n3. Benoem 3 concrete verbeteracties\n4. Geef aan hoe je voortgang meet',
		improvement_notes: 'Let op de-escalerende technieken bij conflicten.',
		expectations:
			'Binnen 2 weken: reflectieverslag.\nBinnen 4 weken: meetbare verbetering.\nBinnen 6 weken: minimaal voldoende score.',
		advice: 'Focus op positieve bekrachtiging. Oefen met Nieuwe Autoriteit technieken.',
		due_date: '2026-03-15',
		status: 'open',
		submitted_at: null,
		submission_text: null,
		feedback: null,
		reviewed_at: null,
		employee: { id: 'emp-005', name: 'Emma Bakker' }
	},
	{
		id: 'wa-002',
		assessment_id: 'assess-004',
		employee_id: 'emp-005',
		question_id: 'so-2',
		domain_id: 'stimuleren-ontwikkeling',
		question_text:
			'Emotieregulatie versterken: Helpen bij het herkennen, benoemen en constructief uiten van emoties.',
		score: 5,
		assignment_description:
			'Reflecteer op het gebied van emotieregulatie.\n\nOpdracht:\n1. Beschrijf je aanpak bij emotionele situaties\n2. Zoek verbeterpunten\n3. Maak een actieplan',
		improvement_notes: null,
		expectations: 'Binnen 4 weken: aantoonbare verbetering.',
		advice: 'Gebruik gevoelsthermometer. Oefen dagelijks met de jeugdigen.',
		due_date: '2026-03-15',
		status: 'submitted',
		submitted_at: '2026-03-10T14:00:00Z',
		submission_text:
			'Ik heb de afgelopen twee weken dagelijks de gevoelsthermometer ingezet. Bij 3 jeugdigen zie ik dat ze beter kunnen benoemen wat ze voelen.',
		feedback: null,
		reviewed_at: null,
		employee: { id: 'emp-005', name: 'Emma Bakker' }
	},
	{
		id: 'wa-003',
		assessment_id: 'assess-002',
		employee_id: 'emp-002',
		question_id: 'ib-5',
		domain_id: 'individuele-begeleiding',
		question_text: 'Systemisch werken: De begeleiding afstemmen op het grotere geheel.',
		score: 4,
		assignment_description:
			'Reflecteer op systemisch werken.\n\nOpdracht:\n1. Beschrijf je huidige aanpak\n2. Analyseer verbeterpunten\n3. Maak een plan',
		improvement_notes: 'Maak meer verbinding tussen groep, school en thuis.',
		expectations: 'Binnen 6 weken: voldoende score.',
		advice: 'Plan maandelijks een MDO. Betrek ouders actiever.',
		due_date: '2026-02-20',
		status: 'approved',
		submitted_at: '2026-02-18T10:00:00Z',
		submission_text:
			"Ik heb twee MDO's bijgewoond en een oudergesprek gevoerd. De lijnen zijn nu korter.",
		feedback: 'Goede verbetering zichtbaar. Blijf dit vasthouden.',
		reviewed_at: '2026-02-19T09:00:00Z',
		employee: { id: 'emp-002', name: 'Ahmed El Amrani' }
	},
	{
		id: 'wa-004',
		assessment_id: 'assess-007',
		employee_id: 'emp-010',
		question_id: 'so-3',
		domain_id: 'stimuleren-ontwikkeling',
		question_text: 'Zelfredzaamheid vergroten: Stapsgewijs verantwoordelijkheid geven.',
		score: 3,
		assignment_description:
			'Reflecteer op het vergroten van zelfredzaamheid.\n\nOpdracht:\n1. Beschrijf concrete situaties\n2. Analyseer waar het beter kan\n3. Maak een stappenplan',
		improvement_notes: 'Te veel overgenomen van de jeugdigen.',
		expectations: 'Binnen 2 weken: reflectieverslag.\nBinnen 4 weken: verbetering.',
		advice: 'Gebruik de "laat maar doen" methodiek. Bouw stapsgewijs af.',
		due_date: '2026-02-01',
		status: 'revision_needed',
		submitted_at: '2026-01-28T11:00:00Z',
		submission_text:
			'Ik heb geprobeerd meer los te laten maar sommige jeugdigen zijn nog niet toe aan meer zelfstandigheid.',
		feedback:
			'Je reflectie is te algemeen. Geef concrete voorbeelden van situaties waar je hebt losgelaten en wat het resultaat was.',
		reviewed_at: '2026-01-30T14:00:00Z',
		employee: { id: 'emp-010', name: 'Anna Jansen' }
	}
];

// ---------------------------------------------------------------------------
// Mock POP Conversations
// ---------------------------------------------------------------------------
const mockConversations: PopConversation[] = [
	{
		id: 'pop-001',
		employee_id: 'emp-001',
		conversation_date: '2026-01-10',
		conversation_type: 'evaluatie',
		goals: 'Doorgroeien naar senior jeugdwerker. Meer verantwoordelijkheid in groepsleiding.',
		agreements:
			'Start met coaching opleiding in Q2. Maandelijks voortgangsgesprek met leidinggevende.',
		development_points: 'Methodisch werken verdiepen. Meer gebruik maken van Geef me de 5.',
		strengths:
			'Uitstekende relatie met jeugdigen. Goede intuïtie voor signalering. Creatieve oplossingen.',
		notes: 'Sophie is zeer gemotiveerd en toont eigenaarschap.',
		next_conversation_date: '2026-07-10',
		status: 'afgerond',
		employee: { id: 'emp-001', name: 'Sophie de Vries' }
	},
	{
		id: 'pop-002',
		employee_id: 'emp-002',
		conversation_date: '2026-02-05',
		conversation_type: 'tussentijds',
		goals: 'Verbeteren van verslaglegging. Meer aandacht voor systemisch werken.',
		agreements: "Wekelijks reflectieformulier invullen. Twee MDO's per maand bijwonen.",
		development_points: 'Verslaglegging. Samenwerking met externe partijen.',
		strengths: 'Goede band met jeugdigen. Rustige uitstraling.',
		notes: 'Ahmed heeft moeite met de administratieve kant maar doet zijn best.',
		next_conversation_date: '2026-08-05',
		status: 'afgerond',
		employee: { id: 'emp-002', name: 'Ahmed El Amrani' }
	},
	{
		id: 'pop-003',
		employee_id: 'emp-005',
		conversation_date: '2026-03-10',
		conversation_type: 'intake',
		goals: 'Inwerken in het team. De basisvaardigheden eigen maken binnen 3 maanden.',
		agreements: 'Dagelijkse buddy-check met ervaren collega. Wekelijks overleg met leidinggevende.',
		development_points: 'Begrenzen. Emotieregulatie. Omgaan met agressie.',
		strengths: 'Enthousiasme. Leergierigheid. Goede energie.',
		notes: 'Emma is nieuw in het team. Veel potentie maar nog onervaren.',
		next_conversation_date: '2026-04-10',
		status: 'gepland',
		employee: { id: 'emp-005', name: 'Emma Bakker' }
	},
	{
		id: 'pop-004',
		employee_id: 'emp-007',
		conversation_date: '2025-11-20',
		conversation_type: 'evaluatie',
		goals: 'Doorgroeien naar teamleider. Meer strategische betrokkenheid.',
		agreements: 'Start leiderschapstraject. Maandelijks strategisch overleg.',
		development_points: "Delegeren. Feedback geven aan collega's.",
		strengths: 'Ervaring. Rust. Diepgaande kennis van de doelgroep.',
		notes: 'Fatima is klaar voor de volgende stap. Organiseer het leiderschapstraject.',
		next_conversation_date: '2026-05-20',
		status: 'afgerond',
		employee: { id: 'emp-007', name: 'Fatima Zorgman' }
	}
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function listMockCompetencies() {
	return delay(200).then(
		() => ({ data: mockCompetencies, success: true }) as ApiEnvelope<Competency[]>
	);
}

export function listMockAssessments() {
	return delay(400).then(
		() => ({ data: mockAssessments, success: true }) as ApiEnvelope<Assessment[]>
	);
}

export function listMockAssessmentScores(assessmentId: string) {
	return delay(300).then(() => {
		const assessment = mockAssessments.find((a) => a.id === assessmentId);
		return {
			data: assessment?.scores ?? [],
			success: true
		} as ApiEnvelope<AssessmentScore[]>;
	});
}

export function listMockWorkAssignments() {
	return delay(350).then(
		() => ({ data: mockWorkAssignments, success: true }) as ApiEnvelope<WorkAssignment[]>
	);
}

export function listMockPopConversations() {
	return delay(300).then(
		() => ({ data: mockConversations, success: true }) as ApiEnvelope<PopConversation[]>
	);
}

export function listMockFunctionerenEmployees() {
	return delay(150).then(
		() => ({ data: mockEmployeeList, success: true }) as ApiEnvelope<typeof mockEmployeeList>
	);
}
