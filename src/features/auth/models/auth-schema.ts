import { UserModel } from "@user/models/user-schema";
import { hash, compare } from "bcryptjs";
import { IAuthDocument } from "@auth/interfaces/auth-interface";
import { model, Model, Schema } from "mongoose";

const SALT_ROUND = 12;

const authSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: UserModel },
    username: { type: String },
    uId: { type: String },
    email: { type: String },
    password: { type: String },
    avatarColor: { type: String },
    passwordResetToken: { type: String, default: "" },
    passwordResetExpires: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

authSchema.pre("save", async function (this: IAuthDocument, next: () => void) {
  const hashedPassword: string = await hash(
    this.password as string,
    SALT_ROUND
  );
  this.password = hashedPassword;
  next();
});

authSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  const hashedPassword: string = (this as unknown as IAuthDocument).password!;
  return compare(password, hashedPassword);
};

authSchema.methods.hashPassword = async function (
  password: string
): Promise<string> {
  return hash(password, SALT_ROUND);
};

const AuthModel: Model<IAuthDocument> = model<IAuthDocument>(
  "Auth",
  authSchema,
  "auth"
);
export { AuthModel };
