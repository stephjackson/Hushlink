const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    icon: { type: String, enum: ['fa-chess', 'fa-chess-rook', 'fa-chess-queen', 'fa-chess-pawn', 'fa-chess-knight', 'fa-chess-king', 'fa-chess-bishop'], default: 'fa-chess' },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
