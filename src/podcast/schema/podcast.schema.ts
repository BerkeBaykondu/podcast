import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, Types } from 'mongoose'
import { Episode } from '../../episode/schema/episode.schema'
import { Category } from '../interface/podcast.interface'

export type PodcastDocument = HydratedDocument<Podcast>
@Schema({ timestamps: true })
export class Podcast {
  @Prop({ sparse: true, index: { unique: true, sparse: true } })
  title: string
  @Prop({ maxlength: 200 })
  description: string
  @Prop({
    type: [String],
    enum: Category,
    required: true,
  })
  category: Category[]
  @Prop({})
  imageUrl: string
  @Prop({ default: 0 })
  totalLike: number
  @Prop({ type: [Episode], required: true })
  episodes: Episode[]
  @Prop({ type: String, required: true })
  owner: string
}

export const podcastSchema = SchemaFactory.createForClass(Podcast)
