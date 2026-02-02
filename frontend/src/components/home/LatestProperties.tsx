import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { PropertyCard } from '../properties/PropertyCard';
import { Property } from '../../types';
import { propertiesApi } from '../../api/properties';

const LatestProperties = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestProperties = async () => {
            try {
                const response = await propertiesApi.getAll({ limit: 8, page: 1 });
                if (response.success && response.data) {
                    setProperties(response.data);
                }
            } catch (error) {
                console.error('Error fetching latest properties:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestProperties();
    }, []);

    return (
        <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                            Bất động sản mới nhất
                        </h2>
                        <p className="text-muted-foreground">
                            Tin đăng mới được cập nhật liên tục
                        </p>
                    </div>
                    <Button variant="outline" asChild className="hidden sm:flex">
                        <Link to="/properties">
                            Xem tất cả
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="overflow-hidden rounded-xl border bg-card">
                                <Skeleton className="aspect-[4/3] w-full" />
                                <div className="p-4">
                                    <Skeleton className="mb-2 h-5 w-3/4" />
                                    <Skeleton className="mb-2 h-4 w-1/2" />
                                    <Skeleton className="h-6 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card p-8 text-center">
                        <p className="text-muted-foreground">
                            Chưa có tin đăng. Hãy là người đầu tiên đăng tin!
                        </p>
                        <Button asChild className="mt-4">
                            <Link to="/properties/create">Đăng tin ngay</Link>
                        </Button>
                    </div>
                )}

                <div className="mt-6 text-center sm:hidden">
                    <Button variant="outline" asChild>
                        <Link to="/properties">
                            Xem tất cả
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default LatestProperties;
