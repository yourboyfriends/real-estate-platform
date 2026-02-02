import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, MapPin } from 'lucide-react';

const HeroSection = () => {
    const navigate = useNavigate();
    const [listingType, setListingType] = useState<'sale' | 'rent'>('sale');
    const [propertyType, setPropertyType] = useState('all');
    const [city, setCity] = useState('all');
    const [keyword, setKeyword] = useState('');

    const cities = [
        'TP. Hồ Chí Minh',
        'Hà Nội',
        'Đà Nẵng',
        'Bình Dương',
        'Đồng Nai',
        'Khánh Hòa',
        'Hải Phòng',
        'Cần Thơ',
    ];

    const propertyTypes = [
        { value: 'apartment', label: 'Căn hộ/Chung cư' },
        { value: 'house', label: 'Nhà riêng' },
        { value: 'villa', label: 'Biệt thự' },
        { value: 'land', label: 'Đất nền' },
        { value: 'office', label: 'Văn phòng' },
        { value: 'shop', label: 'Mặt bằng kinh doanh' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (listingType) params.set('listing_type', listingType);
        if (propertyType && propertyType !== 'all') params.set('property_type', propertyType);
        if (city && city !== 'all') params.set('city', city);
        if (keyword) params.set('search', keyword);
        navigate(`/properties?${params.toString()}`);
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 lg:py-24">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -right-4 bottom-0 h-72 w-72 rounded-full bg-green-500/5 blur-3xl" />
            </div>

            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Tìm kiếm{' '}
                        <span className="text-gradient">Bất Động Sản</span>{' '}
                        toàn quốc
                    </h1>
                    <p className="mb-8 text-lg text-muted-foreground">
                        Hơn 100,000+ tin đăng bất động sản mua bán, cho thuê trên toàn quốc
                    </p>

                    {/* Search Form */}
                    <div className="rounded-xl bg-card p-4 shadow-lg sm:p-6">
                        {/* Listing Type Tabs */}
                        <Tabs
                            value={listingType}
                            onValueChange={(value) => setListingType(value as 'sale' | 'rent')}
                            className="mb-4"
                        >
                            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
                                <TabsTrigger value="sale" className="px-6">
                                    Nhà đất bán
                                </TabsTrigger>
                                <TabsTrigger value="rent" className="px-6">
                                    Nhà đất cho thuê
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <form onSubmit={handleSearch}>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Property Type */}
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Loại bất động sản" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả loại</SelectItem>
                                        {propertyTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* City */}
                                <Select value={city} onValueChange={setCity}>
                                    <SelectTrigger>
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Tỉnh/Thành phố" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toàn quốc</SelectItem>
                                        {cities.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Keyword */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <Input
                                        type="text"
                                        placeholder="Nhập từ khóa tìm kiếm..."
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                    />
                                </div>

                                {/* Search Button */}
                                <Button type="submit" className="w-full">
                                    <Search className="mr-2 h-4 w-4" />
                                    Tìm kiếm
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Quick stats */}
                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-card p-4 shadow-sm">
                            <div className="text-2xl font-bold text-primary">100K+</div>
                            <div className="text-sm text-muted-foreground">Tin đăng</div>
                        </div>
                        <div className="rounded-lg bg-card p-4 shadow-sm">
                            <div className="text-2xl font-bold text-primary">50K+</div>
                            <div className="text-sm text-muted-foreground">Người dùng</div>
                        </div>
                        <div className="rounded-lg bg-card p-4 shadow-sm">
                            <div className="text-2xl font-bold text-primary">63</div>
                            <div className="text-sm text-muted-foreground">Tỉnh thành</div>
                        </div>
                        <div className="rounded-lg bg-card p-4 shadow-sm">
                            <div className="text-2xl font-bold text-primary">500+</div>
                            <div className="text-sm text-muted-foreground">Dự án</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
