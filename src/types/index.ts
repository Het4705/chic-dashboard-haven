
import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

// Export Timestamp type for use throughout the application
export type Timestamp = FirestoreTimestamp | Date | { seconds: number; nanoseconds: number };

export type User = {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  addresses?: Address[];
  favorites: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  UNISEX = "unisex"
}

export type SizeOption = {
  length: string;
  available: boolean;
};



export type Product = {
  id: string;
  name: string;
  price: number;
  images: string[]; 
  featuredProduct?: boolean; // Added featured product flag
  videoUrl?: string; // Added video URL field
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  material: string;
  stock: number;
  collectionId?: string; // Changed from array to single string
  gender: Gender; // Added gender/sex field
  discount?: {
    offerPercentage: number;
    validDate: Timestamp;
  };
  size: SizeOption[];
  reviews?: Review[];
};

export type Collection = {
  id: string;
  name: string;
  image: string;
  description: string;
  items: number;
  color: string;
};

export type Address = {
  id: string;
  userId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phoneNumber?: string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  phoneNumber: string;
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trackingNumber?: string;
};

export type OrderUpdate = {
  id:string;
  orderId:string;
  userId:string;
  updatedStatus: OrderStatus;
  acceptedByAdmin: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: Timestamp;
  approved: boolean;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
};

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export type Reel = {
  id: string
  src: string
  title: string
  description: string
  price?: string
  thumbnail?: string
  productId: string
  featured?: boolean; // Optional field to mark as featured
} 