import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search } from 'lucide-react';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const brand = searchParams.get('brand');
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('shop_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brand, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      
      if (brand) {
        query = query.eq('brand', brand);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let results = data.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.created_at).getTime(),
        updatedAt: new Date(doc.updated_at).getTime(),
        imageUrl: doc.image_url
      })) as Product[];

      // Client-side search as fallback
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        results = results.filter(p => 
          p.name.toLowerCase().includes(lowerQ) || 
          p.description.toLowerCase().includes(lowerQ) ||
          p.brand.toLowerCase().includes(lowerQ)
        );
      }

      setProducts(results);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wider">
            {searchQuery ? `Search Results for "${searchQuery}"` : brand ? `${brand} Sneakers` : 'All Sneakers'}
          </h1>
          <p className="text-muted-foreground">{products.length} Products Found</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-blue" />
          <Input 
            placeholder="Filter products..." 
            className="pl-9"
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), q: e.target.value });
              } else {
                const params = new URLSearchParams(searchParams);
                params.delete('q');
                setSearchParams(params);
              }
            }}
            defaultValue={searchQuery || ''}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 sm:h-80 animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <Card className="h-full overflow-hidden bg-card">
                <div className="aspect-square bg-muted/30 p-3 sm:p-6">
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                </div>
                <CardContent className="p-3 sm:p-4">
                  <div className="mb-1 text-[10px] sm:text-xs font-bold text-muted-foreground">{product.brand}</div>
                  <h3 className="mb-1 sm:mb-2 truncate text-sm sm:text-base font-bold">{product.name}</h3>
                  <div className="font-display text-base sm:text-xl font-bold text-brand-blue">
                    Ksh {product.price.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
          <Search className="mb-4 h-8 w-8 opacity-50 text-brand-blue" />
          <p>No products found matching your criteria.</p>
          {(brand || searchQuery) && (
            <Link to="/shop">
              <Button className="mt-4 bg-brand-blue hover:bg-brand-light">
                Clear Filters
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
