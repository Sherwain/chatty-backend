import { ObjectId } from "mongodb";
import { UserModel } from "@user/models/user-schema";
import { IGetPostsQuery, IPostDocument } from "@post/interfaces/post-interface";
import { PostModel } from "@post/models/post-schema";
import { config } from "@root/config";

const log = config.LOG.getInstance("database");

class PostService {
  public syncPostToDB(userId: string, postData: IPostDocument) {
    log.info("Writing data to mongoDB database");
    PostModel.create(postData);
    UserModel.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { postsCount: 1 } }
    ).exec();
  }

  public async postCounts(): Promise<number> {
    log.info("Fetching data from mongoDB database");
    return await PostModel.find({}).countDocuments();
  }

  public async getTotalUserPosts(userId: string): Promise<number> {
    log.info("Fetching data from mongoDB database");
    return await PostModel.find({ userId: new ObjectId(userId) }).count();
  }

  public async getPosts(
    query: IGetPostsQuery,
    skip: number = 0,
    limit: number = 0,
    sort: Record<string, 1 | -1>
  ): Promise<IPostDocument[]> {
    let postQuery = {};
    if (query?.imgId && query?.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: null }, gifUrl: { $ne: null } }] };
    } else postQuery = query;
    log.info("Fetching data from mongoDB database");
    return (await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ])) as IPostDocument[];
  }

  public updatePost(postId: string, postData: IPostDocument): void {
    log.info("Writing data to mongoDB database");
    PostModel.findByIdAndUpdate(new ObjectId(postId), postData).exec();
  }

  public deletePostFromDatabase(userId: string, postId: string): void {
    PostModel.findByIdAndDelete(new ObjectId(postId)).exec();
    UserModel.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { postsCount: -1 } }
    ).exec();
    log.info("deleted post from mongoDB database...");
  }
}

export const postService: PostService = new PostService();
