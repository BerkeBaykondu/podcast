import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { EpisodeService } from '../episode/episode.service'
import { PodcastService } from '../podcast/podcast.service'
import { ObjectId } from 'mongodb'

@Injectable()
export class AwsService {
  private s3: S3Client

  constructor(
    private readonly podcastService: PodcastService,
    private readonly episodeService: EpisodeService,
  ) {
    this.s3 = new S3Client({
      region: process.env.BUCKETREGION!,
      credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      },
    })
  }
  async createPodcastWithFirstEpisode(files, createPodcastDto, user): Promise<any> {
    let webpAndmp3Urls: string[] = []
    const id = new ObjectId().toHexString()
    const time = Date.now()
    const uploadAndGetUrlPromises = files.map(async (file, index) => {
      // const keyPrefix =
      //   index === 0
      // ? `${user}/${createPodcastDto.podcastName}/${file.originalname}`
      // : `${user}/${createPodcastDto.podcastName}/${createPodcastDto.episodeName}/${file.originalname}`
      await this.s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKETNAME,
          Key: `${user}/${id}/${file.originalname}_${time}`,
          Body: file.buffer,
        }),
      )
      const url = await getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: process.env.BUCKETNAME,
          Key: `${user}/${id}/${file.originalname}_${time}`,
        }),
      )
      webpAndmp3Urls.push(url)
      return url
    })

    await Promise.all(uploadAndGetUrlPromises)

    await this.podcastService.createPodcastWithFirstEpisode(createPodcastDto, user, webpAndmp3Urls, id)
  }

  async createEmptyPodcast(file, createEmptyPodcastDto, user) {
    const id = new ObjectId().toHexString()
    const time = Date.now()

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Key: `${user}/${id}/${file.originalname}_${time}`,
        Body: file.buffer,
      }),
    )

    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Key: `${user}/${id}/${file.originalname}_${time}`,
      }),
    )

    return await this.podcastService.createEmptyPodcast(createEmptyPodcastDto, user, url, id)
  }

  async addEpisode(file, dto, user, id) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Key: `${user}/${id}/${file.originalname}`,
        Body: file.buffer,
      }),
    )
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Key: `${user}/${id}/${file.originalname}`,
      }),
    )

    await this.episodeService.addEpisode(dto, user, url, id)
  }

  async deletePodcast(user, podcastId): Promise<void> {
    // list files in specific folder
    console.log(podcastId)

    const filesInFolder = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.BUCKETNAME,
        Prefix: `${user}/${podcastId}/`,
      }),
    )

    // // create delete file promises ( files in that folder)
    const deletePromises = filesInFolder.Contents!.map((object) => {
      return this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKETNAME,
          Key: object.Key!,
        }),
      )
    })
    // // deleting process
    await Promise.all(deletePromises)

    // delete the folder
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Key: `${user}/${podcastId}`,
      }),
    )
  }

  async deleteEpisode(user, podcastId, episodeId) {}
}
