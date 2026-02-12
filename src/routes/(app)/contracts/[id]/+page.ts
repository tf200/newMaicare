import { getContract } from '$lib/api/contracts';
import type {
	ContractCareType,
	ContractFinancingAct,
	ContractFinancingOption,
	ContractHoursType,
	ContractPriceTimeUnit,
	ContractStatus
} from '$lib/types/api';
import type { PageLoad } from './$types';

export interface ContractAttachmentView {
	id: string;
	name: string;
	size: number;
	downloadUrl: string;
}

export interface ContractDetailView {
	id: string;
	typeId: string | null;
	typeName: string | null;
	status: ContractStatus;
	approvedAt: string | null;
	startDate: string;
	endDate: string;
	reminderPeriod: number;
	vat: number | null;
	price: number;
	priceTimeUnit: ContractPriceTimeUnit;
	hours: number | null;
	hoursType: ContractHoursType | null;
	careName: string;
	careType: ContractCareType;
	attachmentIds: string[];
	financingAct: ContractFinancingAct;
	financingOption: ContractFinancingOption;
	departureReason: string | null;
	departureReport: string | null;
	updatedAt: string;
	createdAt: string;
	client: {
		id: string;
		firstName: string;
		lastName: string;
		fileNumber: string;
		bsn: string | null;
	};
	sender: {
		id: string;
		name: string;
		type: string;
		street: string | null;
		houseNumber: string | null;
		houseNumberAddition: string | null;
		postalCode: string | null;
		city: string | null;
		land: string | null;
		kvkNumber: string | null;
		btwNumber: string | null;
		phoneNumber: string | null;
		clientNumber: string | null;
		emailAddress: string | null;
	};
	attachments: ContractAttachmentView[];
}

export interface ContractDetailLoadResult {
	contract: ContractDetailView | null;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const contractData: Promise<ContractDetailLoadResult> = getContract(params.id)
		.then((response) => {
			const raw = response.data;

			return {
				contract: {
					id: raw.id,
					typeId: raw.type_id,
					typeName: raw.type_name,
					status: raw.status,
					approvedAt: raw.approved_at,
					startDate: raw.start_date,
					endDate: raw.end_date,
					reminderPeriod: raw.reminder_period,
					vat: raw.VAT,
					price: raw.price,
					priceTimeUnit: raw.price_time_unit,
					hours: raw.hours,
					hoursType: raw.hours_type,
					careName: raw.care_name,
					careType: raw.care_type,
					attachmentIds: raw.attachment_ids,
					financingAct: raw.financing_act,
					financingOption: raw.financing_option,
					departureReason: raw.departure_reason,
					departureReport: raw.departure_report,
					updatedAt: raw.updated_at,
					createdAt: raw.created_at,
					client: {
						id: raw.client_id,
						firstName: raw.client_first_name,
						lastName: raw.client_last_name,
						fileNumber: raw.client_filenumber,
						bsn: raw.client_bsn
					},
					sender: {
						id: raw.sender_id,
						name: raw.sender_name,
						type: raw.sender_type,
						street: raw.sender_street,
						houseNumber: raw.sender_house_number,
						houseNumberAddition: raw.sender_house_number_addition,
						postalCode: raw.sender_postal_code,
						city: raw.sender_city,
						land: raw.sender_land,
						kvkNumber: raw.sender_kvknumber,
						btwNumber: raw.sender_btwnumber,
						phoneNumber: raw.sender_phone_number,
						clientNumber: raw.sender_client_number,
						emailAddress: raw.sender_email_address
					},
					attachments: (raw.attachments ?? []).map((attachment) => ({
						id: attachment.id,
						name: attachment.name,
						size: attachment.size,
						downloadUrl: attachment.download_url
					}))
				},
				loadError: null
			} satisfies ContractDetailLoadResult;
		})
		.catch(
			(error): ContractDetailLoadResult => ({
				contract: null,
				loadError: error instanceof Error ? error.message : 'Failed to load contract details.'
			})
		);

	return {
		contractData
	};
};
