import { ObjectId } from "mongodb";
import { Document } from "mongoose";

export interface IReactionDocument extends Document {
  _id?: string | ObjectId;
  reaction: string;
  postId: string;
  postCreator: string | ObjectId;
  postReactor: string | ObjectId;
  createdAt?: Date;
  comment?: string;
}

export interface userDetails {
  _id: string | ObjectId;
  profilePicture: string;
  username: string;
  avatarColor: string;
}

export interface IReactionDocumentResponse extends Document {
  _id: string | ObjectId;
  reaction: string;
  postId: string;
  postCreator: userDetails;
  postReactor: userDetails;
  createdAt?: Date;
  comment?: string;
}

export interface IReactions {
  like: number;
  love: number;
  happy: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface IReactionJob {
  reactionDoc?: IReactionDocument;
}

export interface IQueryReaction {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
  postReactor?: string | ObjectId;
}

export interface IReaction {
  senderName: string;
  reaction: string;
}

export const iReactionsKeys = [
  "like",
  "love",
  "happy",
  "wow",
  "sad",
  "angry",
] as const;
