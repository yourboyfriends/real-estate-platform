import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import LocationSection from '../components/home/LocationSection';
import FeaturedProperties from '../components/home/FeaturedProperties';
import LatestProperties from '../components/home/LatestProperties';

export const HomePage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategorySection />
      <FeaturedProperties />
      <LatestProperties />
      <LocationSection />
    </div>
  );
};