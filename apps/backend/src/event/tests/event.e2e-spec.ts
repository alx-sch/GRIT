import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { User, Event } from '@prisma/client';

/**
 * End-to-end tests for the Event module.
 * Seeds and cleans the database between tests.
 * Each test targets a single controller route and asserts both valid and invalid cases.
 */

describe('Events E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: User;
  let event: Event;

  // Setting up the environment ONCE at start.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  // Happens before each test (deletes and reseeds database).
  beforeEach(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Tester',
      },
    });

    event = await prisma.event.create({
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
  });

  // Test 1: Delete an event
  it('DELETE /events/:id deletes event from DB', async () => {
    const res = await request(app.getHttpServer()).delete(`/events/${event.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: event.id,
      title: 'Hello E2E',
      authorId: user.id,
    });

    const res2 = await request(app.getHttpServer()).delete(`/events/${10}`).expect(404);

    expect(res2.body).to;
  });

  // Test 2: Get an individual event by id
  it('GET /events/:id returns event from DB', async () => {
    const res = await request(app.getHttpServer()).get(`/events/${event.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: event.id,
      authorId: user.id,
      title: 'Hello E2E',
    });
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
