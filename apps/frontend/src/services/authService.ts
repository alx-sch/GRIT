import api from '@/lib/api';
import { ResAuthLoginDto, FormAuthLoginDto, ResAuthMeDto } from '@/types/auth';

export const authService = {
  login: async (reqBody: FormAuthLoginDto): Promise<ResAuthLoginDto> => {
    console.log('trying with', reqBody);
    const response = await api.post<ResAuthLoginDto>('/auth/login', reqBody);
    return response.data;
  },

  me: async (): Promise<ResAuthMeDto> => {
    const response = await api.get<ResAuthMeDto>('/auth/me');
    return response.data;
  },
};
