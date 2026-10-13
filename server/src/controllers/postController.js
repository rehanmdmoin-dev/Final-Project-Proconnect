const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { uploadToCloudinary, destroyFromCloudinary } = require('../services/uploadService');
const { getAcceptedConnectionIds } = require('./connectionController');

class PostController {
    async createPost(req, res) {
        const payload = {
            author: req.user._id,
            content: req.body.content,
        };

        if (req.body.company) {
            const company = await Company.findOne({ _id: req.body.company, isDeleted: false });
            if (!company) throw new ApiError(404, 'Company not found');

            const isOwner = String(company.owner) === String(req.user._id);
            const isRecruiter = company.recruiters.some((r) => String(r) === String(req.user._id));
            if (!isOwner && !isRecruiter && req.user.role !== 'admin') {
                throw new ApiError(403, 'You are not authorized to post for this company');
            }
            payload.company = company._id;
        }

        if (req.file) {
            const { url, publicId } = await uploadToCloudinary(req.file.path, 'posts', 'auto');
            payload.media = { url, publicId, type: 'image' };
        }

        const post = await Post.create(payload);
        await post.populate('author', 'name headline profileImage');

        return success(res, 201, 'Post created successfully', post);
    }

    
    async getFeed(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const connectionIds = await getAcceptedConnectionIds(req.user._id);
        const followedCompanies = await Company.find({ followers: req.user._id, isDeleted: false })
            .select('_id')
            .lean();

        const filter = {
            isDeleted: false,
            $or: [
                { author: { $in: [...connectionIds, req.user._id] } },
                { company: { $in: followedCompanies.map((c) => c._id) } },
            ],
        };

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .populate('author', 'name headline profileImage')
                .populate('company', 'name logo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post.countDocuments(filter),
        ]);

    
        const likedIds = await Like.find({
            user: req.user._id,
            post: { $in: posts.map((p) => p._id) },
        }).select('post').lean();
        const likedSet = new Set(likedIds.map((l) => String(l.post)));

        const shaped = posts.map((p) => ({ ...p, isLiked: likedSet.has(String(p._id)) }));

        return success(res, 200, 'Feed fetched', shaped, buildMeta(total));
    }

    async getUserPosts(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { author: req.params.userId, isDeleted: false };

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .populate('author', 'name headline profileImage')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(filter),
        ]);

        return success(res, 200, 'Posts fetched', posts, buildMeta(total));
    }

    async getPostById(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
            .populate('author', 'name headline profileImage')
            .populate('company', 'name logo')
            .lean();

        if (!post) throw new ApiError(404, 'Post not found');

        const isLiked = req.user
            ? !!(await Like.exists({ post: post._id, user: req.user._id }))
            : false;

        return success(res, 200, 'Post fetched', { ...post, isLiked });
    }

    async updatePost(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
        if (!post) throw new ApiError(404, 'Post not found');
        if (String(post.author) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only edit your own posts');
        }

        post.content = req.body.content;
        await post.save();

        return success(res, 200, 'Post updated', post);
    }

    async deletePost(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
        if (!post) throw new ApiError(404, 'Post not found');

        if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
            throw new ApiError(403, 'You can only delete your own posts');
        }

        post.isDeleted = true;
        await post.save();

        if (post.media?.publicId) await destroyFromCloudinary(post.media.publicId, 'image');

        return success(res, 200, 'Post deleted');
    }

    async toggleLike(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).populate('author', 'name');
        if (!post) throw new ApiError(404, 'Post not found');

        const existing = await Like.findOne({ post: post._id, user: req.user._id });

        if (existing) {
            await existing.deleteOne();
            await Post.updateOne({ _id: post._id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
            return success(res, 200, 'Post unliked', { isLiked: false });
        }

        await Like.create({ post: post._id, user: req.user._id });
        await Post.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });

        await createNotification({
            recipient: post.author._id,
            sender: req.user._id,
            type: 'post_liked',
            message: `${req.user.name} liked your post`,
            data: { postId: post._id },
        });

        return success(res, 200, 'Post liked', { isLiked: true });
    }

    async addComment(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).populate('author', 'name');
        if (!post) throw new ApiError(404, 'Post not found');

        const comment = await Comment.create({
            post: post._id,
            author: req.user._id,
            content: req.body.content,
        });
        await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
        await comment.populate('author', 'name headline profileImage');

        await createNotification({
            recipient: post.author._id,
            sender: req.user._id,
            type: 'post_commented',
            message: `${req.user.name} commented on your post`,
            data: { postId: post._id, commentId: comment._id },
        });

        return success(res, 201, 'Comment added', comment);
    }

    async getComments(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { post: req.params.id, isDeleted: false };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('author', 'name headline profileImage')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments(filter),
        ]);

        return success(res, 200, 'Comments fetched', comments, buildMeta(total));
    }

    async deleteComment(req, res) {
        const comment = await Comment.findOne({ _id: req.params.commentId, isDeleted: false });
        if (!comment) throw new ApiError(404, 'Comment not found');

        const post = await Post.findById(comment.post);
        const isCommentAuthor = String(comment.author) === String(req.user._id);
        const isPostAuthor = post && String(post.author) === String(req.user._id);

        if (!isCommentAuthor && !isPostAuthor && req.user.role !== 'admin') {
            throw new ApiError(403, 'You are not authorized to delete this comment');
        }

        comment.isDeleted = true;
        await comment.save();
        await Post.updateOne({ _id: comment.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });

        return success(res, 200, 'Comment deleted');
    }
}

module.exports = bindController(new PostController());
