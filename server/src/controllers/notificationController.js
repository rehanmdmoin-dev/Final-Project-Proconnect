const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');

class NotificationController {
    async getNotifications(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const filter = { recipient: req.user._id };
        if (req.query.unreadOnly === 'true') filter.isRead = false;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate('sender', 'name profileImage headline')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter),
        ]);

        return success(res, 200, 'Notifications fetched', notifications, buildMeta(total));
    }

    async getUnreadCount(req, res) {
        const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        return success(res, 200, 'Unread count fetched', { count });
    }

    async markAsRead(req, res) {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id,
        });
        if (!notification) throw new ApiError(404, 'Notification not found');

        notification.isRead = true;
        await notification.save();

        return success(res, 200, 'Notification marked as read');
    }

    async markAllAsRead(req, res) {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        return success(res, 200, 'All notifications marked as read');
    }

    async deleteNotification(req, res) {
        const removed = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id,
        });
        if (!removed) throw new ApiError(404, 'Notification not found');

        return success(res, 200, 'Notification deleted');
    }
}

module.exports = bindController(new NotificationController());
