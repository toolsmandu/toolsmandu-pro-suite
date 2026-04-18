import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HomepageBlogs = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
  );

  useEffect(() => {
    const handleResize = () => {
      const count = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
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

  const { data: blogs } = useQuery({
    queryKey: ['homepage-blogs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs')
        .select('id,title,slug,excerpt,cover_image_url,published_at')
        .eq('is_published', true)
        .eq('show_on_homepage', true)
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false })
        .limit(7);
      return data || [];
    },
  });

  const totalOriginal = blogs?.length || 0;
  const canSlide = totalOriginal > visibleCount;
  const extendedBlogs = canSlide && blogs ? [...blogs, ...blogs.slice(0, visibleCount)] : blogs || [];

  // Auto-rotate right-to-left every 4s
  useEffect(() => {
    if (!canSlide) return;
    const timer = setInterval(() => {
      setCurrent(c => c + 1);
      setIsTransitioning(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [canSlide, totalOriginal]);

  // Snap back to start after reaching cloned slides
  useEffect(() => {
    if (current >= totalOriginal && canSlide) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrent(0);
      }, 500);
      return () => clearTimeout(t);
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

  if (!blogs?.length) return null;

  const slideWidthPercent = 100 / visibleCount;
  const dotCount = canSlide ? totalOriginal : 0;
  const activeDot = totalOriginal ? current % totalOriginal : 0;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground whitespace-nowrap">Blogs</h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <div className="flex items-center gap-2">
          <Link to="/blog">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium hover:bg-[rgb(59,130,246)] hover:text-white" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          {canSlide && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setCurrent(c => (c - 1 + totalOriginal) % totalOriginal); setIsTransitioning(true); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setCurrent(c => c + 1); setIsTransitioning(true); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{
            width: `${(extendedBlogs.length / visibleCount) * 100}%`,
            transform: `translateX(-${(current * slideWidthPercent) / (extendedBlogs.length / visibleCount)}%)`,
          }}
        >
          {extendedBlogs.map((b, idx) => (
            <div key={`${b.id}-${idx}`} className="px-2" style={{ width: `${100 / extendedBlogs.length}%` }}>
              <Link to={`/${b.slug}`} className="group block h-full">
                <article className="bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg h-full flex flex-col">
                  {b.cover_image_url ? (
                    <div className="overflow-hidden">
                      <img src={b.cover_image_url} alt={b.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/9] bg-muted" />
                  )}
                  <div className="p-4 flex-1 flex flex-col bg-[#0c2c5a] border-0 border-transparent">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{b.title}</h3>
                    {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-1">{b.excerpt}</p>}
                    {b.published_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>

        {dotCount > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setIsTransitioning(true); }}
                className={`h-2 rounded-full transition-all ${i === activeDot ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomepageBlogs;
