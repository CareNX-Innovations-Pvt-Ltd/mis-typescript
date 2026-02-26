export interface IDistributorRegistration {
  id?: string;

  name: string;
  contactPerson: string;

  mobileNumber: string;
  email: string;

  street: string;
  contractStart: Date;

  contractEnd: Date;
  country: string;
  state: string;

  city: string;
}