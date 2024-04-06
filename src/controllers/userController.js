const asyncHandler = require("express-async-handler");
const User = require("../Models/userModel");
const { generateJwtToken } = require("../config/generateJWTToken");
const { ValidationError, NotFoundError } = require("../utils/custome-error");
const errorCodes = require("../utils/error-codes");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !password || !email) {
    throw new ValidationError({
      message: "All fields are mandatory",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  const emailExist = await User.findOne({ email });

  if (emailExist) {
    throw new ValidationError({
      message: "Email already exist",
      code: errorCodes.ALREADY_CREATED_USER,
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateJwtToken(user._id),
    });
  } else {
    throw new Error("Failed to create new user");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ValidationError({
      message: "All fields are mandatory",
      code: errorCodes.INVALID_FIELDS,
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError({
      message: "user does not exist",
      code: errorCodes.USER_NOT_FOUND,
    });
  }
  console.log(user,"user")
  if (await user.comparePassword(password)) {
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateJwtToken(user._id),
    });
  } else {
    throw new ValidationError({
      message: "Invalid email or password",
      code: errorCodes.INVALID_EMAIL_PASSWORD,
    });
  }
});

const getUsers = asyncHandler(async (req, res) => {
  let search = req.query.search;
  if(search === undefined || search === null){
    search = ''
  }
    const keyword = {
      $or: [
        { name: { $regex: search } },
        { email: { $regex: search } },
      ],
    }
    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user } })
      .sort('name')
      .select("-password"); // exclude the
    console.log(users, "users");
    res.send(users);
});

const getUserProfile = asyncHandler(async (req, res) => {
  const loggedUserId = req.user;
  console.log(loggedUserId, "iddd");
  const user = await User.findById(loggedUserId, "-password");
  if (user) {
    res.status(200).json(user);
  } else {
    throw new NotFoundError({
      message: "User not found",
      code: errorCodes.UNAUTHORISED
    });
  }
});

module.exports = { registerUser, authUser, getUsers, getUserProfile };
