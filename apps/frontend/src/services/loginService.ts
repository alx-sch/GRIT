import api from '@/lib/api';
import { ResAuthLoginDto, FormAuthLoginDto } from '@/types/login';

export const loginService = {
  login: async (reqBody: FormAuthLoginDto): Promise<ResAuthLoginDto> => {
    const response = await api.post<ResAuthLoginDto>('/auth/login', reqBody);
    return response.data;
  },
};
