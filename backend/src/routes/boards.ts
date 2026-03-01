import express from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';

const router = express.Router();

router.use(requireAuth());

// Middleware: Verify board ownership
const isBoardOwner = async (req: any, res: any, next: any) => {
    try {
        const userId = req.auth.userId;
        const { id: boardId } = req.params;

        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        if (board.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Not the board owner' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /api/boards/save
router.post('/save', async (req: any, res: any) => {
    try {
        const { boardId, canvasState, name, isPublic } = req.body;
        const userId = req.auth.userId;

        if (!boardId) {
            return res.status(400).json({ error: 'boardId required' });
        }

        const title = name || 'Untitled Board';
        const isPub = isPublic ?? false;

        const board = await prisma.board.upsert({
            where: { id: boardId },
            update: {
                canvasState,
                title,
                isPublic: isPub,
            },
            create: {
                id: boardId,
                ownerId: userId,
                canvasState,
                title,
                isPublic: isPub,
            }
        });

        res.json(board);
    } catch (err) {
        console.error('Save board error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/boards/me
router.get('/me', async (req: any, res: any) => {
    try {
        const userId = req.auth.userId;
        const boards = await prisma.board.findMany({
            where: { ownerId: userId },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(boards);
    } catch (err) {
        console.error('Get my boards error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/boards/friend/:friendId
router.get('/friend/:friendId', async (req: any, res: any) => {
    try {
        const userId = req.auth.userId;
        const { friendId } = req.params;

        // Verify they are accepted friends
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId, receiverId: friendId },
                    { requesterId: friendId, receiverId: userId }
                ]
            }
        });

        if (!existingFriendship) {
            return res.status(403).json({ error: 'Unauthorized: Not accepted friends' });
        }

        // Fetch the friend's public boards
        const publicBoards = await prisma.board.findMany({
            where: {
                ownerId: friendId,
                isPublic: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(publicBoards);

    } catch (err) {
        console.error('Get friend boards error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/boards/:id/share
router.post('/:id/share', isBoardOwner, async (req: any, res: any) => {
    try {
        const { id: boardId } = req.params;
        const { targetUserId, role = 'VIEWER' } = req.body;
        const ownerId = req.auth.userId;

        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId required' });
        }

        // Add to collaborators via upsert
        const collabo = await prisma.boardCollaborator.upsert({
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
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: ownerId, receiverId: targetUserId },
                    { requesterId: targetUserId, receiverId: ownerId }
                ]
            }
        });

        if (!existingFriendship) {
            await prisma.friendship.create({
                data: {
                    requesterId: ownerId,
                    receiverId: targetUserId,
                    status: 'PENDING'
                }
            });
        }

        res.json(collabo);
    } catch (err) {
        console.error('Share board error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/boards/:id/collaborators
router.get('/:id/collaborators', isBoardOwner, async (req: any, res: any) => {
    try {
        const { id: boardId } = req.params;
        const collaborators = await prisma.boardCollaborator.findMany({
            where: { boardId },
            include: { user: true }
        });
        res.json(collaborators);
    } catch (err) {
        console.error('Get collaborators error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
