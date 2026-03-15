import { Request, Response } from 'express';
import propertyService from '../services/property.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse, Property, PropertyFilters } from '../types';

export class PropertyController {
  /**
   * GET /api/properties
   * Get all properties with filters
   */
  getProperties = asyncHandler(async (req: Request, res: Response) => {
    const filters: PropertyFilters = {
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      sort: req.query.sort as string,
      listing_type: req.query.listing_type as any,
      property_type: req.query.property_type as string,
      city: req.query.city as string,
      district: req.query.district as string,
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      min_area: req.query.min_area ? parseFloat(req.query.min_area as string) : undefined,
      max_area: req.query.max_area ? parseFloat(req.query.max_area as string) : undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      search: req.query.search as string
    };

    const result = await propertyService.getProperties(filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    } as ApiResponse);
  });

  /**
   * GET /api/properties/featured
   * Get featured properties
   */
  getFeaturedProperties = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;
    const properties = await propertyService.getFeaturedProperties(limit);

    res.json({
      success: true,
      data: properties
    } as ApiResponse<Property[]>);
  });

  /**
   * GET /api/properties/:id
   * Get property by ID
   */
  getPropertyById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const incrementView = req.query.view === 'true';

    const property = await propertyService.getPropertyById(id, incrementView);

    res.json({
      success: true,
      data: property
    } as ApiResponse<Property>);
  });

  /**
   * GET /api/properties/code/:code
   * Get property by code
   */
  getPropertyByCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;
    const property = await propertyService.getPropertyByCode(code);

    res.json({
      success: true,
      data: property
    } as ApiResponse<Property>);
  });

  /**
   * GET /api/properties/:id/related
   * Get related properties
   */
  getRelatedProperties = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const properties = await propertyService.getRelatedProperties(id, limit);

    res.json({
      success: true,
      data: properties
    } as ApiResponse<Property[]>);
  });

  /**
   * POST /api/properties
   * Create new property
   */
  createProperty = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required'
      } as ApiResponse);
    }

    // Validate required fields
    const { title, listing_type, property_type, price, area, address, city } = req.body;

    if (!title || !listing_type || !property_type || !price || !area || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, listing_type, property_type, price, area, address, city'
      } as ApiResponse);
    }

    const property = await propertyService.createProperty(userId, req.body);

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully. Waiting for admin approval.'
    } as ApiResponse<Property>);
  });

  /**
   * PUT /api/properties/:id
   * Update property
   */
  updateProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const property = await propertyService.updateProperty(id, userId, req.body);

    res.json({
      success: true,
      data: property,
      message: 'Property updated successfully'
    } as ApiResponse<Property>);
  });

  /**
   * DELETE /api/properties/:id
   * Delete property
   */
  deleteProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const result = await propertyService.deleteProperty(id, userId);

    res.json({
      success: true,
      message: result.message
    } as ApiResponse);
  });

  /**
   * GET /api/properties/user/:userId
   * Get properties by user
   */
  getPropertiesByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const filters: PropertyFilters = {
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      sort: req.query.sort as string
    };

    const result = await propertyService.getPropertiesByUser(userId, filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    } as ApiResponse);
  });

  /**
   * POST /api/properties/:id/images
   * Add images to property
   */
  addPropertyImages = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      } as ApiResponse);
    }

    // Extract URLs from Cloudinary uploaded files
    const images = files.map((file: any, index) => ({
      url: file.path,  // Cloudinary URL
      is_primary: index === 0
    }));

    const result = await propertyService.addPropertyImages(id, images);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Images added successfully'
    } as ApiResponse);
  });

  /**
   * DELETE /api/properties/images/:imageId
   * Delete property image
   */
  deletePropertyImage = asyncHandler(async (req: Request, res: Response) => {
    const { imageId } = req.params;

    const result = await propertyService.deletePropertyImage(imageId);

    res.json({
      success: true,
      message: result.message
    } as ApiResponse);
  });

  /**
   * GET /api/properties/my
   * Get current user's properties (all statuses)
   */
  getMyProperties = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required'
      } as ApiResponse);
    }

    const filters: PropertyFilters = {
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      sort: req.query.sort as string
    };

    const result = await propertyService.getPropertiesByUser(userId, filters, true); // true = include all statuses

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    } as ApiResponse);
  });

  /**
   * GET /api/properties/pending
   * Get all pending properties (Admin only)
   */
  getPendingProperties = asyncHandler(async (req: Request, res: Response) => {
    const filters: PropertyFilters = {
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      sort: req.query.sort as string
    };

    const result = await propertyService.getPendingProperties(filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    } as ApiResponse);
  });

  /**
   * PUT /api/properties/:id/approve
   * Approve a pending property (Admin only)
   */
  approveProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers['user-id'] as string;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const property = await propertyService.approveProperty(id, adminId);

    res.json({
      success: true,
      data: property,
      message: 'Property approved successfully'
    } as ApiResponse<Property>);
  });

  /**
   * PUT /api/properties/:id/reject
   * Reject a pending property (Admin only)
   */
  rejectProperty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers['user-id'] as string;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const property = await propertyService.rejectProperty(id, adminId, reason);

    res.json({
      success: true,
      data: property,
      message: 'Property rejected'
    } as ApiResponse<Property>);
  });

  /**
   * GET /api/properties/stats
   * Get property statistics
   */
  getPropertyStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;

    const stats = await propertyService.getPropertyStats(userId);

    res.json({
      success: true,
      data: stats
    } as ApiResponse);
  });

  /**
   * GET /api/properties/nearby
   * Get properties near a location (lat/lng + radius in km)
   */
  getNearbyProperties = asyncHandler(async (req: Request, res: Response) => {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const city = req.query.city as string | undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const excludeId = req.query.exclude_id as string | undefined;

    const properties = await propertyService.getNearbyProperties({
      lat,
      lng,
      city,
      radiusKm: radius,
      limit,
      excludeId,
    });

    res.json({
      success: true,
      data: properties,
    } as ApiResponse);
  });
}

export default new PropertyController();