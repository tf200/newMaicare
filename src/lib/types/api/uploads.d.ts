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
