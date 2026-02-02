import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogApi } from '../api/blog';
import { BlogPost } from '../types';
import { Button } from '../components/common/Button';
import { ArrowLeft, Calendar, User, Eye, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const BlogDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            loadPost(slug);
        }
    }, [slug]);

    const loadPost = async (postSlug: string) => {
        setIsLoading(true);
        try {
            const response = await blogApi.getBySlug(postSlug);
            if (response.success && response.data) {
                setPost(response.data);
            }
        } catch (error) {
            console.error('Failed to load blog post:', error);
            toast.error('Không thể tải bài viết');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Đã sao chép link!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="animate-pulse">
                        <div className="h-96 bg-gray-300 rounded-lg mb-6" />
                        <div className="h-8 bg-gray-300 rounded w-3/4 mb-4" />
                        <div className="h-4 bg-gray-300 rounded w-1/2 mb-8" />
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-300 rounded" />
                            <div className="h-4 bg-gray-300 rounded" />
                            <div className="h-4 bg-gray-300 rounded w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Không tìm thấy bài viết
                    </h2>
                    <Button variant="primary" onClick={() => navigate('/blog')}>
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/blog')}
                    className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại
                </button>

                {/* Article */}
                <article className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="h-96 bg-gray-200">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8">
                        {/* Title */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {post.title}
                        </h1>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
                            <div className="flex items-center gap-6 text-gray-600">
                                {post.author && (
                                    <div className="flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        <span>{post.author.full_name}</span>
                                    </div>
                                )}
                                {post.published_at && (
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        <span>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                {post.view_count !== undefined && (
                                    <div className="flex items-center">
                                        <Eye className="w-5 h-5 mr-2" />
                                        <span>{post.view_count} lượt xem</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleShare}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <div className="text-xl text-gray-700 mb-6 font-medium italic">
                                {post.excerpt}
                            </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-lg max-w-none">
                            <div
                                className="text-gray-700 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: post.content || '' }}
                            />
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary-100 hover:text-primary-700 cursor-pointer transition-colors"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Author Info */}
                        {post.author && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Về tác giả</h3>
                                <div className="flex items-start">
                                    {post.author.avatar_url ? (
                                        <img
                                            src={post.author.avatar_url}
                                            alt={post.author.full_name}
                                            className="w-16 h-16 rounded-full mr-4"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                                            <span className="text-primary-600 font-semibold text-xl">
                                                {post.author.full_name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1">
                                            {post.author.full_name}
                                        </div>
                                        {post.author.bio && (
                                            <p className="text-gray-600 text-sm">{post.author.bio}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </div>
    );
};
