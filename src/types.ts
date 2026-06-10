export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  brand: string;
  stock: number;
  createdAt: number;
  updatedAt: number;
}

export interface Review {
  id: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: number;
}
