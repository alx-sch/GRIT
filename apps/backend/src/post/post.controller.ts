import { Controller, Get, Param, Post, Body, Put, Delete, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { Post as PostModel } from '../generated/prisma/client';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('posts/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel | null> {
    return this.postService.post({ id: Number(id) });
  }

  /*
   The endpoints 'posts' can deal as a search endpoint if the query string contains
   a search parameter e.g. /posts?search=world
  */
  @Get('posts')
  async getPosts(@Query('search') search?: string): Promise<PostModel[]> {
    if (search) return this.searchPublishedPosts(search);
    return this.getPublishedPosts();
  }

  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  async searchPublishedPosts(searchString: string): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
        AND: { published: true },
      },
    });
  }

  @Post('posts')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string }
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Put('posts/:id/publish')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
