import mongoose, { model, Model, Schema } from "mongoose";
import { ICommentDocument } from "@comment/interfaces/comment-interface";
import { PostModel } from "@post/models/post-schema";
import { UserModel } from "@user/models/user-schema";

const commentSchema: Schema = new Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PostModel,
      index: true,
    },
    comment: { type: String, default: null },
    postCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      index: true,
    },
    postCommenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      index: true,
    },
  },
  { timestamps: true }
);

const CommentsModel: Model<ICommentDocument> = model<ICommentDocument>(
  "Comment",
  commentSchema,
  "comment"
);
export { CommentsModel };
