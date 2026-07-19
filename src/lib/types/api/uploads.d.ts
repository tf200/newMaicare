export interface InitUploadRequest {
	filename: string;
	content_type: string;
	size: number;
}

export interface InitUploadResponse {
	upload_url: string;
	file_id: string;
	key: string;
}

export interface ConfirmUploadRequest {
	file_id: string;
}

export interface ConfirmUploadResponse {
	file_url: string;
	file_id: string;
	created_at: string;
	size: number;
}

export interface GetAttachmentResponse {
	file_url: string;
	file_id: string;
	created_at: string;
	size: number;
}

export interface RegistrationUploadSessionResponse {
	registration_token: string;
}

export interface InitRegistrationUploadRequest {
	filename: string;
	content_type: 'application/pdf' | 'image/jpeg' | 'image/png';
	size: number;
}

export interface InitRegistrationUploadResponse {
	upload_url: string;
	file_id: string;
	key?: string;
}
