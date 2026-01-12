// src/types.ts
import { Timestamp } from 'firebase/firestore';

export interface KDSOrderItem {
    ticketItemId: string;
    baseName: string;
    details: {
        variantName?: string;
        selectedModifiers?: { name: string; price: number; group: string }[];
        modifiers?: { name: string; price: number; group: string }[];
    };
}

export interface KDSOrder {
  orderId: string;
  orderNumber: number;
  customerName?: string;
  status: string;         
  kitchenStatus?: string; 
  orderMode: string;
  createdAt: Timestamp; 
  items: KDSOrderItem[];
}