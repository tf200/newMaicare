import { api } from './client';
import type {
	InitUploadRequest,
	InitUploadResponse,
	ConfirmUploadRequest,
	ConfirmUploadResponse,
	ApiEnvelope
} from '$lib/types/api';

export class AttachmentService {
	/**
	 * Step 1: Initialize the upload with the backend
	 */
	static async initUpload(params: InitUploadRequest): Promise<InitUploadResponse> {
		const response = await api.post<ApiEnvelope<InitUploadResponse>>(
			'/attachments/upload/init',
			params
		);
		return response.data;
	}

	/**
	 * Step 2: Upload the file directly to storage (S3/MinIO)
	 * Uses XMLHttpRequest for progress tracking
	 */
	static uploadToStorage(
		url: string,
		file: File,
		onProgress?: (progress: number) => void
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			xhr.open('PUT', url);

			if (onProgress) {
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentComplete = Math.round((event.loaded / event.total) * 100);
						onProgress(percentComplete);
					}
				};
			}

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve();
				} else {
					reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
				}
			};

			xhr.onerror = () => {
				reject(
					new Error(
						'Storage upload failed before the server responded. This usually means the storage bucket is rejecting the browser request because of CORS or upload endpoint configuration.'
					)
				);
			};

			xhr.send(file);
		});
	}

	/**
	 * Step 3: Confirm the upload with the backend
	 */
	static async confirmUpload(params: ConfirmUploadRequest): Promise<ConfirmUploadResponse> {
		const response = await api.post<ApiEnvelope<ConfirmUploadResponse>>(
			'/attachments/upload/confirm',
			params
		);
		return response.data;
	}

	/**
	 * Combined method to perform the full 3-step upload flow
	 */
	static async fullUploadFlow(
		file: File,
		onProgress?: (progress: number) => void
	): Promise<ConfirmUploadResponse> {
		// Step 1: Init
		const initData = await this.initUpload({
			filename: file.name,
			content_type: file.type,
			size: file.size
		});

		// Step 2: Storage
		await this.uploadToStorage(initData.upload_url, file, onProgress);

		// Step 3: Confirm
		return await this.confirmUpload({
			file_id: initData.file_id
		});
	}
}
