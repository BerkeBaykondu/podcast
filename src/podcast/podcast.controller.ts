import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Req, UseGuards, UploadedFile, UploadedFiles } from '@nestjs/common'
import { PodcastService } from './podcast.service'

import { UpdatePodcastDto } from './interface/update-podcast.dto'
import { IPodcast } from './interface/podcast.interface'
import { TypedBody, TypedRoute } from '@nestia/core'
import { AuthGuard } from '../core/guard/auth.guard'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { AwsService } from 'src/aws/aws.service'
import { FileTypePipe } from '../core/pipe/upload.pipe'

@Controller('podcast')
//@UseGuards(AuthGuard)
export class PodcastController {
  constructor(
    private readonly podcastService: PodcastService,
    private readonly awsService: AwsService,
  ) {}

  // Post Podcast
  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createEmptyPodcast(
    @UploadedFile()
    file: Express.Multer.File,
    @Body()
    createEmptyPodcastDto: IPodcast.IUploadPodcast,
    @Req() req,
  ) {
    return await this.awsService.createEmptyPodcast(file, createEmptyPodcastDto, req.user)
  }

  @UseGuards(AuthGuard)
  @Patch('file/:podcastId')
  @UseInterceptors(FileInterceptor('file'))
  async updateFilePodcast(
    @UploadedFile()
    file: Express.Multer.File,
    @Param('podcastId') podcastId,
    @Req()
    req,
  ) {
    return await this.awsService.updatePodcastFile(file, req.user, podcastId)
  }

  @UseGuards(AuthGuard)
  @Patch('data/:podcastId')
  async updateDataPodcast(@Param('podcastId') podcastId, @Req() req, @Body() updatePodcastDto: IPodcast.IUpdatePodcast) {
    return this.podcastService.updateDataPocast(req.user, podcastId, updatePodcastDto)
  }

  //Post podcast with Episode ( şimdlik kullanılmayacak)
  @UseGuards(AuthGuard)
  @Post('with-episode')
  @UseInterceptors(FilesInterceptor('file', 2))
  async createPodcastWithFirstEpisode(
    @UploadedFiles(new FileTypePipe())
    files: Array<Express.Multer.File>,
    @Body()
    createPodcastDto: IPodcast.ICreatePodcastWithFirstEpisode,
    @Req() req,
  ) {
    return await this.awsService.createPodcastWithFirstEpisode(files, createPodcastDto, req.user)
  }

  // Delete Podcast
  @UseGuards(AuthGuard)
  @Delete(':podcastId')
  async deleteFile(@Param('podcastId') podcastId, @Req() req) {
    return await Promise.allSettled([this.awsService.deletePodcast(req.user, podcastId), this.podcastService.deletePodcast(podcastId, req.user)])
  }

  // Get Podcast ( main page)
  @Get('static')
  findMainPage() {
    return this.podcastService.findMainPage()
  }

  // fetch Trt Podcast
  @Get('fetchTrtPodcast')
  async fetchTrt() {
    return await this.podcastService.fetchTrtData()
  }

  // Bir kullanıcının bütün podcastleri

  @UseGuards(AuthGuard)
  @Get('all')
  findAll() {
    return this.podcastService.findAll()
  }

  @UseGuards(AuthGuard)
  @Get()
  dynamicPodcasts() {
    return this.podcastService.getDynamicPodcast()
  }

  // user podcast interactions
  @UseGuards(AuthGuard)
  @Post('like/:podcastId')
  likePodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.likePodcast(req.user, podcastId)
  }
  @UseGuards(AuthGuard)
  @Post('removeLike/:podcastId')
  removeLikedPodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.removeLikedPodcast(req.user, podcastId)
  }
  @UseGuards(AuthGuard)
  @Post('pin/:podcastId')
  pinPodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.pinPodcast(req.user, podcastId)
  }
  @UseGuards(AuthGuard)
  @Post('removePin/:podcastId')
  removePinnedPodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.removePinnedPodcast(req.user, podcastId)
  }
  @UseGuards(AuthGuard)
  @Post('archive/:pdocastId')
  archivePodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.archivePodcast(req.user, podcastId)
  }
  @UseGuards(AuthGuard)
  @Post('removeArchive/podcastId')
  removeArchivedPodcast(@Param('podcastId') podcastId: string, @Req() req) {
    return this.podcastService.removeArchivedPodcast(req.user, podcastId)
  }
}
