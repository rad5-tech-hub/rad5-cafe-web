export type Product = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
};

export type BatchItem = {
  productId: string;
  quantity: number;
  productName: string;
  unitPrice: number;
};

export type BatchOrder = {
  id: string;
  customerName: string;
  items: BatchItem[];
};

export type LimboOrder = {
  id: string;
  receiptNumber: string;
  customerName: string;
  total: number;
  items: any[];
  createdAt: { _seconds: number; _nanoseconds: number } | string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
};

export type ReconciledOrder = {
  id: string;
  receiptNumber: string;
  status: string;
  paymentMethod: string;
  reconciliationStatus: string;
  reconciledBy: string;
  reconciledByName: string;
  userId: string;
  customerAccountName: string;
  walletId: string;
  subtotal: number;
  total: number;
  items: any[];
};
