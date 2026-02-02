import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authcontexts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Menu,
  X,
  User,
  Heart,
  Bell,
  MessageSquare,
  Plus,
  LogOut,
  Settings,
  Home,
  Building2,
  FileText,
} from 'lucide-react';
import logo from '../../assets/pmax-land-YanJpgblwnTjzgxo.png';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/properties', label: 'Bất động sản', icon: Building2 },
    { href: '/blog', label: 'Tin tức', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex h-8 items-center justify-between px-4 text-sm">
          <div className="flex items-center gap-4">
            <span>Hotline: 1900 1234</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">support@pmaxland.vn</span>
          </div>
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hover:underline">
                  Đăng nhập
                </Link>
                <span>|</span>
                <Link to="/register" className="hover:underline">
                  Đăng ký
                </Link>
              </>
            ) : (
              <span>Xin chào, {user?.full_name || 'User'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Pmaxland" className="h-[60px] w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            ))}

            {/* Broker/Admin specific links */}
            {isAuthenticated && (user?.role === 'broker' || user?.role === 'admin') && (
              <Link
                to="/my-properties"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Tin của tôi
              </Link>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin/properties/pending"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Duyệt tin
              </Link>
            )}
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm nhà đất..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                  <Link to="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                  <Link to="/messages">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Tài khoản của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-properties" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Tin đăng của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Tin yêu thích
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {(user?.role === 'broker' || user?.role === 'admin') && (
                  <Button asChild className="hidden sm:flex">
                    <Link to="/properties/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Đăng tin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden sm:flex">
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">
                    <Plus className="mr-2 h-4 w-4" />
                    Đăng ký
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t bg-card lg:hidden">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm nhà đất..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (user?.role === 'broker' || user?.role === 'admin') && (
                <Link
                  to="/my-properties"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  Tin của tôi
                </Link>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin/properties/pending"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell className="h-4 w-4" />
                  Duyệt tin
                </Link>
              )}
            </nav>

            {isAuthenticated && (
              <>
                <div className="my-4 border-t" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/favorites">
                      <Heart className="mr-2 h-4 w-4" />
                      Yêu thích
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Tin nhắn
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};