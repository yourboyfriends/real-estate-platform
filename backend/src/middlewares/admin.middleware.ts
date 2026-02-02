import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID required'
            });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Admin access required'
            });
        }

        // User is admin, proceed
        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const requireBrokerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID required'
            });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User not found'
            });
        }

        // Check if user is broker or admin
        if (user.role !== 'broker' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Broker or Admin access required'
            });
        }

        // User is broker or admin, proceed
        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
