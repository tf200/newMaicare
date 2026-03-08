import type { Handbook } from '$lib/types/handbook';

export const load = async () => {
	// Mock active handbook assignment
	const mockHandbook: Handbook = {
		handbook_id: 'hb-123',
		status: 'not_started',
		template_id: 'tmpl-456',
		template_title: 'Employee Handbook 2024',
		template_description:
			'Welcome to MaiCare! This handbook contains everything you need to know about our culture, policies, and procedures.',
		template_version: '1.2.0',
		department_id: 'dept-789',
		department_name: 'Care Coordination',
		steps: [
			{
				step_id: 'step-1',
				sort_order: 1,
				kind: 'content',
				title: 'Welcome to MaiCare',
				body: 'We are thrilled to have you on board. MaiCare is dedicated to providing the best care services in the region.',
				content:
					'<h1>Welcome to the Team!</h1><p>At MaiCare, we believe in people first. Our mission is to empower care providers and clients alike through technology and compassion.</p><p>This handbook will guide you through your first steps with us.</p>',
				is_required: true,
				status: 'not_started',
				started_at: null,
				completed_at: null,
				response: null
			},
			{
				step_id: 'step-2',
				sort_order: 2,
				kind: 'ack',
				title: 'Code of Conduct',
				body: 'Please read and acknowledge our code of conduct. It defines how we interact with each other and our clients.',
				content:
					'<h3>Our Core Values</h3><ul><li>Respect for everyone</li><li>Integrity in all actions</li><li>Excellence in care</li><li>Innovation in solutions</li></ul><p>By acknowledging this, you agree to uphold these values.</p>',
				is_required: true,
				status: 'not_started',
				started_at: null,
				completed_at: null,
				response: null
			},
			{
				step_id: 'step-3',
				sort_order: 3,
				kind: 'link',
				title: 'IT & Security Setup',
				body: 'Follow this link to set up your workstation, email, and security protocols.',
				content: 'https://security.maicare.com/onboarding-setup',
				is_required: true,
				status: 'not_started',
				started_at: null,
				completed_at: null,
				response: null
			},
			{
				step_id: 'step-4',
				sort_order: 4,
				kind: 'quiz',
				title: 'Quick Knowledge Check',
				body: 'A short quiz to ensure you have understood the core policies.',
				content: {
					questions: [
						{
							id: 'q1',
							text: "What is MaiCare's primary focus?",
							options: ['People', 'Technology', 'Profit', 'Compliance']
						},
						{
							id: 'q2',
							text: 'Who should you contact for IT support?',
							options: ['Your manager', 'The IT portal', 'The receptionist', 'Nobody']
						}
					]
				},
				is_required: true,
				status: 'not_started',
				started_at: null,
				completed_at: null,
				response: null
			}
		]
	};

	return {
		handbook: mockHandbook
	};
};
