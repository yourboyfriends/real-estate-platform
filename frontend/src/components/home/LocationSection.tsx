import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const locations = [
    {
        city: 'TP. Hồ Chí Minh',
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop',
        count: '45,000+',
        districts: ['Quận 1', 'Quận 2', 'Quận 7', 'Bình Thạnh', 'Gò Vấp'],
    },
    {
        city: 'Hà Nội',
        image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=400&h=300&fit=crop',
        count: '38,000+',
        districts: ['Cầu Giấy', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Tây Hồ'],
    },
    {
        city: 'Đà Nẵng',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop',
        count: '12,000+',
        districts: ['Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn', 'Thanh Khê'],
    },
    {
        city: 'Bình Dương',
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
        count: '8,000+',
        districts: ['Thủ Dầu Một', 'Dĩ An', 'Thuận An', 'Tân Uyên'],
    },
    {
        city: 'Đồng Nai',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop',
        count: '6,000+',
        districts: ['Biên Hòa', 'Long Thành', 'Nhơn Trạch', 'Trảng Bom'],
    },
    {
        city: 'Khánh Hòa',
        image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&h=300&fit=crop',
        count: '5,000+',
        districts: ['Nha Trang', 'Cam Ranh', 'Ninh Hòa'],
    },
];

const LocationSection = () => {
    return (
        <section className="bg-muted/50 py-12 lg:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                        Bất động sản theo địa điểm
                    </h2>
                    <p className="text-muted-foreground">
                        Tìm bất động sản tại các thành phố lớn
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {locations.map((location) => (
                        <Link
                            key={location.city}
                            to={`/properties?city=${encodeURIComponent(location.city)}`}
                            className="group relative overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-xl"
                        >
                            <div className="aspect-[4/3]">
                                <img
                                    src={location.image}
                                    alt={location.city}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="mb-1 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <h3 className="text-lg font-bold">{location.city}</h3>
                                </div>
                                <p className="mb-2 text-sm text-white/80">
                                    {location.count} tin đăng
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {location.districts.slice(0, 3).map((district) => (
                                        <span
                                            key={district}
                                            className="rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur-sm"
                                        >
                                            {district}
                                        </span>
                                    ))}
                                    {location.districts.length > 3 && (
                                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur-sm">
                                            +{location.districts.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        to="/properties"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Xem tất cả địa điểm
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LocationSection;
