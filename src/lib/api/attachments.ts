import { api } from './client';
import type {
	InitUploadRequest,
	InitUploadResponse,
	ConfirmUploadRequest,
	ConfirmUploadResponse,
	GetAttachmentResponse,
	ApiEnvelope
} from '$lib/types/api';

export class AttachmentService {
	/**
	 * Step 1: Initialize the upload with the backend
	 */
	static async initUpload(
		params: InitUploadRequest,
		signal?: AbortSignal
	): Promise<InitUploadResponse> {
		const response = await api.post<ApiEnvelope<InitUploadResponse>>(
			'/attachments/upload/init',
			params,
			{ signal }
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
		onProgress?: (progress: number) => void,
		signal?: AbortSignal
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			const abort = () => xhr.abort();

			xhr.open('PUT', url);
			xhr.setRequestHeader('Content-Type', file.type);

			if (onProgress) {
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentComplete = Math.round((event.loaded / event.total) * 100);
						onProgress(percentComplete);
					}
				};
			}

			xhr.onload = () => {
				signal?.removeEventListener('abort', abort);
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve();
				} else {
					reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
				}
			};

			xhr.onerror = () => {
				signal?.removeEventListener('abort', abort);
				reject(
					new Error(
						'Storage upload failed before the server responded. This usually means the storage bucket is rejecting the browser request because of CORS or upload endpoint configuration.'
					)
				);
			};
			xhr.onabort = () => {
				signal?.removeEventListener('abort', abort);
				reject(new DOMException('Upload aborted', 'AbortError'));
			};

			if (signal?.aborted) return xhr.abort();
			signal?.addEventListener('abort', abort, { once: true });
			xhr.send(file);
		});
	}

	/**
	 * Step 3: Confirm the upload with the backend
	 */
	static async confirmUpload(
		params: ConfirmUploadRequest,
		signal?: AbortSignal
	): Promise<ConfirmUploadResponse> {
		const response = await api.post<ApiEnvelope<ConfirmUploadResponse>>(
			'/attachments/upload/confirm',
			params,
			{ signal }
		);
		return response.data;
	}

	static async getAttachment(id: string): Promise<GetAttachmentResponse> {
		const response = await api.get<ApiEnvelope<GetAttachmentResponse>>(`/attachments/${id}`);
		return response.data;
	}

	/**
	 * Combined method to perform the full 3-step upload flow
	 */
	static async fullUploadFlow(
		file: File,
		onProgress?: (progress: number) => void,
		signal?: AbortSignal
	): Promise<ConfirmUploadResponse> {
		// Step 1: Init
		const initData = await AttachmentService.initUpload(
			{
				filename: file.name,
				content_type: file.type,
				size: file.size
			},
			signal
		);

		// Step 2: Storage
		await AttachmentService.uploadToStorage(initData.upload_url, file, onProgress, signal);

		// Step 3: Confirm
		return await AttachmentService.confirmUpload(
			{
				file_id: initData.file_id
			},
			signal
		);
	}
}
