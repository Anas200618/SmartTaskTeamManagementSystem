const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [3, "Team name must be at least 3 characters"],
      maxlength: [50, "Team name cannot exceed 50 characters"],
      unique: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team must have a creator"],
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);


// ================= REMOVE DUPLICATE MEMBERS =================
teamSchema.pre("save", function (next) {
  if (this.members && this.members.length > 0) {
    this.members = [...new Set(this.members.map(id => id.toString()))];
  }

  // Optional: Ensure creator is part of members
  if (this.createdBy && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }

  next();
});


// ================= INDEX =================
teamSchema.index({ teamName: 1 }, { unique: true });


module.exports = mongoose.model("Team", teamSchema);
