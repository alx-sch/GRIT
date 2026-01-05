import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    userService = module.get(UserService);
    prismaService = module.get(PrismaService);
  });

  it('should return a user by id', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: new Date() };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

    const user = await userService.userGet();
    expect(user).toEqual(mockUser);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should create a new user', async () => {
    const newUser = { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: new Date() };
    jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);

    const user = await userService.userPost({ name: 'Bob', email: 'bob@example.com' });
    expect(user).toEqual(newUser);
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: { name: 'Bob', email: 'bob@example.com' },
    });
  });
});
