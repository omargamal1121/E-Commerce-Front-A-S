export interface ProductImageDto {
  id: number;
  url: string;
  isMain?: boolean;
}

export interface ProductDto {
  id: number;
  name: string;
  description: string;
  subCategoryId: number;
  availableQuantity: number;
  price: number;
  finalPrice?: number;
  gender?: number | string;
  fitType?: string;
  discountPrecentage?: number;
  discountName?: string;
  discountStatus?: boolean;
  endAt?: string;
  isActive: boolean;
  isLiked: boolean;
  images?: ProductImageDto[];
  totalSold?: number;
  wishlistCount?: number;
}

export interface BestSellingProductDto extends ProductDto {
  productId: number;
  productName: string;
  image?: string;
  totalSoldQuantity: number;
  wishlistCount: number;
}
