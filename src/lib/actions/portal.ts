export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
	let targetEl: HTMLElement | null;

	async function update(newTarget: string | HTMLElement) {
		targetEl = typeof newTarget === 'string' ? document.querySelector(newTarget) : newTarget;
		if (targetEl) {
			targetEl.appendChild(node);
			node.hidden = false;
		}
	}

	update(target);

	return {
		update,
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}
