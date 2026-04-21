import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 15;

const BlogList = () => {
  const [page, setPage] = useState(1);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs-list'],
    queryFn: async () => {
      const { data } = await supabase.from('blogs').select('*').eq('is_published', true).order('published_at', { ascending: false });
      return data || [];
    },
  });

  const totalPages = Math.max(1, Math.ceil((blogs?.length || 0) / PAGE_SIZE));
  const paginated = useMemo(() => {
    if (!blogs) return [];
    const start = (page - 1) * PAGE_SIZE;
    return blogs.slice(start, start + PAGE_SIZE);
  }, [blogs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Blog — Toolsmandu</title>
        <meta name="description" content="Tips, guides, and updates from Toolsmandu about premium digital software subscriptions." />
        <link rel="canonical" href="https://web.toolsmandu.com/blog" />
        <meta property="og:title" content="Blog — Toolsmandu" />
        <meta property="og:description" content="Tips, guides, and updates from Toolsmandu." />
        <meta property="og:url" content="https://web.toolsmandu.com/blog" />
      </Helmet>
      <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">Tips, guides, and updates from Toolsmandu.</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !blogs?.length ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map(b => (
              <Link key={b.id} to={`/${b.slug}`} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  {b.cover_image_url ? (
                    <img src={b.cover_image_url} alt={b.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full aspect-[16/9] bg-muted" />
                  )}
                  <div className="p-4 flex-1 flex flex-col bg-[#0c2d5a]">
                    <h2 className="font-semibold text-foreground line-clamp-2 group-hover:text-white transition-colors">{b.title}</h2>
                    {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-1">{b.excerpt}</p>}
                    {b.published_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) goTo(page - 1); }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {pageNumbers.map((p, i) => (
                  <PaginationItem key={i}>
                    {p === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); goTo(p); }}
                      >
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) goTo(page + 1); }}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
