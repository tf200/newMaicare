export interface BaseModel {
	id: string;
	createdAt: string;
	updatedAt: string;
}

export interface User extends BaseModel {
	email: string;
	firstName: string;
	lastName: string;
	role: 'admin' | 'user' | 'manager';
	avatarUrl?: string;
	isActive: boolean;
}

export interface Product extends BaseModel {
	name: string;
	description: string;
	price: number;
	sku: string;
	stock: number;
	category: string;
	imageUrl?: string;
}

export interface Order extends BaseModel {
	userId: string;
	status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
	total: number;
	items: OrderItem[];
}

export interface OrderItem {
	productId: string;
	quantity: number;
	price: number;
}
