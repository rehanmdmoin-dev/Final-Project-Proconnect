const Notification = require('../models/Notification');

/**
 * Single place where notifications are created (spec section 19).
 * Deliberately never throws: a notification failing must not roll back
 * the business action that triggered it (applying to a job, etc.).
 */
const createNotification = async ({ recipient, sender = null, type, message, data = {} }) => {
    try {
        if (!recipient) return null;
        // Don't notify someone about their own action
        if (sender && String(sender) === String(recipient)) return null;

        return await Notification.create({ recipient, sender, type, message, data });
    } catch (error) {
        console.error('Notification creation failed:', error.message);
        return null;
    }
};

const createManyNotifications = async (recipients, payload) => {
    try {
        const docs = recipients
            .filter((r) => !payload.sender || String(r) !== String(payload.sender))
            .map((recipient) => ({ ...payload, recipient }));
        if (!docs.length) return [];
        return await Notification.insertMany(docs);
    } catch (error) {
        console.error('Bulk notification creation failed:', error.message);
        return [];
    }
};

module.exports = { createNotification, createManyNotifications };
