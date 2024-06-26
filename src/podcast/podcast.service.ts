import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { Category, IPodcast } from './interface/podcast.interface'
import { UpdatePodcastDto } from './interface/update-podcast.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Podcast, PodcastDocument } from './schema/podcast.schema'
import { Model } from 'mongoose'
import { UserService } from 'src/user/user.service'
import sharp from 'sharp'
import { ObjectId } from 'mongodb'
import { IEpisode } from '../episode/interface/episode.interface'

@Injectable()
export class PodcastService {
  constructor(
    @InjectModel(Podcast.name) private podcastModel: Model<PodcastDocument>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}
  async createPodcastWithFirstEpisode(createPodcastDto: IPodcast.ICreatePodcastWithFirstEpisode, user, urls, id, episodeId): Promise<any> {
    const firstEpisode: IEpisode = {
      _id: episodeId,
      title: createPodcastDto.episodeTitle,
      description: createPodcastDto.episodeDescription,
      audioUrl: urls[1],
      totalLike: 0,
    }

    createPodcastDto.podcastCategory = JSON.parse(createPodcastDto.podcastCategory)
    const newPodcast: IPodcast = {
      _id: id,
      title: createPodcastDto.podcastTitle,
      category: createPodcastDto.podcastCategory,
      description: createPodcastDto.podcastDescription,
      episodes: [firstEpisode],
      imageUrl: urls[0],
      totalLike: 0,
      owner: user,
    }
    await this.userService.findOneAndUpdate({ user_id: user }, { $push: { createdPodcastList: id } }, { new: true })
    return await this.podcastModel.create(newPodcast)
  }
  async createEmptyPodcast(createEmptyPodcastDto, user, url, id) {
    createEmptyPodcastDto.podcastCategory = JSON.parse(createEmptyPodcastDto.podcastCategory)
    const newPodcast: IPodcast = {
      _id: id,
      title: createEmptyPodcastDto.podcastTitle,
      category: createEmptyPodcastDto.podcastCategory,
      description: createEmptyPodcastDto.podcastDescription,
      episodes: [],
      imageUrl: url,
      totalLike: 0,
      owner: user,
    }
    await this.userService.findOneAndUpdate({ user_id: user }, { $push: { createdPodcastList: id } }, { new: true })
    return await this.podcastModel.create(newPodcast)
  }

  async deletePodcast(podcastId: any, user_id): Promise<any> {
    const podcastObjectId = ObjectId.createFromHexString(podcastId)
    await this.podcastModel.deleteOne({ _id: podcastObjectId })
    const updatedUser = await this.userService.findOneAndUpdate(
      { user_id: user_id },
      { $pull: { createdPodcastList: podcastObjectId } },
      { new: true },
    )
    return updatedUser
  }

  async updateFilePodcast(user, podcastId, url) {
    return await this.podcastModel.findOneAndUpdate({ owner: user, _id: podcastId }, { $set: { imageUrl: url } })
  }

  async updateDataPocast(user, podcastId, dto) {
    return await this.podcastModel.findOneAndUpdate(
      { _id: podcastId, owner: user },
      { $set: { title: dto.podcastTitle, category: dto.podcastCategory, description: dto.podcastDescription } },
      { new: true },
    )
  }

  async getDynamicPodcast() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return this.podcastModel
      .aggregate([
        { $unwind: '$episodes' },
        { $match: { 'episodes.createdAt': { $gte: twentyFourHoursAgo } } },
        { $group: { _id: '$_id', podcast: { $first: '$$ROOT' }, episodes: { $push: '$episodes' } } },
        { $project: { 'podcast.episodes': '$episodes' } },
      ])
      .exec()
  }

  async moveEpisodeBetweenPodcasts(podcastId, newPodcastId, episodeId, newEpisodeId, user) {
    return await this.podcastModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: podcastId, owner: user },
          update: { $pull: { episodes: { _id: episodeId } } },
        },
      },
      {
        updateOne: {
          filter: { _id: newPodcastId, owner: user },
          update: { $push: { episodes: { _id: newEpisodeId } } },
        },
      },
    ])
  }

  async findAll() {
    return await this.podcastModel.find()
  }

  async findMainPage() {
    return await this.podcastModel.find().select('-episodes')
  }

  async fetchTrtData() {
    // const trtFetchLinks = [
    //   'https://www.trtdinle.com/api/detail?path=/genre/din-ve-yasam',
    //   'https://www.trtdinle.com/api/detail?path=/genre/aile-ve-cocuk',
    //   'https://www.trtdinle.com/api/detail?path=/genre/haber',
    //   'https://www.trtdinle.com/api/detail?path=/genre/tarih-8687',
    //   'https://www.trtdinle.com/api/detail?path=/genre/soylesi',
    //   'https://www.trtdinle.com/api/detail?path=/genre/biyografi',
    //   'https://www.trtdinle.com/api/detail?path=/genre/sanat',
    //   'https://www.trtdinle.com/api/detail?path=/genre/edebiyat',
    //   'https://www.trtdinle.com/api/detail?path=/genre/muzik-7134',
    //   'https://www.trtdinle.com/api/detail?path=/genre/genel-kultur',
    //   'https://www.trtdinle.com/api/detail?path=/genre/teknoloji',
    //   'https://www.trtdinle.com/api/detail?path=/genre/spor',
    // ]
    const trtData = await fetch('https://www.trtdinle.com/api/detail?path=/genre/podcast').then((trtData) => {
      return trtData.json()
    })

    trtData.sets
      .filter((set) => set.index >= 3)
      .map((set) => set.contents)
      .forEach((contents) => {
        contents.forEach(async (content) => {
          const episodes = await fetch(`https://www.trtdinle.com/api/detail?path=${content.path}`).then((episodes) => {
            return episodes.json()
          })
          let xx: any = []
          episodes.items.map((item) => {
            xx.push({
              title: item.title.substring(0, 100),
              description: item.description.substring(0, 100),
              audioUrl: item.audio.url,
            })
          })
          await this.podcastModel.create({
            owner: '11111111-1111-1111-1111-111111111111',
            title: content.title.substring(0, 100),
            description: content.description.substring(0, 100),
            imageUrl: await this.modifyPodcastImage(content.imageUrl, 200, 200),
            episodes: xx,
          })
        })
      })

    // await this.podcastModel.create({})
    // await this.userService.findOneAndUpdate({ id: '11111111-1111-1111-1111-111111111111' }, { $push: { likedPodcastList: "xx" } }, { new: true })
  }

  async modifyPodcastImage(imageUrl, width, height) {
    const response = await fetch(imageUrl)
    const buffer = await response.arrayBuffer()
    const resizedImage = await sharp(Buffer.from(buffer)).resize({ width: width, height: height }).webp().toBuffer()
    const base64 = resizedImage.toString('base64')
    return `data:image/webp;base64,${base64}`
  }

  async findOneAndUpdate(condition, update, options?) {
    return this.podcastModel.findOneAndUpdate(condition, update, options).lean()
  }

  async findOne(condition) {
    return this.podcastModel.findOne(condition).lean()
  }

  // User Podcast Interactions
  async likePodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $push: { likedPodcastList: podcastId } }, { new: true })
  }
  async removeLikedPodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $pull: { likedPodcastList: podcastId } }, { new: true })
  }
  async pinPodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $push: { pinnedPodcastList: podcastId } }, { new: true })
  }
  async removePinnedPodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $pull: { pinnedPodcastList: podcastId } }, { new: true })
  }
  async archivePodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $push: { archivedPodcastList: podcastId } }, { new: true })
  }
  async removeArchivedPodcast(id, podcastId) {
    return await this.userService.findOneAndUpdate({ user_id: id }, { $pull: { archivedPodcastList: podcastId } }, { new: true })
  }
}
