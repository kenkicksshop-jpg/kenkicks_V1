import React from 'react';
import { useWishlistStore } from '../store/wishlistStore';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore();

  const handleRemove = (productId: string) => {
    removeItem(productId);
    toast.success("Removed from wishlist");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-display text-3xl font-bold uppercase tracking-wider">Your Wishlist is Empty</h2>
        <p className="mb-8 text-muted-foreground">Save items you love here.</p>
        <Link to="/shop">
          <Button size="lg" className="bg-brand-blue font-bold uppercase">
            Browse Sneakers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold uppercase tracking-wider">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {items.map(({ productId, product }) => (
          <Card key={productId} className="group relative overflow-hidden bg-card shadow-md transition-shadow hover:shadow-lg">
            <Link to={`/product/${product.id}`}>
              <div className="aspect-square bg-muted/30 p-3 sm:p-6">
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="mb-1 text-[10px] sm:text-xs font-bold text-brand-blue/60">{product.brand}</div>
                <h3 className="mb-1 sm:mb-2 truncate text-sm sm:text-base font-bold text-foreground">{product.name}</h3>
                <div className="font-display text-base sm:text-xl font-bold text-brand-blue">
                  Ksh {product.price.toLocaleString()}
                </div>
              </CardContent>
            </Link>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                handleRemove(productId);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
