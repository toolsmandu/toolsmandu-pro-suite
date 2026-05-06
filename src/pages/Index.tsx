import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import NewInStore from '@/components/NewInStore';
import SuperSavingDeals from '@/components/SuperSavingDeals';
import HomepageBlogs from '@/components/HomepageBlogs';
import HomepageSeoContent from '@/components/HomepageSeoContent';
import { Loader2 } from 'lucide-react';

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024 ? 3 : 1);

  useEffect(() => {
    const handleResize = () => {
      const count = window.innerWidth >= 1024 ? 3 : 1;
      setVisibleCount(prev => {
        if (prev !== count) {
          setCurrent(0);
          setIsTransitioning(false);
        }
        return count;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: slides, isLoading: slidesLoading } = useQuery({
    queryKey: ['hero-slides'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  const totalOriginal = slides?.length || 0;
  const canSlide = totalOriginal > visibleCount;

  // Build track: [visibleCount copies for seamless loop] original slides + first visibleCount cloned
  const extendedSlides = canSlide
    ? [...slides!, ...slides!.slice(0, visibleCount)]
    : slides || [];

  useEffect(() => {
    if (!canSlide) return;
    const timer = setInterval(() => {
      setCurrent(c => c + 1);
      setIsTransitioning(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [canSlide, totalOriginal]);

  // Snap back when reaching clone zone
  useEffect(() => {
    if (current >= totalOriginal && canSlide) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrent(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [current, totalOriginal, canSlide]);

  // Re-enable transition after snap
  useEffect(() => {
    if (!isTransitioning && current === 0) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsTransitioning(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning, current]);

  if (slidesLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!slides?.length) return (
    <div className="gradient-primary py-20 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Premium Digital Subscriptions</h1>
        <p className="text-lg text-muted-foreground mb-8">Get the best software tools at unbeatable prices</p>
        <Button size="lg" asChild><Link to="/categories">Browse Products</Link></Button>
      </div>
    </div>
  );

  const dotCount = canSlide ? totalOriginal : 0;
  const activeDot = current % totalOriginal;
  const slideWidthPercent = 100 / visibleCount;

  return (
    <div>
      <div className="container mx-auto px-4 relative overflow-hidden">
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{
            width: `${(extendedSlides.length / visibleCount) * 100}%`,
            transform: `translateX(-${(current * slideWidthPercent) / (extendedSlides.length / visibleCount)}%)`,
          }}
        >
          {extendedSlides.map((slide, idx) => (
            <div key={`${slide.id}-${idx}`} className="px-1" style={{ width: `${100 / extendedSlides.length}%` }}>
              <Link to={slide.link_url || '#'} className="block">
                <img src={slide.image_url} alt="" className="w-full rounded-lg object-cover aspect-[4/3]" />
              </Link>
            </div>
          ))}
        </div>
        {dotCount > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button key={i} onClick={() => { setCurrent(i); setIsTransitioning(true); }} className={`h-2 rounded-full transition-all ${i === activeDot ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/50'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CategorySection = ({ category, products }: { category: { id: string; name: string; slug: string }; products: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#ffffff] whitespace-nowrap">{category.name}</h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <div className="flex items-center gap-2">
          <Link to={`/item-category/${category.slug}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-[#ffffff] hover:bg-[rgb(59,130,246)] hover:text-white" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              View All
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {products.map(p => (
          <div key={p.id} className="min-w-[165px] max-w-[165px]">
            <ProductCard {...p} />
          </div>
        ))}
      </div>
    </section>
  );
};

const Index = () => {
  // Single query to fetch ALL products, then filter client-side
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['all-products'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, product_variations(*)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data || [];
    },
  });

  const isInStock = (p: any) => {
    const vars = (p.product_variations || []).filter((v: any) => v.is_active);
    if (vars.length > 0) return vars.some((v: any) => v.stock_status !== 'out_of_stock');
    return p.stock_status !== 'out_of_stock';
  };
  const productsByCategory = (catId: string) => allProducts?.filter(p => p.category_id === catId && isInStock(p)).slice(0, 10) || [];

  const loading = isLoading || categoriesLoading;

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <HeroSlider />
          <NewInStore />
          <div className="container mx-auto px-4 pb-12">
            <SuperSavingDeals />
            {categories?.map(cat => <CategorySection key={cat.id} category={cat} products={productsByCategory(cat.id)} />)}
            <HomepageBlogs />
            <HomepageSeoContent />
          </div>
        </>
      )}
    </>
  );
};

export default Index;
