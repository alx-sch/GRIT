import { Body, Controller, Get, Post, Delete, Param } from '@nestjs/common';
import {
  ReqLocationPostDto,
  ResLocationPostSchema,
  ResLocationGetAllSchema,
  ResLocationDeleteSchema,
  ReqLocationDeleteDto,
} from '@/location/location.schema';
import { LocationService } from '@/location/location.service';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Get all locations
  @Get()
  @ZodSerializerDto(ResLocationGetAllSchema)
  locationGet() {
    return this.locationService.locationGet();
  }

  // Post a location
  @Post()
  @ZodSerializerDto(ResLocationPostSchema)
  locationPost(@Body() data: ReqLocationPostDto) {
    return this.locationService.locationPost(data);
  }

  // Delete a location
  @Delete(':id')
  @ZodSerializerDto(ResLocationDeleteSchema)
  eventDelete(@Param() param: ReqLocationDeleteDto) {
    return this.locationService.locationDelete({ id: param.id });
  }
}
