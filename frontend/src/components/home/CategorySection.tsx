import { Link } from 'react-router-dom';
import { Building2, Home, Castle, TreePine, Briefcase, Store, DoorOpen, Warehouse } from 'lucide-react';

const categories = [
  {
    slug: 'apartment',
    name: 'Căn hộ/Chung cư',
    icon: Building2,
    count: '25,000+',
    color: 'bg-blue-500',
  },
  {
    slug: 'house',
    name: 'Nhà riêng',
    icon: Home,
    count: '18,000+',
    color: 'bg-green-500',
  },
  {
    slug: 'villa',
    name: 'Biệt thự',
    icon: Castle,
    count: '5,000+',
    color: 'bg-purple-500',
  },
  {
    slug: 'land',
    name: 'Đất nền',
    icon: TreePine,
    count: '30,000+',
    color: 'bg-amber-500',
  },
  {
    slug: 'office',
    name: 'Văn phòng',
    icon: Briefcase,
    count: '8,000+',
    color: 'bg-cyan-500',
  },
  {
    slug: 'shop',
    name: 'Mặt bằng kinh doanh',
    icon: Store,
    count: '6,000+',
    color: 'bg-pink-500',
  },
  {
    slug: 'room',
    name: 'Phòng trọ',
    icon: DoorOpen,
    count: '12,000+',
    color: 'bg-indigo-500',
  },
  {
    slug: 'warehouse',
    name: 'Nhà xưởng/Kho',
    icon: Warehouse,
    count: '3,000+',
    color: 'bg-orange-500',
  },
];

const CategorySection = () => {
  return (
    <section className="py-12 lg:py-16">
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
              className="group rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md lg:p-6"
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${category.color} text-white transition-transform group-hover:scale-110 lg:h-14 lg:w-14`}
              >
                <category.icon className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-foreground lg:text-base">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground lg:text-sm">
                {category.count} tin đăng
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
