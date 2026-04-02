export type AssessmentStatus = 'draft' | 'completed';
export type AssignmentStatus = 'open' | 'submitted' | 'approved' | 'revision_needed';
export type ConversationType = 'intake' | 'tussentijds' | 'evaluatie' | 'verzuimgesprek';

export interface Competency {
	id: string;
	name: string;
	description: string | null;
	category: string;
	is_active: boolean;
}

export interface AssessmentScore {
	id: string;
	assessment_id: string;
	domain_id: string;
	item_id: string;
	rating: number;
	remarks: string | null;
}

export interface Assessment {
	id: string;
	employee_id: string;
	assessment_date: string;
	total_score: number | null;
	status: AssessmentStatus;
	notes: string | null;
	created_at: string;
	employee?: { id: string; name: string };
	scores?: AssessmentScore[];
}

export interface WorkAssignment {
	id: string;
	assessment_id: string;
	employee_id: string;
	question_id: string;
	domain_id: string;
	question_text: string;
	score: number;
	assignment_description: string;
	improvement_notes: string | null;
	expectations: string | null;
	advice: string | null;
	due_date: string | null;
	status: AssignmentStatus;
	submitted_at: string | null;
	submission_text: string | null;
	feedback: string | null;
	reviewed_at: string | null;
	employee?: { id: string; name: string };
}

export interface PopConversation {
	id: string;
	employee_id: string;
	conversation_date: string;
	conversation_type: ConversationType;
	goals: string | null;
	agreements: string | null;
	development_points: string | null;
	strengths: string | null;
	notes: string | null;
	next_conversation_date: string | null;
	status: string;
	employee?: { id: string; name: string };
}

export interface AssessmentDomain {
	id: string;
	title: string;
	questions: { id: string; question: string }[];
}

export interface UpcomingAssessment {
	employeeId: string;
	employeeName: string;
	lastAssessmentDate: string;
	nextAssessmentDate: string;
	isOverdue: boolean;
	isDueSoon: boolean;
}
