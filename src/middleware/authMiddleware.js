const jwt = require("jsonwebtoken")
const { AuthenticationError } = require("../utils/custome-error");
const errorCodes = require("../utils/error-codes");

const authGuard = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];
    // console.log(token,"token")

    if (!token)
      throw new AuthenticationError({
        code: errorCodes.UNAUTHORISED,
        message: "access denied",
      });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded,"decode")
    req.user = decoded.id; // add the id from jwt to req body so that we can use in the controller
    // console.log(req.user,"userid")
    next();
  } catch (error) {
    res
      .status(401)
      .json({ error: "access denied", code: errorCodes.UNAUTHORISED });
  }
};

module.exports = authGuard
