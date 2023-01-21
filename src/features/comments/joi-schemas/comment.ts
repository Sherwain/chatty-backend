import Joi, { ObjectSchema } from "joi";

const CommentSchema: ObjectSchema = Joi.object().keys({
  postCreator: Joi.string().required().messages({
    "any.required": "userTo is a required property",
  }),
  postId: Joi.string().required().messages({
    "any.required": "postId is a required property",
  }),
  comment: Joi.string().required().messages({
    "any.required": "comment is a required property",
  }),
});

export { CommentSchema };
