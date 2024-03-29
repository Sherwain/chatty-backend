import { PostModel } from "@post/models/post-schema";
import { IReactionDocument } from "@reaction/interfaces/reaction-interface";
import { UserModel } from "@user/models/user-schema";
import mongoose, { model, Model, Schema } from "mongoose";

const reactionSchema: Schema = new Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PostModel,
      index: true,
    },
    reaction: { type: String, default: null },
    postCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      index: true,
    },
    postReactor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      index: true,
    },
  },
  { timestamps: true }
);

const ReactionModel: Model<IReactionDocument> = model<IReactionDocument>(
  "Reaction",
  reactionSchema,
  "reaction"
);

export { ReactionModel };
