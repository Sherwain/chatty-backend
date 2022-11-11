import Joi, { ObjectSchema } from "joi";

const ReactionSchema: ObjectSchema = Joi.object().keys({
  postCreator: Joi.string().required().messages({
    "any.required": "userTo is a required property",
  }),
  postId: Joi.string().required().messages({
    "any.required": "postId is a required property",
  }),
  reaction: Joi.string()
    .required()
    .valid("like", "love", "happy", "sad", "wow", "angry")
    .messages({
      "any.required":
        "Reaction type is a required property of: like, love, sad, wow, angry, happy",
    }),
  previousReaction: Joi.string()
    // .required()
    .valid("like", "love", "happy", "sad", "wow", "angry", "")
    .messages({
      "any.required":
        "Reaction type is a required property of: like, love, sad, wow, angry, happy",
    }),
});

const removeReactionSchema: ObjectSchema = Joi.object().keys({
  postReactions: Joi.object().optional().allow(null, ""),
});

export { ReactionSchema, removeReactionSchema };
