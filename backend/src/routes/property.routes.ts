import { Router } from 'express';
import propertyController from '../controllers/property.controller';
import { requireAdmin, requireBrokerOrAdmin } from '../middlewares/admin.middleware';

const router = Router();

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filters
 * @access  Public
 */
router.get('/', propertyController.getProperties);

/**
 * @route   GET /api/properties/featured
 * @desc    Get featured properties
 * @access  Public
 */
router.get('/featured', propertyController.getFeaturedProperties);

/**
 * @route   GET /api/properties/my
 * @desc    Get current user's properties (all statuses)
 * @access  Private (Broker/Admin)
 */
router.get('/my', requireBrokerOrAdmin, propertyController.getMyProperties);

/**
 * @route   GET /api/properties/pending
 * @desc    Get all pending properties
 * @access  Private (Admin only)
 */
router.get('/pending', requireAdmin, propertyController.getPendingProperties);

/**
 * @route   GET /api/properties/stats
 * @desc    Get property statistics (for dashboard)
 * @access  Private
 */
router.get('/stats', propertyController.getPropertyStats);

/**
 * @route   GET /api/properties/code/:code
 * @desc    Get property by code
 * @access  Public
 */
router.get('/code/:code', propertyController.getPropertyByCode);

/**
 * @route   GET /api/properties/nearby
 * @desc    Get properties near a lat/lng location
 * @access  Public
 */
router.get('/nearby', propertyController.getNearbyProperties);

/**
 * @route   GET /api/properties/user/:userId
 * @desc    Get properties by user
 * @access  Public
 */
router.get('/user/:userId', propertyController.getPropertiesByUser);

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Public
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route   GET /api/properties/:id/related
 * @desc    Get related properties
 * @access  Public
 */
router.get('/:id/related', propertyController.getRelatedProperties);

/**
 * @route   POST /api/properties
 * @desc    Create new property
 * @access  Private (Broker/Admin)
 */
router.post('/', requireBrokerOrAdmin, propertyController.createProperty);

/**
 * @route   POST /api/properties/:id/images
 * @desc    Add images to property
 * @access  Private
 */
const { upload } = require('../config/cloudinary');
router.post('/:id/images', upload.array('images', 10), propertyController.addPropertyImages);

/**
 * @route   PUT /api/properties/:id/approve
 * @desc    Approve a pending property
 * @access  Private (Admin only)
 */
router.put('/:id/approve', requireAdmin, propertyController.approveProperty);

/**
 * @route   PUT /api/properties/:id/reject
 * @desc    Reject a pending property
 * @access  Private (Admin only)
 */
router.put('/:id/reject', requireAdmin, propertyController.rejectProperty);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property
 * @access  Private (Owner only)
 */
router.put('/:id', propertyController.updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Private (Owner only)
 */
router.delete('/:id', propertyController.deleteProperty);

/**
 * @route   DELETE /api/properties/images/:imageId
 * @desc    Delete property image
 * @access  Private
 */
router.delete('/images/:imageId', propertyController.deletePropertyImage);

export default router;