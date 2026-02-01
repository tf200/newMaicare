export interface PdokAddressLookupResult {
	street: string;
	city: string;
	displayName: string;
}

interface PdokResponseDoc {
	straatnaam?: string;
	woonplaatsnaam?: string;
	weergavenaam?: string;
}

interface PdokResponse {
	response?: {
		docs?: PdokResponseDoc[];
	};
}

const PDOK_BASE_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';

const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

export async function lookupAddressByPostcode(
	postalCode: string,
	houseNumber: string
): Promise<PdokAddressLookupResult | null> {
	const normalizedPostcode = normalizePostalCode(postalCode);
	const normalizedHouseNumber = houseNumber.trim();
	if (!normalizedPostcode || !normalizedHouseNumber) return null;

	const params = new URLSearchParams();
	params.set('q', `${normalizedPostcode} ${normalizedHouseNumber}`);
	params.set('fq', 'type:adres');
	params.set('fl', 'straatnaam,woonplaatsnaam,weergavenaam');
	params.set('rows', '1');

	const response = await fetch(`${PDOK_BASE_URL}?${params.toString()}`);
	if (!response.ok) {
		throw new Error('PDOK lookup failed');
	}

	const payload = (await response.json()) as PdokResponse;
	const doc = payload.response?.docs?.[0];
	if (!doc?.straatnaam || !doc?.woonplaatsnaam) return null;

	return {
		street: doc.straatnaam,
		city: doc.woonplaatsnaam,
		displayName: doc.weergavenaam ?? `${doc.straatnaam}, ${doc.woonplaatsnaam}`
	};
}
