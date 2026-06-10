import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Wishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState<{ wishlistItemId: string; product: Product }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchWishlist = async () => {
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('id, products(*)')
          .eq('user_id', user.id);

        if (error) throw error;
        
        const results = data.map((item: any) => ({
          wishlistItemId: item.id,
          product: {
            ...item.products,
            createdAt: new Date(item.products.created_at).getTime(),
            updatedAt: new Date(item.products.updated_at).getTime(),
            imageUrl: item.products.image_url
          } as Product
        }));

        setProducts(results);
      } catch (error) {
        console.error("Error fetching wishlist", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const removeWishlistItem = async (wishlistItemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', wishlistItemId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProducts(products.filter(p => p.wishlistItemId !== wishlistItemId));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-24 text-center">Loading wishlist...</div>;
  }

  if (products.length === 0) {
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {products.map(({ wishlistItemId, product }) => (
          <Card key={wishlistItemId} className="group relative overflow-hidden bg-card shadow-md transition-shadow hover:shadow-lg">
            <Link to={`/product/${product.id}`}>
              <div className="aspect-square bg-muted/30 p-6">
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
              </div>
              <CardContent className="p-4">
                <div className="mb-1 text-xs font-bold text-brand-blue/60">{product.brand}</div>
                <h3 className="mb-2 truncate font-bold text-foreground">{product.name}</h3>
                <div className="font-display text-xl font-bold text-brand-blue">
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
                removeWishlistItem(wishlistItemId);
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
