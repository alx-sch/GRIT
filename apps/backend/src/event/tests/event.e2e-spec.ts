import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { cleanDb } from '@/tests/utils/cleanDb';
import { StorageService } from '@/storage/storage.service';

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
  let jwtService: JwtService;

  // Declaring the types of user and event.
  type User = Prisma.UserGetPayload<{ include: { attending: true } }>;
  type Event = Prisma.EventGetPayload<{ include: { author: true } }>;

  // To store event, location and user (which are seeded in the database).
  let user: User;
  let event: Event;

  // To store access token
  let token: string;

  // Setting up the environment ONCE at start.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        ensureBucket: jest.fn().mockResolvedValue(undefined),
        uploadBuffer: jest.fn().mockResolvedValue('mock-key'),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  // Happens before each test (deletes and reseeds database).
  beforeEach(async () => {
    await cleanDb(prisma);

    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
      },
      include: {
        attending: true,
      },
    });

    token = jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

    event = await prisma.event.create({
      data: {
        author: { connect: { id: user.id } },
        content: 'Stored in DB',
        endAt: new Date('2025-01-01T20:00:00.000Z'),
        isPublished: true,
        isPublic: true,
        startAt: new Date('2025-01-01T20:00:00.000Z'),
        title: 'Hello E2E',
        slug: 'hello-e2e-1234456',
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
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: event.id,
        title: event.title,
        authorId: user.id,
      });
    });

    it('returns 404 for non-existing event', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/events/200`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body).toStrictEqual({
        statusCode: 404,
        message: 'Event with id 200 not found',
        error: 'Not Found',
      });
    });

    it('returns 401 for unauthorized access', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${String(event.id)}`)
        .expect(401);
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
        title: event.title,
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

      expect(res.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ id: event.id, title: event.title, authorId: event.authorId }),
          ]),
          pagination: { hasMore: false, nextCursor: null },
        })
      );
    });

    it('returns 200, applies filters correctly and returns matching event', async () => {
      const res = await request(app.getHttpServer())
        .get('/events')
        .query({
          author_id: user.id,
          search: 'Hello',
          start_from: '2025-01-01',
          start_until: '2025-12-31',
        })
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ id: event.id, title: event.title, authorId: event.authorId }),
          ]),
          pagination: { hasMore: false, nextCursor: null },
        })
      );
    });

    it('returns first event (limit set to 1), cursor to next event is returned', async () => {
      await prisma.event.create({
        data: {
          author: { connect: { id: user.id } },
          content: 'Stored in DB',
          endAt: new Date('2025-01-01T20:00:00.000Z'),
          isPublished: true,
          isPublic: true,
          startAt: new Date('2025-01-01T20:00:00.000Z'),
          title: 'Hello E2E again',
          slug: 'hello-e2e-again-1234456',
        },
        include: {
          author: true,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/events')
        .query({
          limit: 1,
        })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(event.id);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it('returns 400 for passing an invalid cursor', async () => {
      const res = await request(app.getHttpServer())
        .get('/events')
        .query({
          cursor: 'random-shit',
        })
        .expect(400);

      expect(res.body).toStrictEqual({
        error: 'Bad Request',
        message: 'Invalid cursor provided',
        statusCode: 400,
      });
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
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 404 for non-existing location', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/events/${String(event.id)}`)
        .send({ locationId: 1 })
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toStrictEqual({
        statusCode: 400,
        message: 'No fields to update',
        error: 'Bad Request',
      });
    });

    it('returns 401 for unauthorized access', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${String(event.id)}`)
        .send({ title: 'Updated Hello E2E' })
        .expect(401);
    });
  });

  // Post a new event draft
  describe('POST /events', () => {
    it('posts a new event', async () => {
      const newEventData = {
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
        title: 'Hello E2E, once again!',
      };

      const res = await request(app.getHttpServer())
        .post('/events')
        .send(newEventData)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Hello E2E, once again!',
        authorId: user.id,
      });
    });

    it('returns 400 for bad request (title missing)', async () => {
      const newEventData = {
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(newEventData)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 for unauthorized access', async () => {
      const newEventData = {
        endAt: '2025-01-01T20:00:00.000Z',
        isPublished: true,
        isPublic: true,
        startAt: '2025-01-01T20:00:00.000Z',
        title: 'Hello E2E, once again!',
      };

      await request(app.getHttpServer()).post('/events').send(newEventData).expect(401);
    });
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
