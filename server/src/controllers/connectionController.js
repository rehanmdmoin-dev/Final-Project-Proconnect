const Connection = require('../models/Connection');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

const getAcceptedConnectionIds = async (userId) => {
    const connections = await Connection.find({
        status: 'accepted',
        $or: [{ requester: userId }, { recipient: userId }],
    }).select('requester recipient').lean();

    return connections.map((c) =>
        String(c.requester) === String(userId) ? c.recipient : c.requester
    );
};

class ConnectionController {
    async sendRequest(req, res) {
        const targetId = req.params.userId;

        
        if (String(targetId) === String(req.user._id)) {
            throw new ApiError(400, 'You cannot send a connection request to yourself');
        }

        const target = await User.findOne({ _id: targetId, isDeleted: false });
        if (!target) throw new ApiError(404, 'User not found');

        
        const existing = await Connection.findOne({
            $or: [
                { requester: req.user._id, recipient: targetId },
                { requester: targetId, recipient: req.user._id },
            ],
        });

        if (existing) {
            if (existing.status === 'pending') {
                throw new ApiError(400, 'A connection request is already pending between you');
            }
            if (existing.status === 'accepted') {
                throw new ApiError(400, 'You are already connected');
            }
            if (existing.status === 'blocked') {
                throw new ApiError(403, 'This connection is blocked');
            }
           
            existing.requester = req.user._id;
            existing.recipient = targetId;
            existing.status = 'pending';
            existing.respondedAt = null;
            await existing.save();

            await createNotification({
                recipient: targetId,
                sender: req.user._id,
                type: 'connection_request',
                message: `${req.user.name} sent you a connection request`,
                data: { connectionId: existing._id },
            });

            return success(res, 200, 'Connection request sent', existing);
        }

        const connection = await Connection.create({
            requester: req.user._id,
            recipient: targetId,
        });

        await createNotification({
            recipient: targetId,
            sender: req.user._id,
            type: 'connection_request',
            message: `${req.user.name} sent you a connection request`,
            data: { connectionId: connection._id },
        });

        return success(res, 201, 'Connection request sent', connection);
    }

   
    async acceptRequest(req, res) {
        const connection = await Connection.findById(req.params.id).populate('requester', 'name');
        if (!connection) throw new ApiError(404, 'Connection request not found');

       
        if (String(connection.recipient) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only respond to requests sent to you');
        }
        if (connection.status !== 'pending') {
            throw new ApiError(400, `This request is already ${connection.status}`);
        }

        connection.status = 'accepted';
        connection.respondedAt = new Date();
        await connection.save();

        await createNotification({
            recipient: connection.requester._id,
            sender: req.user._id,
            type: 'connection_accepted',
            message: `${req.user.name} accepted your connection request`,
            data: { connectionId: connection._id },
        });

        return success(res, 200, 'Connection accepted', connection);
    }

    async rejectRequest(req, res) {
        const connection = await Connection.findById(req.params.id);
        if (!connection) throw new ApiError(404, 'Connection request not found');

        if (String(connection.recipient) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only respond to requests sent to you');
        }
        if (connection.status !== 'pending') {
            throw new ApiError(400, `This request is already ${connection.status}`);
        }

        connection.status = 'rejected';
        connection.respondedAt = new Date();
        await connection.save();

        return success(res, 200, 'Connection request rejected');
    }

    
    async getConnections(req, res) {
        const status = req.query.status || 'accepted';
        const { limit, skip, buildMeta } = getPagination(req.query);

        const filter = { status, $or: [{ requester: req.user._id }, { recipient: req.user._id }] };

        const [connections, total] = await Promise.all([
            Connection.find(filter)
                .populate('requester', 'name headline profileImage location')
                .populate('recipient', 'name headline profileImage location')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Connection.countDocuments(filter),
        ]);

        
        const shaped = connections.map((c) => ({
            connectionId: c._id,
            status: c.status,
            user: String(c.requester._id) === String(req.user._id) ? c.recipient : c.requester,
            isIncoming: String(c.recipient._id) === String(req.user._id),
            createdAt: c.createdAt,
        }));

        return success(res, 200, 'Connections fetched', shaped, buildMeta(total));
    }

    async getPendingRequests(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { recipient: req.user._id, status: 'pending' };

        const [requests, total] = await Promise.all([
            Connection.find(filter)
                .populate('requester', 'name headline profileImage location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Connection.countDocuments(filter),
        ]);

        return success(res, 200, 'Pending requests fetched', requests, buildMeta(total));
    }

    async removeConnection(req, res) {
        const connection = await Connection.findById(req.params.id);
        if (!connection) throw new ApiError(404, 'Connection not found');

        const isParticipant =
            String(connection.requester) === String(req.user._id) ||
            String(connection.recipient) === String(req.user._id);
        if (!isParticipant) throw new ApiError(403, 'You are not part of this connection');

        await connection.deleteOne();
        return success(res, 200, 'Connection removed');
    }

    async blockUser(req, res) {
        const targetId = req.params.userId;
        if (String(targetId) === String(req.user._id)) {
            throw new ApiError(400, 'You cannot block yourself');
        }

        const existing = await Connection.findOne({
            $or: [
                { requester: req.user._id, recipient: targetId },
                { requester: targetId, recipient: req.user._id },
            ],
        });

        if (existing) {
            existing.status = 'blocked';
            existing.requester = req.user._id;
            existing.recipient = targetId;
            await existing.save();
        } else {
            await Connection.create({ requester: req.user._id, recipient: targetId, status: 'blocked' });
        }

        return success(res, 200, 'User blocked');
    }
}

module.exports = bindController(new ConnectionController());
module.exports.getAcceptedConnectionIds = getAcceptedConnectionIds;
