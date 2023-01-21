import { UserDetails } from "@reaction/interfaces/reaction-interface";
import { ObjectId } from "mongodb";
import { Document } from "mongoose";

export interface ICommentDocument extends Document {
  _id?: string | ObjectId;
  postId: string;
  postCreator: string | ObjectId;
  postCommenter: string | ObjectId;
  createdAt?: Date;
  comment?: string;
}

export interface ICommentJob {
  commentDoc?: ICommentDocument;
}

export interface ICommentDocumentResponse extends Document {
  _id: string | ObjectId;
  postId: string;
  postCreator: UserDetails;
  postCommenter: UserDetails;
  createdAt?: Date;
  comment?: string;
}

export interface ICommentNameList {
  count: number;
  names: string[];
}

export interface IQueryComment {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
  postCommenter?: string | ObjectId;
}

export interface IQuerySort {
  createdAt?: number;
}
