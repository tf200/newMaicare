export type SignatureStatus = 'pending' | 'signed' | 'rejected' | 'expired';
export type DocumentType =
	| 'contract'
	| 'policy'
	| 'agreement'
	| 'addendum'
	| 'termination'
	| 'other';

export interface DocumentSignature {
	id: string;
	employee_id: string;
	employee_name: string;
	employee_department: string;
	document_type: DocumentType;
	document_title: string;
	status: SignatureStatus;
	requested_at: string;
	signed_at: string | null;
	signature_hash: string | null;
	rejection_reason: string | null;
	expires_at: string | null;
}
