import { axiosClient } from '../api/axiosClient';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await axiosClient.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(fullName: string): Promise<User> {
    const response = await axiosClient.put<User>('/users/me', { fullName });
    return response.data;
  },
};
