export interface CustomerAddressDto {
  id: number;
  customerId: string;
  phoneNumber?: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  apartmentSuite?: string;
  postalCode?: string;
  addressType?: string;
  isDefault: boolean;
  additionalNotes?: string;
  fullAddress?: string;
}

export interface UserDto {
  id: string;
  userName?: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  isActive: boolean;
  isLock: boolean;
  isDeleted: boolean;
  lastVisit?: string;
  createAt: string;
  roles?: string[];
}

export interface UserWithAddressDto extends UserDto {
  customerAddresses?: CustomerAddressDto[];
}
