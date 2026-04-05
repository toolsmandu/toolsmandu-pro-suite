import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Shield, Headphones, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const { data: slides } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  useEffect(() => {
    if (!slides?.length) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides]);

  if (!slides?.length) return (
    <div className="gradient-primary py-20 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Premium Digital Subscriptions</h1>
        <p className="text-lg text-muted-foreground mb-8">Get the best software tools at unbeatable prices</p>
        <Button size="lg" asChild><Link to="/categories">Browse Products</Link></Button>
      </div>
    </div>
  );

  return (
    <div className="relative gradient-primary overflow-hidden">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map(slide => (
          <div key={slide.id} className="min-w-full">
            <Link to={slide.link_url || '#'} className="block">
              <img src={slide.image_url} alt="" className="w-full h-48 md:h-80 object-cover" />
            </Link>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

const CategorySection = ({ category }: { category: { id: string; name: string; slug: string } }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: products, isLoading } = useQuery({
    queryKey: ['category-products', category.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('category_id', category.id).limit(10);
      return data || [];
    },
  });

  if (!isLoading && !products?.length) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[220px] max-w-[220px]"><ProductCardSkeleton /></div>
        )) : products?.map(p => (
          <div key={p.id} className="min-w-[220px] max-w-[220px]">
            <ProductCard {...p} />
          </div>
        ))}
      </div>
    </section>
  );
};

const Index = () => {
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('is_featured', true).limit(9);
      return data || [];
    },
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['bestseller-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('is_bestseller', true).limit(9);
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data || [];
    },
  });

  return (
    <>
      <HeroSlider />

      <div className="container mx-auto px-4 py-12">
        {/* Featured Products */}
        {(loadingFeatured || (featuredProducts && featuredProducts.length > 0)) && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {loadingFeatured
                ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : featuredProducts?.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}

        {/* Why Buy From Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Why Buy From Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Instant Delivery', desc: 'Get your digital subscriptions delivered instantly after purchase' },
              { icon: Headphones, title: 'After-sales Support', desc: 'Dedicated customer service team available to help you anytime' },
              { icon: Shield, title: 'Service Warranty', desc: 'All products come with a warranty for your peace of mind' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        {(loadingBest || (bestSellers && bestSellers.length > 0)) && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Best Sellers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {loadingBest
                ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : bestSellers?.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}

        {/* Category Sections */}
        {categories?.map(cat => <CategorySection key={cat.id} category={cat} />)}
      </div>
    </>
  );
};

export default Index;
