import { Query, Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import {
  ReqLocationPostDto,
  ResLocationPostSchema,
  ReqLocationGetAllDto,
  ResLocationGetAllSchema,
  ResLocationDeleteSchema,
  ReqLocationDeleteDto,
} from '@/location/location.schema';
import { LocationService } from '@/location/location.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';

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
    return this.locationService.locationPost({...data, authorId: userId});
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
