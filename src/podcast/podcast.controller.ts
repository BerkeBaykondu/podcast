import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Req } from '@nestjs/common'
import { PodcastService } from './podcast.service'

import { UpdatePodcastDto } from './interface/update-podcast.dto'
import { IPodcast } from './interface/podcast.interface'
import { TypedBody, TypedRoute } from '@nestia/core'

@Controller('podcast')
export class PodcastController {
  constructor(private readonly podcastService: PodcastService) {}

  @Get('fetchTrtPodcast')
  async fetchTrt() {
    return await this.podcastService.fetchTrtData()
  }

  @Get('userProfile/:id')
  async findPodcastByUser(id: String) {
    return await this.podcastService.findPodcastByUser(id)
  }

  @Get('withEpisode')
  findAll() {
    return this.podcastService.findAll()
  }
  @Get()
  findMainPage() {
    return this.podcastService.findMainPage()
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePodcastDto: UpdatePodcastDto) {
    return this.podcastService.update(+id, updatePodcastDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.podcastService.remove(+id)
  }
}
