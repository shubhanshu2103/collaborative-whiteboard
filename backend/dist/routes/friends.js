"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = express_1.default.Router();
router.use((0, express_2.requireAuth)());
// POST /api/friends/request
router.post('/request', async (req, res) => {
    try {
        const requesterId = req.auth.userId;
        const { targetUserId } = req.body;
        if (!targetUserId || requesterId === targetUserId) {
            return res.status(400).json({ error: 'Invalid target user' });
        }
        // Check if a friendship already exists
        const existing = await prisma_1.default.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, receiverId: targetUserId },
                    { requesterId: targetUserId, receiverId: requesterId }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({ error: `Friendship exists with status: ${existing.status}` });
        }
        const friendship = await prisma_1.default.friendship.create({
            data: {
                requesterId,
                receiverId: targetUserId,
                status: 'PENDING'
            }
        });
        res.json(friendship);
    }
    catch (err) {
        console.error('Request friend error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// POST /api/friends/accept
router.post('/accept', async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { friendshipId } = req.body;
        const friendship = await prisma_1.default.friendship.findUnique({ where: { id: friendshipId } });
        if (!friendship || friendship.receiverId !== userId || friendship.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid pending request' });
        }
        const updated = await prisma_1.default.friendship.update({
            where: { id: friendshipId },
            data: { status: 'ACCEPTED' }
        });
        res.json(updated);
    }
    catch (err) {
        console.error('Accept friend error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// POST /api/friends/reject
router.post('/reject', async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { friendshipId } = req.body;
        const friendship = await prisma_1.default.friendship.findUnique({ where: { id: friendshipId } });
        if (!friendship || friendship.receiverId !== userId || friendship.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid pending request' });
        }
        await prisma_1.default.friendship.delete({ where: { id: friendshipId } });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Reject friend error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// GET /api/friends/list
router.get('/list', async (req, res) => {
    try {
        const userId = req.auth.userId;
        const friendships = await prisma_1.default.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                requester: true,
                receiver: true
            }
        });
        // Map to friend structures
        const friends = friendships.map(f => {
            const isRequester = f.requesterId === userId;
            const friend = isRequester ? f.receiver : f.requester;
            return {
                friendshipId: f.id,
                ...friend
            };
        });
        res.json(friends);
    }
    catch (err) {
        console.error('List friends error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// GET /api/friends/requests
router.get('/requests', async (req, res) => {
    try {
        const userId = req.auth.userId;
        const requests = await prisma_1.default.friendship.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                requester: true
            }
        });
        res.json(requests);
    }
    catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
