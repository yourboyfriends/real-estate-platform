import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Eye, ExternalLink, Share2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { generateSlug, RssArticle } from './BlogPage';

const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fvnexpress.net%2Frss%2Fbat-dong-san.rss';

export const BlogDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<RssArticle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(RSS_URL)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok' && data.items) {
                    const found = data.items.find((item: any) => generateSlug(item.title) === slug);
                    if (found) {
                        const imgMatch = found.description.match(/<img[^>]+src="([^">]+)"/);
                        let rawImage = imgMatch ? imgMatch[1] : found.thumbnail;
                        if (rawImage) {
                           rawImage = rawImage.replace(/&amp;/g, '&');
                        }
                        const image = rawImage ? `https://wsrv.nl/?url=${encodeURIComponent(rawImage)}` : '/placeholder.svg';
                        
                        // Set initial data from RSS
                        setPost({
                            id: found.guid || Date.now().toString(),
                            title: found.title,
                            slug: generateSlug(found.title),
                            excerpt: found.description,
                            content: '<div class="text-center py-8"><span class="animate-pulse">Đang tải nội dung chi tiết...</span></div>',
                            category: 'Bất động sản',
                            author: found.author || 'VNExpress',
                            published_at: new Date(found.pubDate.replace(' ', 'T')).toLocaleDateString('vi-VN'),
                            view_count: Math.floor(Math.random() * 2000) + 500,
                            featured_image: image,
                            link: found.link
                        });

                        // Fetch full article content via CORS proxy using corsproxy.io (more reliable than allorigins)
                        return fetch(`https://corsproxy.io/?${encodeURIComponent(found.link)}`)
                            .then(res => res.text()) // corsproxy returns raw HTML
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                // VNExpress article body is usually inside .fck_detail
                                const articleBody = doc.querySelector('.fck_detail');
                                
                                if (articleBody) {
                                    // Remove unwanted elements like related news inside the body
                                    articleBody.querySelectorAll('.box_tinlienquan, .detail-relate, script, iframe').forEach(el => el.remove());
                                    
                                    // Proxy all images inside content
                                    articleBody.querySelectorAll('img').forEach(img => {
                                      const dataSrc = img.getAttribute('data-src');
                                      let src = dataSrc || img.getAttribute('src');
                                      if (src && !src.startsWith('data:')) {
                                          src = src.replace(/&amp;/g, '&');
                                          img.setAttribute('src', `https://wsrv.nl/?url=${encodeURIComponent(src)}`);
                                          img.removeAttribute('data-src');
                                      }
                                      img.className = 'w-full rounded-xl my-4 object-cover';
                                    });

                                    setPost(prev => prev ? { ...prev, content: articleBody.innerHTML } : null);
                                } else {
                                    setPost(prev => prev ? { ...prev, content: found.description } : null);
                                }
                            });
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài viết</h2>
                <Button onClick={() => navigate('/blog')} className="bg-green-600 hover:bg-green-700">
                    Quay lại tin tức
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Actions Top */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại danh sách
                    </button>
                    <button 
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Chia sẻ
                    </button>
                </div>

                {/* Article Card */}
                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {post.featured_image && (
                        <div className="w-full h-[400px] bg-gray-200">
                            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    
                    <div className="p-8 md:p-12">
                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-500 font-medium pb-8 mb-8 border-b border-gray-100">
                            <span className="flex items-center gap-2"><User className="w-4 h-4" />{post.author}</span>
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{post.published_at}</span>
                            <span className="flex items-center gap-2"><Eye className="w-4 h-4" />{post.view_count} xem</span>
                        </div>

                        {/* RSS Summary / Content. RSS descriptions usually output the image and short text block inline */}
                        <div className="prose prose-lg prose-green max-w-none prose-img:rounded-xl">
                            {/* We use dangerouslySetInnerHTML to render the HTML returned by the RSS feed */}
                            <div 
                              className="text-gray-700 leading-relaxed space-y-4"
                              dangerouslySetInnerHTML={{ __html: post.content }} 
                            />
                        </div>

                        {/* External Source Action CTA */}
                        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center text-center">
                            <p className="text-gray-500 mb-4 font-medium">Bạn muốn đọc chi tiết toàn bộ nội dung bài viết này?</p>
                            <a 
                              href={post.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition duration-300 shadow-md hover:shadow-lg"
                            >
                                Đọc bài viết gốc trên VNExpress
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BlogDetailPage;
