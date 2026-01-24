import api from '@/lib/api';
import axios from 'axios';
import { ResAuthLoginDto, FormAuthLoginDto } from '@/types/login';

export const loginService = {
  login: async (reqBody: FormAuthLoginDto): Promise<ResAuthLoginDto> => {
    try {
      const response = await api.post<ResAuthLoginDto>('/auth/login', reqBody);
      return response.data;
    } catch (err) {
      // TODO Should add error mapping from Axios to custom error types
      throw err;
    }
  },
};
