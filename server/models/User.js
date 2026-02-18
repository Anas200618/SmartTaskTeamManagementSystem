const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name must be at most 60 characters"],
      // Only allow letters, spaces, and basic punctuation for a professional feel
      match: [/^[a-zA-Z\s.'-]+$/, "Please enter a valid name"],
    },

    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // Comprehensive Regex: Supports .org, .in, .io, .systems, subdomains, etc.
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters for better security"],
      // Note: In your controller, ensure you hash this using bcrypt
    },

    role: {
      type: String,
      enum: {
        values: ["SuperAdmin", "Admin", "Member"],
        message: "{VALUE} is not a valid role",
      },
      default: "Member",
    },

    designation: {
      type: String,
      trim: true,
      maxlength: [100, "Designation must be at most 100 characters"],
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple users to have no phone number without conflict
      // Improved phone regex: Supports optional '+' and 10-15 digits
      match: [/^\+?\d{10,15}$/, "Please fill a valid phone number"],
    },

    avatar: {
      type: String, 
      default: "", // Stores path like "/uploads/avatar-123.jpg"
    },

    adminAccess: {
      type: Boolean,
      // Preserving your specific logic: Admins default to false, others to true
      default: function () {
        if (this.role === "Admin") return false;
        return true;
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { 
    timestamps: true,
    // Automatically hide sensitive data when sending to frontend
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add an index on email for faster login performance
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);