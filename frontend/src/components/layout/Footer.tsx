import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram } from 'lucide-react';
import logo from '../../assets/pmax-land-YanJpgblwnTjzgxo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src={logo} alt="Pmaxland" className="h-[100px] w-auto" />
            </div>
            <p className="text-sm">
              Nền tảng mua bán, cho thuê bất động sản hàng đầu Việt Nam
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liên kết</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/properties" className="hover:text-primary-500 transition">Bất động sản</Link></li>
              <li><Link to="/blog" className="hover:text-primary-500 transition">Tin tức</Link></li>
              <li><Link to="/about" className="hover:text-primary-500 transition">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500 transition">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-primary-500 transition">Câu hỏi thường gặp</Link></li>
              <li><Link to="/terms" className="hover:text-primary-500 transition">Điều khoản sử dụng</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-500 transition">Chính sách bảo mật</Link></li>
              <li><Link to="/guide" className="hover:text-primary-500 transition">Hướng dẫn</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              <li>Hotline: 1900 xxxx</li>
              <li>Email: support@Pmaxland.vn</li>
              <li>Địa chỉ: TP.HN, Việt Nam</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-primary-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 <span className="font-bold">P</span>maxland. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};