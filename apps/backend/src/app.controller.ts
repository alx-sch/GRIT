import { Controller, Get, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth(@Res() res: Response) {
    const health = await this.appService.getHealth();
    const status =
      health.postgres === 'UP' && health.minio === 'UP'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json(health);
  }
}
