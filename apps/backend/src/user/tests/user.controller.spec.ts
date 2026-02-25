import { Test } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';

/**
 * CONTROLLER UNIT TESTING
 *
 * These tests verify that the controller:
 *  - Delegates to the correct UserService method.
 *  - Returns the value provided by the service.
 */

// Creates a mock date for the createdAt-field.
const mockDate = new Date();

// Create a mock return value of userGet
const allUsers = [
  { id: 1, createdAt: mockDate, email: 'alice@example.com', name: 'Alice' },
  { id: 2, createdAt: mockDate, email: 'bob@example.com', name: 'Bob' },
  { id: 3, createdAt: mockDate, email: 'cindy@example.com', name: 'Cindy' },
];

// Create a mock user service
const mockUserService = {
  userGet: jest.fn().mockResolvedValue(allUsers),
  userPost: jest.fn().mockImplementation((data: { name?: string; email: string }) => ({
    id: 1,
    createdAt: mockDate,
    ...data,
  })),
};

// Create the Nest testing module and replace the real UserService with a mock.
describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    userController = moduleRef.get<UserController>(UserController);
    userService = moduleRef.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  // Tests for the userGetAll controller path
  // Test 1: Verifies that the controller delegates the call to userService.userGet
  // Test 2: Verifies that the controller returns the value received from userService.userGet() and does not alter it.
  describe('Get all users', () => {
    // Test 1
    it('should call userService.userGet()', async () => {
      const spy = jest.spyOn(userService, 'userGet');
      await userController.userGetAll({ limit: 20 });
      expect(spy).toHaveBeenCalled();
    });

    // Test 2
    it('should return users from service', async () => {
      const result = await userController.userGetAll({ limit: 20 });
      expect(result).toEqual(allUsers);
    });
  });

  // Tests for the userPost controller path.
  // Test 1: Verifies that the controller delegates the call to userService.userPost. Also that it is called with correct argument.
  // Test 2: Verifies that the controller returns the value received from userService.userPost without altering it.
  describe('Create a user', () => {
    const testUser = {
      name: 'natalie',
      email: 'nat@gmail.com',
      password: 'SuperPassword3000',
    };

    // Test 1
    it('should call userService.userPost()', async () => {
      const spy = jest.spyOn(userService, 'userPost');
      await userController.userPost(testUser);
      expect(spy).toHaveBeenCalledWith(testUser);
    });

    // Test 2
    it('should return the created user', async () => {
      const result = await userController.userPost(testUser);
      expect(result).toEqual({
        id: 1,
        ...testUser,
        createdAt: mockDate,
      });
    });
  });
});
