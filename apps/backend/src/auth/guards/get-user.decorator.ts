import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * GET USER DECORATOR
 * -------------------------------------------------------------------------
 * USAGE:
 * This is a custom tool used in Controller methods to quickly access
 * the logged-in user's data.
 *
 * Examples:
 * 1. userPost(@GetUser() user: any)       <- Gets the whole user object
 * 2. userPost(@GetUser('id') id: number)  <- Gets only the 'id' field
 *
 * HOW IT WORKS:
 * 1. The JwtStrategy validates the token and attaches the user to 'request.user'.
 * 2. This decorator "plucks" that user object out of the request.
 * 3. If you provide a 'data' string (like 'id'), it returns just that property.
 * -------------------------------------------------------------------------
 */

export const GetUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (data) {
    return request.user?.[data];
  }
  return request.user;
});
