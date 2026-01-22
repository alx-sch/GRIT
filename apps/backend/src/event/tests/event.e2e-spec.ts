import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * ========================================
 *                EVENTS E2E TESTS
 * ========================================
 *
 * End-to-end tests for the Event module.
 * Seeds and cleans the database between tests.
 * Each controller route has several tests to check valid and invalid cases.
 */

describe('Events E2E', () => {
  // Test environment variables
  let app: INestApplication;
  let prisma: PrismaService;

  // Declaring the types of user and event.
  type User = Prisma.UserGetPayload<{ include: { attending: true } }>;
  type Event = Prisma.EventGetPayload<{ include: { author: true } }>;

  // To store event, location and user (which are seeded in the database).
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
        name: 'Test User',
        password: 'password123',
      },
      include: {
        attending: true,
      },
    });

    event = await prisma.event.create({
      data: {
        author: { connect: { id: user.id } },
        content: 'Stored in DB',
        endAt: new Date('2025-01-01T20:00:00.000Z'),
        isPublished: true,
        isPublic: true,
        startAt: new Date('2025-01-01T20:00:00.000Z'),
        title: 'Hello E2E',
      },
      include: {
        author: true,
      },
    });
  });

  /**
   * ========================================
   *                 ACTUAL TESTS
   * ========================================
   * All tests below this point are testing
   * the Event controller endpoints.
   */

  // Delete an event
  describe('DELETE /events/:id', () => {
    it('deletes an existing event', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/events/${String(event.id)}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: event.id,
        title: 'Hello E2E',
        authorId: user.id,
      });
    });

    it('returns 404 for non-existing event', async () => {
      const res = await request(app.getHttpServer()).delete(`/events/200`).expect(404);

      expect(res.body).toStrictEqual({
        statusCode: 404,
        message: 'Event with id 200 not found',
        error: 'Not Found',
      });
    });
  });

  // Get an individual event by id
  describe('GET /events/:id', () => {
    it('returns an existing event', async () => {
      const res = await request(app.getHttpServer())
        .get(`/events/${String(event.id)}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: event.id,
        authorId: user.id,
        title: 'Hello E2E',
      });
    });

    it('returns 404 for non-existing event', async () => {
      const res = await request(app.getHttpServer()).get(`/events/200`).expect(404);

      expect(res.body).toStrictEqual({
        statusCode: 404,
        message: 'Event with id 200 not found',
        error: 'Not Found',
      });
    });
  });

  // Get all published events or search published events
  describe('GET /events', () => {
    it('returns all published events', async () => {
      const res = await request(app.getHttpServer()).get(`/events`).expect(200);

      expect(res.body).toMatchObject([
        {
          id: event.id,
          authorId: user.id,
          title: 'Hello E2E',
        },
      ]);
    });

    it('applies filters correctly and returns matching event', async () => {
      const res = await request(app.getHttpServer())
        .get('/events')
        .query({
          author_id: user.id,
          search: 'Hello',
          start_from: '2025-01-01',
          start_until: '2025-12-31',
        })
        .expect(200);

      expect(res.body).toMatchObject([
        {
          id: event.id,
          authorId: user.id,
          title: 'Hello E2E',
        },
      ]);
    });

    it('returns 400 for invalid query params', async () => {
      await request(app.getHttpServer()).get('/events').query({ randomValue: 2 }).expect(400);
    });
  });

  // Patch an event (Update)
  describe('PATCH /events/:id', () => {
    it('updates an existing event', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/events/${String(event.id)}`)
        .send({ title: 'Updated Hello E2E' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: event.id,
        authorId: user.id,
        title: 'Updated Hello E2E',
      });
    });

    it('returns 404 for non-existing event', async () => {
      await request(app.getHttpServer())
        .patch(`/events/200`)
        .send({ title: 'Updated Hello E2E' })
        .expect(404);
    });

    it('returns 404 for non-existing location', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/events/${String(event.id)}`)
        .send({ locationId: 1 })
        .expect(404);

      expect(res.body).toStrictEqual({
        statusCode: 404,
        message: 'Location with id 1 not found',
        error: 'Not Found',
      });
    });

    it('returns 400 for no provided fields to update (empty body)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/events/${String(event.id)}`)
        .send({})
        .expect(400);

      expect(res.body).toStrictEqual({
        statusCode: 400,
        message: 'No fields to update',
        error: 'Bad Request',
      });
    });
  });

  // Post a new event draft
  describe('POST /events', () => {
    it('posts a new event', async () => {
      const newEventData = {
        authorId: user.id,
        content: 'A new event stored in DB',
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
        title: 'Hello E2E, once again!',
      };

      const res = await request(app.getHttpServer()).post('/events').send(newEventData).expect(201);

      expect(res.body).toMatchObject({
        title: 'Hello E2E, once again!',
        authorId: user.id,
      });
    });

    it('returns 400 for bad request (title missing)', async () => {
      const newEventData = {
        authorId: user.id,
        content: 'A new event stored in DB',
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
      };

      await request(app.getHttpServer()).post('/events').send(newEventData).expect(400);
    });
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
