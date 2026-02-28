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
// Middleware: Verify board ownership
const isBoardOwner = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id: boardId } = req.params;
        const board = await prisma_1.default.board.findUnique({ where: { id: boardId } });
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        if (board.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Not the board owner' });
        }
        next();
    }
    catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// POST /api/boards/:id/share
router.post('/:id/share', isBoardOwner, async (req, res) => {
    try {
        const { id: boardId } = req.params;
        const { targetUserId, role = 'VIEWER' } = req.body;
        const ownerId = req.auth.userId;
        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId required' });
        }
        // Add to collaborators via upsert
        const collabo = await prisma_1.default.boardCollaborator.upsert({
            where: {
                boardId_userId: { boardId, userId: targetUserId }
            },
            update: { role },
            create: {
                boardId,
                userId: targetUserId,
                role
            }
        });
        // Conditionally send friend request if not friends
        const existingFriendship = await prisma_1.default.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: ownerId, receiverId: targetUserId },
                    { requesterId: targetUserId, receiverId: ownerId }
                ]
            }
        });
        if (!existingFriendship) {
            await prisma_1.default.friendship.create({
                data: {
                    requesterId: ownerId,
                    receiverId: targetUserId,
                    status: 'PENDING'
                }
            });
        }
        res.json(collabo);
    }
    catch (err) {
        console.error('Share board error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// GET /api/boards/:id/collaborators
router.get('/:id/collaborators', isBoardOwner, async (req, res) => {
    try {
        const { id: boardId } = req.params;
        const collaborators = await prisma_1.default.boardCollaborator.findMany({
            where: { boardId },
            include: { user: true }
        });
        res.json(collaborators);
    }
    catch (err) {
        console.error('Get collaborators error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
