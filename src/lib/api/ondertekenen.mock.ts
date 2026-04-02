import type { ApiEnvelope } from '$lib/types/api';
import type { DocumentSignature } from '$lib/types/api/ondertekenen';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockDocumentSignatures: DocumentSignature[] = [
	{
		id: 'sig-001',
		employee_id: 'emp-001',
		employee_name: 'Sophie de Vries',
		employee_department: 'Zorg',
		document_type: 'contract',
		document_title: 'Arbeidsovereenkomst Sophie de Vries 2026',
		status: 'pending',
		requested_at: '2026-03-15T09:00:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: null,
		expires_at: '2026-04-15T23:59:59Z'
	},
	{
		id: 'sig-002',
		employee_id: 'emp-002',
		employee_name: 'Ahmed El Amrani',
		employee_department: 'Zorg',
		document_type: 'addendum',
		document_title: 'Addendum Werkuren Ahmed 2026',
		status: 'pending',
		requested_at: '2026-03-20T10:30:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: null,
		expires_at: '2026-04-20T23:59:59Z'
	},
	{
		id: 'sig-003',
		employee_id: 'emp-003',
		employee_name: 'Lisa van den Berg',
		employee_department: 'Administratie',
		document_type: 'policy',
		document_title: 'Vertrouwelijkheidsverklaring',
		status: 'signed',
		requested_at: '2026-02-10T08:00:00Z',
		signed_at: '2026-02-12T14:22:00Z',
		signature_hash: 'sha256-a1b2c3d4e5f6',
		rejection_reason: null,
		expires_at: null
	},
	{
		id: 'sig-004',
		employee_id: 'emp-004',
		employee_name: 'Mohammed Hassan',
		employee_department: 'Zorg',
		document_type: 'contract',
		document_title: 'Arbeidsovereenkomst Mohammed Hassan 2026',
		status: 'signed',
		requested_at: '2026-01-05T09:00:00Z',
		signed_at: '2026-01-06T11:45:00Z',
		signature_hash: 'sha256-f7g8h9i0j1k2',
		rejection_reason: null,
		expires_at: null
	},
	{
		id: 'sig-005',
		employee_id: 'emp-005',
		employee_name: 'Emma Bakker',
		employee_department: 'Zorg',
		document_type: 'policy',
		document_title: 'Gebruik van Persoonlijke Gegevens',
		status: 'rejected',
		requested_at: '2026-03-01T11:00:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason:
			'Inhoud is niet overeenkomstig mijn arbeidsvoorwaarden. Ik verzoek om overleg met HR.',
		expires_at: null
	},
	{
		id: 'sig-006',
		employee_id: 'emp-007',
		employee_name: 'Fatima Zorgman',
		employee_department: 'Zorg',
		document_type: 'agreement',
		document_title: 'Overeenkomst Studiekosten Fatima',
		status: 'pending',
		requested_at: '2026-03-25T08:30:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: null,
		expires_at: '2026-04-25T23:59:59Z'
	},
	{
		id: 'sig-007',
		employee_id: 'emp-008',
		employee_name: 'Julia Smit',
		employee_department: 'HR',
		document_type: 'policy',
		document_title: 'Privacyreglement Medewerkers 2026',
		status: 'signed',
		requested_at: '2026-02-20T09:00:00Z',
		signed_at: '2026-02-20T16:10:00Z',
		signature_hash: 'sha256-l3m4n5o6p7q8',
		rejection_reason: null,
		expires_at: null
	},
	{
		id: 'sig-008',
		employee_id: 'emp-006',
		employee_name: 'Jan de Groot',
		employee_department: 'Facilitair',
		document_type: 'termination',
		document_title: 'Beëindigingsovereenkomst Jan de Groot',
		status: 'rejected',
		requested_at: '2026-03-10T14:00:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: 'Ik wens juridisch advies in te winnen alvorens te tekenen.',
		expires_at: null
	},
	{
		id: 'sig-009',
		employee_id: 'emp-009',
		employee_name: 'Sander Peeters',
		employee_department: 'Zorg',
		document_type: 'contract',
		document_title: 'Contractverlenging Sander Peeters',
		status: 'expired',
		requested_at: '2026-01-15T09:00:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: null,
		expires_at: '2026-02-15T23:59:59Z'
	},
	{
		id: 'sig-010',
		employee_id: 'emp-010',
		employee_name: 'Anna Jansen',
		employee_department: 'Administratie',
		document_type: 'policy',
		document_title: 'Vertrouwelijkheidsverklaring',
		status: 'signed',
		requested_at: '2026-03-05T10:00:00Z',
		signed_at: '2026-03-06T09:15:00Z',
		signature_hash: 'sha256-r9s0t1u2v3w4',
		rejection_reason: null,
		expires_at: null
	},
	{
		id: 'sig-011',
		employee_id: 'emp-001',
		employee_name: 'Sophie de Vries',
		employee_department: 'Zorg',
		document_type: 'agreement',
		document_title: 'Geheimhoudingsovereenkomst Sophie de Vries',
		status: 'signed',
		requested_at: '2026-02-28T08:00:00Z',
		signed_at: '2026-03-01T10:30:00Z',
		signature_hash: 'sha256-x5y6z7a8b9c0',
		rejection_reason: null,
		expires_at: null
	},
	{
		id: 'sig-012',
		employee_id: 'emp-003',
		employee_name: 'Lisa van den Berg',
		employee_department: 'Administratie',
		document_type: 'other',
		document_title: 'Verklaring Goed Gedrag Lisa',
		status: 'expired',
		requested_at: '2026-01-10T09:00:00Z',
		signed_at: null,
		signature_hash: null,
		rejection_reason: null,
		expires_at: '2026-02-10T23:59:59Z'
	}
];

export function listMockDocumentSignatures() {
	return delay(350).then(
		() => ({ data: mockDocumentSignatures, success: true }) as ApiEnvelope<DocumentSignature[]>
	);
}
