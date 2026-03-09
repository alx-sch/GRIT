import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '@/mail/mail.service';
import { cleanDb } from '@/tests/utils/cleanDb';
import { StorageService } from '@/storage/storage.service';

/**
 * ========================================
 *           USER E2E TESTS
 * ========================================
 *
 * End-to-end tests for the User module.
 * Seeds the database ONCE before all tests start.
 * Each controller route has several tests to check valid and invalid cases.
 */

describe('User E2E', () => {
  // Test environment variables
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Declaring the types of user, event, location.
  type User = Prisma.UserGetPayload<{ include: { attending: true } }>;
  type Event = Prisma.EventGetPayload<{ include: { author: true } }>;

  // To store event and users (which are seeded in the database).
  let user1: User;
  let user2: User;
  let event: Event;

  // To store access tokens
  let token1: string;
  let token2: string;

  // Setting up the environment ONCE at start.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
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

    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Author of both events + has access token
    user1 = await prisma.user.create({
      data: {
        email: 'Alice@example.com',
        name: 'Alice',
        password: await bcrypt.hash('AlicePassword123', 10),
        isConfirmed: true,
      },
      include: {
        attending: true,
      },
    });

    // Does NOT have access token
    user2 = await prisma.user.create({
      data: {
        email: 'Bob@example.com',
        name: 'Bob',
        password: await bcrypt.hash('BobPassword123', 10),
        isConfirmed: true,
      },
      include: {
        attending: true,
      },
    });

    token1 = jwtService.sign({ sub: user1.id, email: user1.email }, { expiresIn: '7d' });
    token2 = 'fakeAccessToken';

    event = await prisma.event.create({
      data: {
        author: { connect: { id: user1.id } },
        content: 'Stored in DB',
        endAt: new Date('2025-01-01T20:00:00.000Z'),
        isPublished: true,
        isPublic: true,
        startAt: new Date('2025-01-01T20:00:00.000Z'),
        title: 'Alice Event 1',
        slug: 'alice-event-483828238',
        conversation: {
          create: {
            type: 'EVENT',
            createdBy: user1.id,
          },
        },
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
   * the User controller endpoints.
   */

  // Get all users
  describe('GET /users', () => {
    it('returns all users', async () => {
      const res = await request(app.getHttpServer()).get('/users').expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ id: user1.id }),
            expect.objectContaining({ id: user2.id }),
          ]),
          pagination: { hasMore: false, nextCursor: null },
        })
      );
    });

    it('returns first user (limit set to 1)', async () => {
      const res = await request(app.getHttpServer()).get('/users').query({ limit: 1 }).expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(user1.id);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it('returns 400 for passing an invalid cursor', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
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
  });

  // Create a user
  describe('POST auth/register', () => {
    it('posts a new user', async () => {
      const newUser = {
        email: 'David@example.com',
        name: 'David',
        password: 'DavidPassword123',
      };
      await request(app.getHttpServer()).post('/users').send(newUser).expect(201);
    });

    it('returns 400 for bad request (missing password)', async () => {
      const newUser = {
        email: 'David@example.com',
        name: 'David',
      };
      await request(app.getHttpServer()).post('/users').send(newUser).expect(400);
    });

    it('returns 409 for conflict (duplicate email)', async () => {
      const newUser = {
        email: 'David@example.com',
        name: 'David',
        password: 'DavidPassword123',
      };
      await request(app.getHttpServer()).post('/users').send(newUser).expect(409);
    });
  });

  // User attend event
  describe('PATCH /users/me', () => {
    it('return 200 (user1 attends event successfully)', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ attending: { connect: [event.id] } })
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('return 200 (user1 unattends event successfully)', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ attending: { disconnect: [event.id] } })
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('return 200 (user1 reattends event successfully)', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ attending: { connect: [event.id] } })
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('return 401 unauthorized access (no valid accesstoken)', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ attending: { connect: [event.id] } })
        .set('Authorization', `Bearer ${token2}`)
        .expect(401);
    });

    it('return 400 event not found', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ attending: { connect: [200] } })
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
      expect(res.body).toStrictEqual({
        message: 'One or more events not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  // Get my Events (Attending)
  describe('GET /users/me/events', () => {
    it('return 200 (user1 retrieves events successfully)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/events')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(res.body).toMatchObject([
        {
          title: event.title,
        },
      ]);
    });

    it('return 401 unauthorized access (no valid accesstoken)', async () => {
      await request(app.getHttpServer())
        .get('/users/me/events')
        .set('Authorization', `Bearer ${token2}`)
        .expect(401);
    });
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await cleanDb(prisma);
  });
});
