// Order Item DTO
export interface OrderItemDto {
  id: number;
  createdAt: string;
  modifiedAt?: string;
  orderedAt: string;
  
  // Snapshotted fields - ALWAYS use these for rendering order history
  productName: string;
  imageUrl?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Live availability flags - use ONLY for "Buy Again" / "Reorder" actions
  isProductAvailable: boolean;
  isVariantAvailable: boolean;
}

// Payment DTO (Latest attempt)
export interface PaymentDto {
  id: number;
  status: string; // e.g., "Pending", "Completed", "Failed"
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
  paymentMethodId: number;
  paymentProviderId: number;
  providerOrderId?: number;
}

// Order Details DTO
export interface OrderDto {
  id: number;
  orderNumber: string;
  status: string; // "PendingPayment", "Processing", "Shipped", "Delivered", "CancelledByUser", etc.
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  modifiedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;

  // Customer & Address Info
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    customerAddress?: {
      id: number;
      streetAddress: string;
      city: string;
      country: string;
      state?: string;
      postalCode?: string;
      phoneNumber?: string;
      fullAddress?: string;
      apartmentSuite?: string;
      additionalNotes?: string;
    };
  } | null;

  // Items with snapshots
  items: OrderItemDto[];

  // Latest payment attempt
  payment?: PaymentDto[];
  
  // Quick status flags
  isCancelled: boolean;
  isDelivered: boolean;
  isShipped: boolean;
  canBeReturned: boolean;
  statusDisplay: string;
}

// Order List item (Summary view)
export interface OrderListDto {
  id: number;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt?: string;
  canBeCancelled: boolean;
  itemCount: number;
  paymentStatus: number | string;
  paymentMethod: string;
  imageurl: string; // Snapshot image from first order item
}
