import type { ApiEnvelope } from '$lib/types/api';
import type { Training, EmployeeTraining } from '$lib/types/api/trainingen';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockTrainings: Training[] = [
	{ id: 'tr-001', name: 'BHV Basis', description: 'Basisveiligheid en hulpverlening bij noodsituaties', category: 'veiligheid', duration_hours: 8, validity_months: 24, is_mandatory: true, is_active: true },
	{ id: 'tr-002', name: 'AGGRESSIETRAINING', description: 'Omgaan met agressie en conflicthantering', category: 'veiligheid', duration_hours: 16, validity_months: 12, is_mandatory: true, is_active: true },
	{ id: 'tr-003', name: 'Medicatie', description: 'Verantwoord medicatiebeheer en -toediening', category: 'zorg', duration_hours: 8, validity_months: 12, is_mandatory: true, is_active: true },
	{ id: 'tr-004', name: 'Geef me de 5', description: 'Methodiek voor duidelijkheid en voorspelbaarheid bij jeugdigen', category: 'zorg', duration_hours: 12, validity_months: 24, is_mandatory: false, is_active: true },
	{ id: 'tr-005', name: 'Nieuwe Autoriteit', description: 'Geweldloos verzet in de opvoeding', category: 'zorg', duration_hours: 16, validity_months: 24, is_mandatory: false, is_active: true },
	{ id: 'tr-006', name: 'Omgaan met trauma', description: 'Herkennen en omgaan met getraumatiseerde jeugdigen', category: 'zorg', duration_hours: 24, validity_months: 36, is_mandatory: false, is_active: true },
	{ id: 'tr-007', name: 'EHBO Jeugd', description: 'Eerste hulp bij ongevallen bij kinderen', category: 'veiligheid', duration_hours: 8, validity_months: 24, is_mandatory: true, is_active: true },
	{ id: 'tr-008', name: 'Digitale Veiligheid', description: 'Veilig omgaan met digitale systemen en data', category: 'technisch', duration_hours: 4, validity_months: 12, is_mandatory: true, is_active: true },
	{ id: 'tr-009', name: 'Leiderschapstraject', description: 'Ontwikkelen van leiderschapsvaardigheden', category: 'management', duration_hours: 40, validity_months: null, is_mandatory: false, is_active: true },
	{ id: 'tr-010', name: 'Feedback & Reflectie', description: 'Effectief feedback geven en ontvangen', category: 'communicatie', duration_hours: 8, validity_months: null, is_mandatory: false, is_active: true }
];

const mockEmployeeTrainings: EmployeeTraining[] = [
	// BHV - many assigned, various statuses
	{ id: 'et-001', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-001', training_name: 'BHV Basis', training_category: 'veiligheid', completed_date: '2025-09-15', expiry_date: '2027-09-15', status: 'completed', notes: null },
	{ id: 'et-002', employee_id: 'emp-002', employee_name: 'Ahmed El Amrani', employee_department: 'Zorg', training_id: 'tr-001', training_name: 'BHV Basis', training_category: 'veiligheid', completed_date: '2024-03-10', expiry_date: '2026-03-10', status: 'completed', notes: null },
	{ id: 'et-003', employee_id: 'emp-004', employee_name: 'Mohammed Hassan', employee_department: 'Zorg', training_id: 'tr-001', training_name: 'BHV Basis', training_category: 'veiligheid', completed_date: null, expiry_date: null, status: 'planned', notes: 'Ingepland april' },
	{ id: 'et-004', employee_id: 'emp-005', employee_name: 'Emma Bakker', employee_department: 'Zorg', training_id: 'tr-001', training_name: 'BHV Basis', training_category: 'veiligheid', completed_date: '2024-01-20', expiry_date: '2026-01-20', status: 'expired', notes: null },

	// Aggressietraining
	{ id: 'et-005', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-002', training_name: 'AGGRESSIETRAINING', training_category: 'veiligheid', completed_date: '2025-11-01', expiry_date: '2026-11-01', status: 'completed', notes: null },
	{ id: 'et-006', employee_id: 'emp-007', employee_name: 'Fatima Zorgman', employee_department: 'Zorg', training_id: 'tr-002', training_name: 'AGGRESSIETRAINING', training_category: 'veiligheid', completed_date: '2025-06-15', expiry_date: '2026-06-15', status: 'completed', notes: null },
	{ id: 'et-007', employee_id: 'emp-004', employee_name: 'Mohammed Hassan', employee_department: 'Zorg', training_id: 'tr-002', training_name: 'AGGRESSIETRAINING', training_category: 'veiligheid', completed_date: null, expiry_date: '2026-05-01', status: 'in_progress', notes: null },
	{ id: 'et-008', employee_id: 'emp-010', employee_name: 'Anna Jansen', employee_department: 'Administratie', training_id: 'tr-002', training_name: 'AGGRESSIETRAINING', training_category: 'veiligheid', completed_date: null, expiry_date: '2026-04-15', status: 'planned', notes: null },

	// Medicatie
	{ id: 'et-009', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-003', training_name: 'Medicatie', training_category: 'zorg', completed_date: '2025-12-01', expiry_date: '2026-12-01', status: 'completed', notes: null },
	{ id: 'et-010', employee_id: 'emp-002', employee_name: 'Ahmed El Amrani', employee_department: 'Zorg', training_id: 'tr-003', training_name: 'Medicatie', training_category: 'zorg', completed_date: '2025-08-20', expiry_date: '2026-08-20', status: 'completed', notes: null },
	{ id: 'et-011', employee_id: 'emp-005', employee_name: 'Emma Bakker', employee_department: 'Zorg', training_id: 'tr-003', training_name: 'Medicatie', training_category: 'zorg', completed_date: null, expiry_date: null, status: 'planned', notes: 'Nieuwe medewerker' },

	// Geef me de 5
	{ id: 'et-012', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-004', training_name: 'Geef me de 5', training_category: 'zorg', completed_date: '2025-10-15', expiry_date: '2027-10-15', status: 'completed', notes: null },
	{ id: 'et-013', employee_id: 'emp-007', employee_name: 'Fatima Zorgman', employee_department: 'Zorg', training_id: 'tr-004', training_name: 'Geef me de 5', training_category: 'zorg', completed_date: '2024-06-10', expiry_date: '2026-06-10', status: 'completed', notes: null },

	// EHBO
	{ id: 'et-014', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-007', training_name: 'EHBO Jeugd', training_category: 'veiligheid', completed_date: '2025-05-01', expiry_date: '2027-05-01', status: 'completed', notes: null },
	{ id: 'et-015', employee_id: 'emp-003', employee_name: 'Lisa van den Berg', employee_department: 'Administratie', training_id: 'tr-007', training_name: 'EHBO Jeugd', training_category: 'veiligheid', completed_date: '2025-11-20', expiry_date: '2027-11-20', status: 'completed', notes: null },

	// Digitale Veiligheid
	{ id: 'et-016', employee_id: 'emp-008', employee_name: 'Julia Smit', employee_department: 'HR', training_id: 'tr-008', training_name: 'Digitale Veiligheid', training_category: 'technisch', completed_date: '2026-01-15', expiry_date: '2027-01-15', status: 'completed', notes: null },
	{ id: 'et-017', employee_id: 'emp-001', employee_name: 'Sophie de Vries', employee_department: 'Zorg', training_id: 'tr-008', training_name: 'Digitale Veiligheid', training_category: 'technisch', completed_date: null, expiry_date: null, status: 'planned', notes: null },

	// Nieuwe Autoriteit
	{ id: 'et-018', employee_id: 'emp-007', employee_name: 'Fatima Zorgman', employee_department: 'Zorg', training_id: 'tr-005', training_name: 'Nieuwe Autoriteit', training_category: 'zorg', completed_date: '2025-09-01', expiry_date: '2027-09-01', status: 'completed', notes: null },

	// Omgaan met trauma
	{ id: 'et-019', employee_id: 'emp-002', employee_name: 'Ahmed El Amrani', employee_department: 'Zorg', training_id: 'tr-006', training_name: 'Omgaan met trauma', training_category: 'zorg', completed_date: '2025-04-15', expiry_date: '2028-04-15', status: 'completed', notes: null },
	{ id: 'et-020', employee_id: 'emp-005', employee_name: 'Emma Bakker', employee_department: 'Zorg', training_id: 'tr-006', training_name: 'Omgaan met trauma', training_category: 'zorg', completed_date: null, expiry_date: null, status: 'in_progress', notes: 'Module 3 van 5' },

	// Leiderschap
	{ id: 'et-021', employee_id: 'emp-007', employee_name: 'Fatima Zorgman', employee_department: 'Zorg', training_id: 'tr-009', training_name: 'Leiderschapstraject', training_category: 'management', completed_date: null, expiry_date: null, status: 'in_progress', notes: null },

	// Feedback
	{ id: 'et-022', employee_id: 'emp-008', employee_name: 'Julia Smit', employee_department: 'HR', training_id: 'tr-010', training_name: 'Feedback & Reflectie', training_category: 'communicatie', completed_date: null, expiry_date: null, status: 'planned', notes: null }
];

export function listMockTrainings() {
	return delay(300).then(
		() => ({ data: mockTrainings, success: true }) as ApiEnvelope<Training[]>
	);
}

export function listMockEmployeeTrainings() {
	return delay(400).then(
		() => ({ data: mockEmployeeTrainings, success: true }) as ApiEnvelope<EmployeeTraining[]>
	);
}
