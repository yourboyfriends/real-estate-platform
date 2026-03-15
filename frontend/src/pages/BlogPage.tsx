import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight, Eye, Loader2 } from 'lucide-react';

export interface RssArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string;
  view_count: number;
  featured_image: string;
  link: string;
  content: string;
}

export const generateSlug = (text: string) => {
  return text.toString().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fvnexpress.net%2Frss%2Fbat-dong-san.rss';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const categories = ['Tất cả', 'Thị trường', 'Dự án', 'Chính sách', 'Phân tích', 'Kiến thức'];

  useEffect(() => {
    fetch(RSS_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok' && data.items) {
          const parsed = data.items.map((item: any) => {
            // VNExpress puts the image in the description inside an anchor tag.
            // Using an image proxy to bypass localhost hotlink blocking, replace &amp; with & first
            const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
            let rawImage = imgMatch ? imgMatch[1] : item.thumbnail;
            if (rawImage) {
               rawImage = rawImage.replace(/&amp;/g, '&');
            }
            const image = rawImage ? `https://wsrv.nl/?url=${encodeURIComponent(rawImage)}` : '/placeholder.svg';
            
            return {
              id: item.guid || String(Math.random()),
              title: item.title,
              slug: generateSlug(item.title),
              excerpt: stripHtml(item.description).slice(0, 150) + '...',
              content: item.content,
              category: 'Bất động sản',
              author: item.author || 'VNExpress',
              published_at: new Date(item.pubDate.replace(' ', 'T')).toLocaleDateString('vi-VN'),
              view_count: Math.floor(Math.random() * 2000) + 500, // Mock view count for effect
              featured_image: image,
              link: item.link
            };
          });
          setPosts(parsed);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600/10 to-green-600/5 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl text-gray-900">Tin tức & Kiến thức</h1>
          <p className="mb-8 text-lg text-gray-600">
            Cập nhật thông tin thị trường, kiến thức mua bán và dự án bất động sản mới nhất
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Tìm kiếm bài viết..." 
              className="bg-white pl-10 border-gray-200 focus:ring-green-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b bg-white border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === 'Tất cả' ? 'default' : 'outline'}
                size="sm"
                className={category === 'Tất cả' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 border-gray-200'}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="container mx-auto px-4 max-w-6xl py-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Không tìm thấy bài viết nào
          </div>
        ) : (
          <>
            {/* Featured Post (first item) */}
            <Card className="mb-8 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid md:grid-cols-2 h-full">
                <div className="bg-gray-200 min-h-[300px]">
                  <img
                    src={filteredPosts[0].featured_image}
                    alt={filteredPosts[0].title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="flex flex-col justify-center p-8 bg-white">
                  <Badge className="mb-4 w-fit bg-green-100 text-green-700 hover:bg-green-200 border-none">
                    {filteredPosts[0].category}
                  </Badge>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 leading-tight">
                    <Link to={`/blog/${filteredPosts[0].slug}`} className="hover:text-green-600 transition-colors">
                      {filteredPosts[0].title}
                    </Link>
                  </h2>
                  <p className="mb-6 text-gray-500 line-clamp-3">{filteredPosts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{filteredPosts[0].author}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{filteredPosts[0].published_at}</span>
                    <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{filteredPosts[0].view_count}</span>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Post Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.slice(1).map((post) => (
                <Card key={post.id} className="overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 border-gray-100 shadow-sm hover:shadow-lg">
                  <Link to={`/blog/${post.slug}`} className="block h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <CardContent className="p-5 flex-1 flex flex-col bg-white">
                    <Badge variant="secondary" className="mb-3 w-fit bg-gray-100 text-gray-600 border-none">
                      {post.category}
                    </Badge>
                    <h3 className="mb-3 font-bold text-gray-900 leading-snug">
                      <Link to={`/blog/${post.slug}`} className="hover:text-green-600 transition-colors line-clamp-2">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-100 pt-4">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{post.published_at}</span>
                      <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{post.view_count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <Button variant="outline" className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-8">
                Xem thêm bài viết gốc trên VNExpress
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
