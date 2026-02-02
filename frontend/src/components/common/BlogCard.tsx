import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../../types';
import { Calendar, User, Eye } from 'lucide-react';

interface BlogCardProps {
    post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
        >
            {/* Featured Image */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
                {post.featured_image ? (
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Title */}
                <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                    </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                        {post.author && (
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                <span>{post.author.full_name}</span>
                            </div>
                        )}
                        {post.published_at && (
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        )}
                    </div>
                    {post.view_count !== undefined && (
                        <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{post.view_count}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
};
