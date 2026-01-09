import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../event.controller';
import { EventService } from '../event.service';
import { PrismaService } from '@grit_prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('EventController Tests', () => {
  /**
   * For unit tests we don't need to fire up the whole server. For each test, we create
   * the same limited dependency-injection container using Jest’s beforeEach. This
   * container instantiates only the listed controllers and providers and we can run
   * our unit tests on it.
   */

  // Create Mock Service
  const prismaServiceMock = {
    event: {
      findUnique: jest.fn(),
    },
  };

  let testEventController: EventController;
  beforeEach(async () => {
    jest.clearAllMocks();
    /**
     * Here we call the createTestingModule method of the Test class to create a new TestingModule
     * which we store in "app". During the creation we pass the controllers and providers we want
     * that testing module to have access to and then call the compile method on the TestingModule.
     */
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        EventService,
        // Replace normal Prisma Service with our Mock Service
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();
    /**
     * .get() is a method on the TestingModule instance stored in app. It performs a lookup in the Nest
     * dependency-injection container. The generic type argument <EventController> tells TypeScript what
     * type we expect back, and the function argument (EventController) is the runtime token used to
     * retrieve the instance.
     */
    testEventController = moduleRef.get<EventController>(EventController);
  });

  describe('Santiy Test', () => {
    it('1+1', () => {
      expect(1 + 1).toBe(2);
    });
  });

  // TODO Remove this test as we moved it to event.service.spec.ts
  describe('Throw Tests', () => {
    it('throws NotFoundException when event does not exist', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue(null);
      await expect(testEventController.eventGetById({ id: 42 })).rejects.toThrow(NotFoundException);
    });
  });
});
