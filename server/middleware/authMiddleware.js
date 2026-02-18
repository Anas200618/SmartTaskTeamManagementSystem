const jwt = require("jsonwebtoken");
const User = require("../models/User");


// ================= PROTECT ROUTE =================
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      /**
       * 🔥 Block ONLY Admin if not approved
       * Members & SuperAdmin unaffected
       */
      if (user.role === "Admin" && user.adminAccess === false) {
        return res.status(403).json({
          message: "Admin accounts require SuperAdmin approval before login.",
          adminAccess: false,
        });
      }

      // Attach user
      req.user = user;

      next();

    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};


// ================= ROLE BASED =================
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};


module.exports = { protect, authorizeRoles };
