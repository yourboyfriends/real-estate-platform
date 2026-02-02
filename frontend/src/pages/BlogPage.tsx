import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blogApi } from '../api/blog';
import { BlogPost } from '../types';
import { BlogCard } from '../components/common/BlogCard';
import { Button } from '../components/common/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BlogPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 9,
        total: 0,
        total_pages: 0,
    });

    const currentPage = Number(searchParams.get('page')) || 1;

    useEffect(() => {
        loadPosts();
    }, [currentPage]);

    const loadPosts = async () => {
        setIsLoading(true);
        try {
            const response = await blogApi.getAll({
                page: currentPage,
                limit: 9,
                status: 'published',
            });
            if (response.success && response.data) {
                setPosts(response.data);
                // Update pagination state from API response
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to load blog posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: String(newPage) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Tin tức & Blog
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Cập nhật tin tức mới nhất về thị trường bất động sản
                    </p>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-300 h-48 rounded-t-lg" />
                                <div className="bg-white p-5 rounded-b-lg">
                                    <div className="h-4 bg-gray-300 rounded mb-2" />
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có bài viết nào
                        </h3>
                        <p className="text-gray-600">
                            Hãy quay lại sau để đọc những bài viết mới nhất
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Blog Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {posts.map((post) => (
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                {[...Array(pagination.total_pages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === pagination.total_pages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === currentPage ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="px-2">...</span>;
                                    }
                                    return null;
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === pagination.total_pages}
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
