import { forwardRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductCardSkeleton = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="bg-card border border-border rounded-lg overflow-hidden">
    <Skeleton className="aspect-square" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  </div>
));

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

export default ProductCardSkeleton;
