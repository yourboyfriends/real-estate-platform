import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/authcontexts';
import logo from '../assets/pmax-land-YanJpgblwnTjzgxo.png';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            // Error handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-block mb-4">
                        <img src={logo} alt="Pmaxland" className="h-20 w-auto mx-auto" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Đăng nhập</h1>
                    <p className="mt-2 text-muted-foreground">
                        Chào mừng bạn quay trở lại Pmaxland
                    </p>
                </div>

                {/* Login Form */}
                <div className="rounded-xl border bg-card p-6 shadow-lg">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-border" />
                                <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary hover:underline">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-primary font-medium hover:underline">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Bằng việc đăng nhập, bạn đồng ý với{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                        Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                        Chính sách bảo mật
                    </Link>
                </p>
            </div>
        </div>
    );
};
