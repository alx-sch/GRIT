import { Controller, Get, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API Root',
    description: 'Returns a simple welcome message to verify the server is running.',
  })
  @ApiResponse({ status: 200, description: 'Welcome message returned successfully.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiProduces('application/json')
  @ApiOperation({
    summary: 'System health check',
    description: 'Checks if the backend can reach PostgreSQL and MinIO.',
  })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'Service Unavailable' })
  async checkHealth(@Res() res: Response) {
    const health = await this.appService.getHealth();
    const status =
      health.postgres === 'UP' && health.minio === 'UP'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json(health);
  }
}
