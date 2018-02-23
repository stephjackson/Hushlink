const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hushSchema = new Schema(
  {
    hush: {
      type: String,
      required: [true, "You need to post a link!"]
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

var Hush = mongoose.model("Hush", hushSchema);
module.exports = Hush;
