import { AttachmentService } from '$lib/api/attachments';
import type { ConfirmUploadResponse } from '$lib/types/api';

export interface UploadState {
	id: string;
	file: File;
	progress: number;
	status: 'idle' | 'uploading' | 'completed' | 'error';
	error?: string;
	result?: ConfirmUploadResponse;
}

class UploadManager {
	#uploads = $state<UploadState[]>([]);

	get uploads() {
		return this.#uploads;
	}

	/**
	 * Start a new file upload
	 */
	async uploadFile(file: File): Promise<ConfirmUploadResponse> {
		const id = Math.random().toString(36).substring(7);
		const upload: UploadState = {
			id,
			file,
			progress: 0,
			status: 'uploading'
		};

		this.#uploads.push(upload);

		try {
			const result = await AttachmentService.fullUploadFlow(file, (progress) => {
				const index = this.#uploads.findIndex((u) => u.id === id);
				if (index !== -1) {
					this.#uploads[index].progress = progress;
				}
			});

			const index = this.#uploads.findIndex((u) => u.id === id);
			if (index !== -1) {
				this.#uploads[index].status = 'completed';
				this.#uploads[index].result = result;
				this.#uploads[index].progress = 100;
			}

			return result;
		} catch (err) {
			const index = this.#uploads.findIndex((u) => u.id === id);
			if (index !== -1) {
				this.#uploads[index].status = 'error';
				this.#uploads[index].error = err instanceof Error ? err.message : 'Unknown error';
			}
			throw err;
		}
	}

	/**
	 * Clear finished or errored uploads
	 */
	clear(id?: string) {
		if (id) {
			this.#uploads = this.#uploads.filter((u) => u.id !== id);
		} else {
			this.#uploads = this.#uploads.filter((u) => u.status === 'uploading');
		}
	}
}

export const uploadManager = new UploadManager();
