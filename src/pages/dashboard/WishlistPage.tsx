import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const WishlistPage = () => {
  const { user } = useAuth();
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['my-wishlist'],
    queryFn: async () => {
      const { data } = await supabase.from('wishlist').select('*, products(*, product_variations(*))').eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  if (!wishlist?.length) return (
    <div className="text-center py-16">
      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-xl text-muted-foreground">Your wishlist is empty</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">My Wishlist</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {wishlist.map((w: any) => w.products && <ProductCard key={w.id} {...w.products} />)}
      </div>
    </div>
  );
};

export default WishlistPage;
