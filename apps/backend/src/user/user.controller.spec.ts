import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    userPost: jest.fn().mockResolvedValue({ success: true, id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call userPost on UserService', async () => {
    const reqBody = { name: 'John Doe', email: 'nat@gmail.com' }; // Mock input for userPost
    await controller.userPost(reqBody); // Assuming userPost exists in UserController

    // Verify if the userPost method was called with the correct argument
    expect(mockUserService.userPost).toHaveBeenCalledWith(reqBody);
  });
});
// it('should list all users' () => {

// });
// it('should create a user', () => {

// });
// });
