import { GetUser } from '@/auth/guards/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  ReqLocationDeleteDto,
  ReqLocationGetAllDto,
  ReqLocationPostDto,
  ResLocationDeleteSchema,
  ResLocationGetAllSchema,
  ResLocationPostSchema,
  ResLocationAdminGetAllSchema,
} from '@/location/location.schema';
import { LocationService } from '@/location/location.service';
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { User } from '@/auth/interfaces/user.interface';

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
  locationDelete(@Param() param: ReqLocationDeleteDto, @GetUser() user: User) {
    return this.locationService.locationDelete({ id: param.id }, user);
  }

  // ADMIN -> Get ALL locations
  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResLocationAdminGetAllSchema)
  locationAdminGetAll(@GetUser() user: User) {
    return this.locationService.locationAdminGetAll(user);
  }
}
