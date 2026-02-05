interface FloatingOptions {
	anchor: HTMLElement;
	offset?: number;
	align?: 'left' | 'right' | 'center';
	matchWidth?: boolean;
}

export function floating(node: HTMLElement, options: FloatingOptions) {
	function update() {
		const { anchor, offset = 8, align = 'left', matchWidth = false } = options;
		if (!anchor) return;

		const anchorRect = anchor.getBoundingClientRect();

		if (matchWidth) {
			node.style.width = `${anchorRect.width}px`;
		}

		const nodeRect = node.getBoundingClientRect();

		let top = anchorRect.bottom + offset;
		let left = anchorRect.left;

		if (align === 'right') {
			left = anchorRect.right - nodeRect.width;
		} else if (align === 'center') {
			left = anchorRect.left + (anchorRect.width - nodeRect.width) / 2;
		}

		// Prevent overflow
		const padding = 10;
		if (left < padding) left = padding;
		if (left + nodeRect.width > window.innerWidth - padding) {
			left = window.innerWidth - nodeRect.width - padding;
		}

		if (top + nodeRect.height > window.innerHeight - padding) {
			// Flip to top if no space
			top = anchorRect.top - nodeRect.height - offset;
		}

		node.style.position = 'fixed';
		node.style.top = `${top}px`;
		node.style.left = `${left}px`;
		node.style.width = 'auto'; // Let it take its natural width
	}

	// Wait for next frame to ensure node is rendered and has dimensions
	requestAnimationFrame(update);

	window.addEventListener('scroll', update, true);
	window.addEventListener('resize', update);

	const observer = new ResizeObserver(update);
	observer.observe(options.anchor);

	return {
		update(newOptions: FloatingOptions) {
			options = newOptions;
			update();
		},
		destroy() {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
			observer.disconnect();
		}
	};
}
