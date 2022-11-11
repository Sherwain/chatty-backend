import { AuthModel } from "@auth/models/auth-schema";
import { PostModel } from "@post/models/post-schema";
import { IReactionDocument } from "@reaction/interfaces/reaction-interface";
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
      ref: AuthModel,
      index: true,
    },
    postReactor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: AuthModel,
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
