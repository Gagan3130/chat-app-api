const express = require("express")
const authGuard = require("../middleware/authMiddleware")
const { sendMessage, getAllMessages, readMessage } = require("../controllers/messageController")
const router = express.Router()

router.route('/').post(authGuard, sendMessage)
router.route('/:chatId').get(authGuard, getAllMessages).put(authGuard, readMessage)

module.exports = router