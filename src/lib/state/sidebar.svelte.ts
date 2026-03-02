export interface NavItem {
	label: string;
	href?: string;
	icon: any;
	permission?: string;
	children?: { label: string; href: string; permission?: string }[];
}

export interface SidebarConfig {
	items: NavItem[];
	title?: string;
	initials?: string;
}

class SidebarState {
	#scopedConfig = $state<SidebarConfig | null>(null);

	get scopedConfig() {
		return this.#scopedConfig;
	}

	setScopedSidebar(items: NavItem[], title?: string, initials?: string) {
		this.#scopedConfig = { items, title, initials };
	}

	clearScopedSidebar() {
		this.#scopedConfig = null;
	}
}

export const sidebarState = new SidebarState();
