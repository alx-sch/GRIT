import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '@/auth/auth.service';
import { MailService } from '@/mail/mail.service';
import { StorageService } from '@/storage/storage.service';

/**
 * ========================================
 *              AUTH E2E TESTS
 * ========================================
 *
 * End-to-end tests for the Auth module.
 * Seeds and cleans the database between tests.
 * Each controller route has several tests to check valid and invalid cases.
 */

describe('Auth E2E', () => {
  // Test environment variables
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authService: AuthService;

  // To store user (which are seeded in the database).
  type User = Prisma.UserGetPayload<{ include: { attending: true } }>;
  let user: User;

  // To store access token
  let token: string;

  // Setting up the environment ONCE at start.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }) // The two lines below to stop real emails from being sent
      .overrideProvider(MailService)
      .useValue({ sendConfirmationEmail: jest.fn().mockResolvedValue(undefined) })
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
    authService = moduleRef.get(AuthService);
  });

  // Happens before each test (deletes and reseeds database).
  beforeEach(async () => {
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
        isConfirmed: true,
      },
      include: {
        attending: true,
      },
    });
  });

  /**
   * ========================================
   *                 ACTUAL TESTS
   * ========================================
   * All tests below this point are testing
   * the Auth controller endpoints.
   */

  // Log in
  describe('POST /auth/login', () => {
    it('returns user info and accessToken upon successful login', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.id).toBe(user.id);
    });

    it('returns 401 for unauthorized access (wrong password)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'wrongpassword123' })
        .expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('returns 401 for unauthorized access (wrong email)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@email.com', password: 'password123' })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  // Get user info about logged in user (rehydration)
  describe('GET /auth/me', () => {
    it('returns user info', async () => {
      token = jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toStrictEqual({
        avatarKey: user.avatarKey,
        email: user.email,
        id: user.id,
        name: user.name,
        isConfirmed: true,
        attending: [],
      });
    });

    it('returns 401 for unauthorized access', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  // Get access token (debug mode)
  describe('GET /auth/debug/token/:id', () => {
    it('returns a valid accesstoken when not production', async () => {
      jest.spyOn(authService, 'isProduction').mockReturnValue(false);

      const res = await request(app.getHttpServer())
        .get(`/auth/debug/token/${String(user.id)}`)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.id).toBe(user.id);
    });

    it('returns 403 for forbidden access during production', async () => {
      jest.spyOn(authService, 'isProduction').mockReturnValue(true);

      await request(app.getHttpServer())
        .get(`/auth/debug/token/${String(user.id)}`)
        .expect(403);
    });

    it('returns 404 for user ID that does not exist', async () => {
      await request(app.getHttpServer()).get(`/auth/debug/token/100`).expect(404);
    });
  });

  // Happens after each test (makes sure the mock values are reset).
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Cleaning up the database and closes the app when tests are finished.
  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });
});
