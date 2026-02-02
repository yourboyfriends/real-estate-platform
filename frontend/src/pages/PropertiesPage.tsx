import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../api/properties';
import { Property, PropertyFilters } from '../types';
import { PropertyCard } from '../components/properties/PropertyCard';
import { PropertyFilter } from '../components/properties/PropertyFilter';
import { Button } from '../components/common/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        total_pages: 0,
    });

    const [filters, setFilters] = useState<PropertyFilters>({
        page: Number(searchParams.get('page')) || 1,
        limit: 12,
        listing_type: searchParams.get('listing_type') as any,
        property_type: searchParams.get('property_type') || undefined,
        city: searchParams.get('city') || undefined,
        search: searchParams.get('search') || undefined,
    });

    useEffect(() => {
        loadProperties();
    }, [filters]);

    const loadProperties = async () => {
        setIsLoading(true);
        try {
            const response = await propertiesApi.getAll(filters);
            if (response.success && response.data) {
                setProperties(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to load properties:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (newFilters: PropertyFilters) => {
        const updatedFilters = { ...newFilters, page: 1 };
        setFilters(updatedFilters);

        // Update URL params
        const params = new URLSearchParams();
        Object.entries(updatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, String(value));
            }
        });
        setSearchParams(params);
    };

    const handleResetFilters = () => {
        const resetFilters: PropertyFilters = { page: 1, limit: 12 };
        setFilters(resetFilters);
        setSearchParams({});
    };

    const handlePageChange = (newPage: number) => {
        setFilters({ ...filters, page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Danh sách bất động sản
                    </h1>
                    <p className="text-gray-600">
                        Tìm thấy {pagination.total} bất động sản
                    </p>
                </div>

                {/* Filters */}
                <PropertyFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-300 h-56 rounded-t-lg" />
                                <div className="bg-white p-4 rounded-b-lg">
                                    <div className="h-4 bg-gray-300 rounded mb-2" />
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-300 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không tìm thấy bất động sản
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Thử điều chỉnh bộ lọc để tìm kiếm kết quả phù hợp hơn
                        </p>
                        <Button variant="primary" onClick={handleResetFilters}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                {[...Array(pagination.total_pages)].map((_, i) => {
                                    const page = i + 1;
                                    // Show first, last, current, and adjacent pages
                                    if (
                                        page === 1 ||
                                        page === pagination.total_pages ||
                                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.page ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                                        return <span key={page} className="px-2">...</span>;
                                    }
                                    return null;
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.total_pages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
