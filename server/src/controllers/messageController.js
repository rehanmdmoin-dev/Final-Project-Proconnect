const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Connection = require('../models/Connection');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

const findOrCreateConversation = async (userA, userB) => {
    let conversation = await Conversation.findOne({
        participants: { $all: [userA, userB], $size: 2 },
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants: [userA, userB] });
    }
    return conversation;
};

class MessageController {
   
    async sendMessage(req, res) {
        const { receiver, message } = req.body;

        if (String(receiver) === String(req.user._id)) {
            throw new ApiError(400, 'You cannot message yourself');
        }

        const target = await User.findOne({ _id: receiver, isDeleted: false });
        if (!target) throw new ApiError(404, 'Recipient not found');

        if (req.user.role !== 'admin') {
            const connected = await Connection.findOne({
                status: 'accepted',
                $or: [
                    { requester: req.user._id, recipient: receiver },
                    { requester: receiver, recipient: req.user._id },
                ],
            });
            if (!connected) {
                throw new ApiError(403, 'You can only message your connections');
            }
        }

        const conversation = await findOrCreateConversation(req.user._id, receiver);

        const created = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            receiver,
            message,
        });

        conversation.lastMessage = created._id;
        const current = conversation.unreadCounts.get(String(receiver)) || 0;
        conversation.unreadCounts.set(String(receiver), current + 1);
        await conversation.save();

        await createNotification({
            recipient: receiver,
            sender: req.user._id,
            type: 'new_message',
            message: `New message from ${req.user.name}`,
            data: { conversationId: conversation._id },
        });

        await created.populate('sender', 'name profileImage');

        return success(res, 201, 'Message sent', created);
    }

    async getConversations(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { participants: req.user._id };

        const [conversations, total] = await Promise.all([
            Conversation.find(filter)
                .populate('participants', 'name headline profileImage')
                .populate('lastMessage', 'message createdAt sender isRead')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Conversation.countDocuments(filter),
        ]);

        const shaped = conversations.map((c) => ({
            _id: c._id,
           
            participant: c.participants.find((p) => String(p._id) !== String(req.user._id)),
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCounts?.get(String(req.user._id)) || 0,
            updatedAt: c.updatedAt,
        }));

        return success(res, 200, 'Conversations fetched', shaped, buildMeta(total));
    }

    async getMessages(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) throw new ApiError(404, 'Conversation not found');

        const isParticipant = conversation.participants.some(
            (p) => String(p) === String(req.user._id)
        );
        if (!isParticipant) throw new ApiError(403, 'You are not part of this conversation');

        const filter = { conversation: conversation._id };
        const [messages, total] = await Promise.all([
            Message.find(filter)
                .populate('sender', 'name profileImage')
                .sort({ createdAt: -1 }) 
                .skip(skip)
                .limit(limit),
            Message.countDocuments(filter),
        ]);

        return success(res, 200, 'Messages fetched', messages, buildMeta(total));
    }

    async markAsRead(req, res) {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) throw new ApiError(404, 'Conversation not found');

        const isParticipant = conversation.participants.some(
            (p) => String(p) === String(req.user._id)
        );
        if (!isParticipant) throw new ApiError(403, 'You are not part of this conversation');

        await Message.updateMany(
            { conversation: conversation._id, receiver: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        conversation.unreadCounts.set(String(req.user._id), 0);
        await conversation.save();

        return success(res, 200, 'Conversation marked as read');
    }

   
    async getUnreadCount(req, res) {
        const count = await Message.countDocuments({ receiver: req.user._id, isRead: false });
        return success(res, 200, 'Unread count fetched', { count });
    }
}

module.exports = bindController(new MessageController());
