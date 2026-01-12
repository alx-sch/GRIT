import { Injectable } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { ReqAuthPostDto } from '@/auth/auth.schema';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async validateUser(data: ReqAuthPostDto) {
    const user = await this.userService.userGetByEmail(data.email);

    if (user && user.password == data.password) {
      return user;
    }
    return null;
  }
}
