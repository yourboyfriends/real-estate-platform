import { Router } from 'express';
import messageController from '../controllers/message.controller';

const router = Router();

// Import Cloudinary upload middleware (configured for messages folder)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { cloudinary } = require('../config/cloudinary');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const messageImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'batdongsan/messages',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ width: 1280, height: 1280, crop: 'limit', quality: 'auto' }],
    },
});

const uploadMessageImage = multer({
    storage: messageImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations of current user
 * @access  Private
 */
router.get('/conversations', messageController.getConversations);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get total unread message count for current user
 * @access  Private
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * @route   POST /api/messages/upload-image
 * @desc    Upload an image to Cloudinary for use in a message
 * @access  Private
 */
router.post('/upload-image', uploadMessageImage.single('image'), messageController.uploadImage);

/**
 * @route   POST /api/messages
 * @desc    Send a new message (text or text + image_url)
 * @access  Private
 */
router.post('/', messageController.sendMessage);

/**
 * @route   GET /api/messages/:partnerId
 * @desc    Get all messages between current user and partner, marks as read
 * @access  Private
 */
router.get('/:partnerId', messageController.getMessages);

export default router;
