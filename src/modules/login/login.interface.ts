export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: any; // you can strongly type later
}