import { Link } from 'react-router-dom';

const categories = [
  {
    slug: 'apartment',
    name: 'Căn hộ/Chung cư',
    count: '25,000+',
    image: '/images/categories/apartment.png',
  },
  {
    slug: 'house',
    name: 'Nhà riêng',
    count: '18,000+',
    image: '/images/categories/house.png',
  },
  {
    slug: 'villa',
    name: 'Biệt thự',
    count: '5,000+',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
  },
  {
    slug: 'land',
    name: 'Đất nền',
    count: '30,000+',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
  },
  {
    slug: 'office',
    name: 'Văn phòng',
    count: '8,000+',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
  },
  {
    slug: 'shophouse',
    name: 'Mặt bằng kinh doanh',
    count: '6,000+',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  },
  {
    slug: 'room',
    name: 'Phòng trọ',
    count: '12,000+',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
  },
  {
    slug: 'warehouse',
    name: 'Nhà xưởng/Kho',
    count: '3,000+',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
  },
];

const CategorySection = () => {
  return (
    <section className="py-12 lg:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            Khám phá theo loại bất động sản
          </h2>
          <p className="text-muted-foreground">
            Chọn loại bất động sản bạn đang quan tâm
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/properties?property_type=${category.slug}`}
              className="group relative overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl"
            >
              {/* Image Background */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="mb-1 text-sm font-semibold lg:text-base drop-shadow-lg">
                  {category.name}
                </h3>
                <p className="text-xs opacity-90 lg:text-sm">
                  {category.count} tin đăng
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 border-2 border-transparent transition-colors group-hover:border-primary rounded-xl" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
