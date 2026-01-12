import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ReqLocationPostDto,
  ResLocationPostSchema,
  ResLocationGetAllSchema,
} from '@/location/location.schema';
import { LocationService } from '@/location/location.service';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ZodSerializerDto(ResLocationGetAllSchema)
  locationGet() {
    return this.locationService.locationGet();
  }

  @Post()
  @ZodSerializerDto(ResLocationPostSchema)
  locationPost(@Body() data: ReqLocationPostDto) {
    return this.locationService.locationPost(data);
  }
}
