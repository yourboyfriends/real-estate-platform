import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { useAuth } from '../contexts/authcontexts';
import logo from '../assets/pmax-land-YanJpgblwnTjzgxo.png';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Register state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        role?: string;
    }>({});

    const validate = () => {
        const newErrors: {
            fullName?: string;
            email?: string;
            password?: string;
            confirmPassword?: string;
            role?: string;
        } = {};

        if (!fullName) {
            newErrors.fullName = 'Họ tên là bắt buộc';
        } else if (fullName.length < 2) {
            newErrors.fullName = 'Họ tên tối thiểu 2 ký tự';
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await register(email, password, fullName, role);
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
                    <h1 className="text-2xl font-bold text-foreground">Đăng ký tài khoản</h1>
                    <p className="mt-2 text-muted-foreground">
                        Tạo tài khoản mới để bắt đầu sử dụng Pmaxland
                    </p>
                </div>

                {/* Register Form */}
                <div className="rounded-xl border bg-card p-6 shadow-lg">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    className="pl-10"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-sm text-destructive">{errors.fullName}</p>
                            )}
                        </div>

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
                            <label className="text-sm font-medium text-foreground">Loại tài khoản</label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Chọn loại tài khoản" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Khách hàng</span>
                                            <span className="text-xs text-muted-foreground">Tìm kiếm và xem bất động sản</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="broker">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Môi giới</span>
                                            <span className="text-xs text-muted-foreground">Đăng tin và quản lý bất động sản</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role}</p>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="text-primary font-medium hover:underline">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Bằng việc đăng ký, bạn đồng ý với{' '}
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
