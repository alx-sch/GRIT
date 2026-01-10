import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('Events E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  });

  it('GET /events/:id returns event from DB', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Tester',
      },
    });

    const event = await prisma.event.create({
      data: {
        authorId: user.id,
        content: 'Stored in DB',
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
        title: 'Hello E2E',
      },
    });
    const res = await request(app.getHttpServer()).get(`/events/${event.id}`).expect(200);

    expect(res.body).toEqual({
      author: {
        id: user.id,
        name: 'Tester',
      },
      authorId: user.id,
      content: 'Stored in DB',
      createdAt: expect.any(String),
      endAt: '2025-01-01T20:00:00.000Z',
      id: event.id,
      isPublic: true,
      isPublished: true,
      startAt: '2025-01-01T20:00:00.000Z',
      title: 'Hello E2E',
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
