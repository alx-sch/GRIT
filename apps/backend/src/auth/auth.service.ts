import { Injectable } from '@nestjs/common';
import { UserService } from '@/user/user.service';

type AuthInput = { email: string; password: string };
type SignInData = { userId: number; password: string };

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.userService.userGetById;
    return null;
  }
}
