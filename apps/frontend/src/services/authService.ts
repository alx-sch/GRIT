import api from '@/lib/api';
import { ResAuthLoginInput, ResAuthMeInput } from '@/types/auth';
import { LoginInput } from '@grit/schema';

export const authService = {
  login: async (reqBody: LoginInput): Promise<ResAuthLoginInput> => {
    const response = await api.post<ResAuthLoginInput>('/auth/login', reqBody);
    return response.data;
  },

  me: async (): Promise<ResAuthMeInput> => {
    const response = await api.get<ResAuthMeInput>('/auth/me');
    return response.data;
  },
};
