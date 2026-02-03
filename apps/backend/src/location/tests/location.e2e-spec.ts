import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * ========================================
 *           LOCATION E2E TESTS
 * ========================================
 *
 * End-to-end tests for the Location module.
 * Seeds and cleans the database between tests.
 * Each controller route has several tests to check valid and invalid cases.
 */

describe('Location E2E', () => {
  // Test environment variables
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Declaring the types of user, event, location.
  type User = Prisma.UserGetPayload<{ include: { attending: true } }>;
  type Event = Prisma.EventGetPayload<{ include: { author: true; location: true } }>;
  type Location = Prisma.LocationGetPayload<{ include: { author: true; events: true } }>;

  // To store event, location and user (which are seeded in the database).
  let user: User;
  let event: Event;
  let location: Location;

  // To store access token
  let token: string;

  // Setting up the environment ONCE at start.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  // Happens before each test (deletes and reseeds database).
  beforeEach(async () => {
    await prisma.event.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();

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

    location = await prisma.location.create({
      data: {
        isPublic: true,
        author: { connect: { id: user.id } },
        longitude: 42,
        latitude: 42,
        name: 'Test Location',
      },
      include: {
        events: true,
        author: true,
      },
    });

    event = await prisma.event.create({
      data: {
        author: { connect: { id: user.id } },
        location: { connect: { id: location.id } },
        content: 'Stored in DB',
        endAt: new Date('2025-01-01T20:00:00.000Z'),
        isPublished: true,
        isPublic: true,
        startAt: new Date('2025-01-01T20:00:00.000Z'),
        title: 'Test Event',
      },
      include: {
        author: true,
        location: true,
      },
    });
  });

  /**
   * ========================================
   *                 ACTUAL TESTS
   * ========================================
   * All tests below this point are testing
   * the Location controller endpoints.
   */

  // Get all locations
  describe('GET /locations', () => {
    it('returns all locations', async () => {
      const res = await request(app.getHttpServer()).get('/locations').expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ id: location.id })]),
          pagination: { hasMore: false, nextCursor: null },
        })
      );
    });

    it('returns all locations (checking if event is correctly added to events-array)', async () => {
      const res = await request(app.getHttpServer()).get('/locations').expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: location.id,
              events: expect.arrayContaining([
                expect.objectContaining({ id: event.id, title: event.title }),
              ]),
            }),
          ]),
          pagination: { hasMore: false, nextCursor: null },
        })
      );
    });

    it('returns new location (confirms sorted alphabetically) -> limit set to 1)', async () => {
      const location2 = await prisma.location.create({
        data: {
          isPublic: true,
          author: { connect: { id: user.id } },
          longitude: 42,
          latitude: 42,
          name: 'A location',
        },
        include: {
          events: true,
          author: true,
        },
      });
      const res = await request(app.getHttpServer())
        .get('/locations')
        .query({ limit: 1 })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(location2.id);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it('returns first location (confirms name=null gets placed last) -> limit set to 1)', async () => {
      await prisma.location.create({
        data: {
          isPublic: true,
          author: { connect: { id: user.id } },
          longitude: 42,
          latitude: 42,
        },
        include: {
          events: true,
          author: true,
        },
      });
      const res = await request(app.getHttpServer())
        .get('/locations')
        .query({ limit: 1 })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(location.id);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it('returns 400 for passing an invalid cursor', async () => {
      const res = await request(app.getHttpServer())
        .get('/locations')
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

  // Delete a location
  describe('DELETE /locations/:id', () => {
    it('deletes an existing location', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/locations/${String(location.id)}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: location.id,
        name: location.name,
      });
    });

    it('returns 404 for non-existing location', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/locations/200`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body).toStrictEqual({
        statusCode: 404,
        message: 'Location with id 200 not found',
        error: 'Not Found',
      });
    });

    it('returns 401 for unauthorized access', async () => {
      await request(app.getHttpServer())
        .delete(`/locations/${String(location.id)}`)
        .expect(401);
    });
  });

  // Post a location
  describe('POST /locations', () => {
    it('posts a new location', async () => {
      const newLocationData = {
        isPublic: true,
        longitude: 42,
        latitude: 42,
        name: 'Test Location 2',
      };

      const res = await request(app.getHttpServer())
        .post('/locations')
        .send(newLocationData)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toMatchObject({
        name: newLocationData.name,
        authorId: user.id,
      });
    });

    it('returns 400 for bad request (longitude missing)', async () => {
      const newLocationData = {
        isPublic: true,
        latitude: 42,
        name: 'Test Location 2',
      };

      await request(app.getHttpServer())
        .post('/locations')
        .send(newLocationData)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 for unauthorized access', async () => {
      const newLocationData = {
        isPublic: true,
        latitude: 42,
        name: 'Test Location 2',
      };
      await request(app.getHttpServer()).post('/locations').send(newLocationData).expect(401);
    });
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
