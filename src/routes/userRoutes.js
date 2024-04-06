const express = require("express");
const { registerUser, authUser, getUsers, getUserProfile } = require("../controllers/userController");
const authGuard = require("../middleware/authMiddleware");

const router = express.Router();
router.route('/').post(registerUser).get(authGuard, getUsers);
router.route('/profile').get(authGuard, getUserProfile)
router.post("/login", authUser)

module.exports = router;
