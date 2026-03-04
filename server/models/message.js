import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: true,
      }
    ],
    text: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    isRead: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        read: { type: Boolean, default: false }
      }
    ],
    replies: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    
     threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
  },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },


  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
