const express = require("express")
const authGuard = require("../middleware/authMiddleware")
const { accessChat, getAllChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, updateGroupChat } = require("../controllers/chatController")
const router = express.Router()

router.route('/').post(authGuard, accessChat).get(authGuard, getAllChats)
router.route('/group-chat').post(authGuard, createGroupChat).put(authGuard, updateGroupChat)
router.route('/remove-group').put(authGuard, removeFromGroup)

module.exports = router