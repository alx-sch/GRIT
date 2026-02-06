import {LocationService} from '@/location/location.service';
import {PrismaService} from '@/prisma/prisma.service';
import {StorageService} from '@/storage/storage.service';
import {NotFoundException, UnauthorizedException, BadRequestException} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';

import {EventService} from '../event.service';

describe('Event / Service / Unit Tests', () => {
  const prismaServiceMock = {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const storageServiceMock = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  let testEventService: EventService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule =
        await Test
            .createTestingModule({
              controllers: [],
              providers: [
                EventService,
                LocationService,
                {provide: PrismaService, useValue: prismaServiceMock},
                {provide: StorageService, useValue: storageServiceMock},
              ],
            })
            .compile();
    testEventService = moduleRef.get<EventService>(EventService);
  });

  describe('eventUpdateImage', () => {
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
      size: 1024,
    } as Express.Multer.File;

    it('throws NotFoundException when event does not exit', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue(null);
      await expect(testEventService.eventUpdateImage(999, 1, mockFile))
          .rejects.toThrow(NotFoundException);
    });

    it('throw UnauthorizedException when user does not own the event',
       async () => {
         prismaServiceMock.event.findUnique.mockResolvedValue({
           id: 1,
           authorId: 2,
           imageKey: null,
         });
         await expect(testEventService.eventUpdateImage(1, 1, mockFile))
             .rejects.toThrow(UnauthorizedException);
       });

    it('uploads image and updates event', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue({
        id: 1,
        authorId: 1,
        imageKey: null,
      });
      storageServiceMock.uploadFile.mockResolvedValue('new-image-key.jpg');
      prismaServiceMock.event.update.mockResolvedValue(
          {id: 1, imageKey: 'new-image-key.jpg'});
      const result = await testEventService.eventUpdateImage(1, 1, mockFile);

      expect(storageServiceMock.uploadFile)
          .toHaveBeenCalledWith(mockFile, 'event-images');
      expect(prismaServiceMock.event.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {imageKey: 'new-image-key.jpg'},
        include: expect.any(Object),
      });
      expect(result.imageKey).toBe('new-image-key.jpg');
    });

    it('deletes old image when replacing', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue({
        id: 1,
        authorId: 1,
        imageKey: 'old-image-key.jpg',
      });
      storageServiceMock.uploadFile.mockResolvedValue('new-image-key.jpg');
      prismaServiceMock.event.update.mockResolvedValue({
        id: 1,
        imageKey: 'new-image-key.jpg',
      });

      await testEventService.eventUpdateImage(1, 1, mockFile);

      expect(storageServiceMock.deleteFile)
          .toHaveBeenCalledWith('old-image-key.jpg', 'event-images');
    });
  });

  describe('eventDeleteImage', () => {
    it('throws NotFoundException when event does not exist', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue(null);

      await expect(testEventService.eventDeleteImage(999, 1))
          .rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when user does not own the event',
       async () => {
         prismaServiceMock.event.findUnique.mockResolvedValue({
           id: 1,
           authorId: 2,
           imageKey: 'some-key.jpg',
         });

         await expect(testEventService.eventDeleteImage(1, 1))
             .rejects.toThrow(UnauthorizedException);
       });

    it('throws BadRequestException when event has no image', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue({
        id: 1,
        authorId: 1,
        imageKey: null,
      });

      await expect(testEventService.eventDeleteImage(1, 1))
          .rejects.toThrow(BadRequestException);
    });

    it('deletes image from storage and updates database', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue({
        id: 1,
        authorId: 1,
        imageKey: 'image-to-delete.jpg',
      });
      prismaServiceMock.event.update.mockResolvedValue({
        id: 1,
        imageKey: null,
      });

      await testEventService.eventDeleteImage(1, 1);

      expect(storageServiceMock.deleteFile)
          .toHaveBeenCalledWith('image-to-delete.jpg', 'event-images');
      expect(prismaServiceMock.event.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {imageKey: null},
        include: expect.any(Object),
      });
    });
  });

  describe('Error Handling', () => {
    it('throws NotFoundException when event does not exist', async () => {
      prismaServiceMock.event.findUnique.mockResolvedValue(null);
      await expect(testEventService.eventGetById(42))
          .rejects.toThrow(NotFoundException);
    });
  });
});
