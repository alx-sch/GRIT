import { GetUser } from '@/auth/guards/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  ReqLocationDeleteDto,
  ReqLocationGetAllDto,
  ReqLocationPostDto,
  ResLocationDeleteSchema,
  ResLocationGetAllSchema,
  ResLocationPostSchema,
} from '@/location/location.schema';
import { LocationService } from '@/location/location.service';
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Get all locations
  @Get()
  @ZodSerializerDto(ResLocationGetAllSchema)
  locationGet(@Query() query: ReqLocationGetAllDto) {
    return this.locationService.locationGet(query);
  }

  // Post a location
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResLocationPostSchema)
  locationPost(@Body() data: ReqLocationPostDto, @GetUser('id') userId: number) {
    return this.locationService.locationPost(Object.assign(data, { authorId: userId }));
  }

  // Delete a location
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResLocationDeleteSchema)
  eventDelete(@Param() param: ReqLocationDeleteDto) {
    return this.locationService.locationDelete({ id: param.id });
  }
}
