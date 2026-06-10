import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowRight, ShieldCheck, Truck, Tag } from 'lucide-react';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('home_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchFeatured)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeatured = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      
      // Map created_at to createdAt for frontend UI mapping
      const products = data.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.created_at).getTime(),
        updatedAt: new Date(doc.updated_at).getTime(),
        imageUrl: doc.image_url
      })) as Product[];
      
      setFeaturedProducts(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-end overflow-hidden bg-black">
        {/* Background Image Container */}
        <div className="absolute inset-0">
          <img 
            src="/KenKicks1.jpeg" 
            alt="KenKicks - Step Up. Stand Out." 
            className="h-full w-full object-cover sm:object-contain object-center" 
          />
        </div>
        
        {/* Edge blending gradients */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white via-white/40 to-transparent z-10 pointer-events-none"></div>

        {/* Action Content overlay */}
        <div className="relative z-20 flex flex-col items-center gap-6 px-4 pb-16 w-full max-w-4xl text-center">
          <p className="text-lg font-medium text-zinc-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-xl leading-relaxed max-w-2xl">
            Authentic kicks. The heat you need, delivered fast. Shop the latest from Nike, Adidas, Jordan, and more at KenKicks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/shop">
              <Button size="lg" className="h-14 bg-brand-blue px-8 text-lg font-bold uppercase tracking-wider text-white hover:bg-brand-light shadow-[0_0_20px_rgba(43,89,255,0.3)]">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border/40 bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold">AUTHENTIC QUALITY</h3>
              <p className="text-sm text-muted-foreground">100% genuine sneakers. We verify everything.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold">FAST DELIVERY</h3>
              <p className="text-sm text-muted-foreground">Get your kicks quick and secure.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
                <Tag className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold">BEST PRICES EVERYDAY</h3>
              <p className="text-sm text-muted-foreground">Unbeatable value on the hottest drops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-24">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold uppercase tracking-wider">New Arrivals</h2>
            <p className="text-muted-foreground">The freshest drops just landed.</p>
          </div>
          <Link to="/shop">
            <Button className="hidden bg-brand-blue font-semibold hover:bg-brand-light sm:block">
              View All
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg bg-muted"></div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden bg-card shadow-md transition-shadow hover:shadow-lg">
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
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            No products found. Add some in the admin panel.
          </div>
        )}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link to="/shop">
            <Button variant="outline" className="w-full">View All</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
