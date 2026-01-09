import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from '../event.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Event / Service / Unit Tests', () => {
  const prismaServiceMock = {
    event: {
      findUnique: jest.fn(),
    },
  };

  let testEventService: EventService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        EventService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();
    testEventService = moduleRef.get<EventService>(EventService);
  });

  describe('Error Handling', () => {
    it('throws NotFoundException when event does not exist', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue(null);
      await expect(testEventService.eventGetById(42)).rejects.toThrow(NotFoundException);
    });
  });
});
