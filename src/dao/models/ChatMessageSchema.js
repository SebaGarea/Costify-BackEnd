import mongoose, { Schema } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ userId: 1, createdAt: 1 });

export const ChatMessageModel = mongoose.model("ChatMessage", ChatMessageSchema);
