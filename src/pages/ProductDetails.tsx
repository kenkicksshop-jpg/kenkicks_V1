import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { Button } from '../components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { addItem: addWishlistItem, isInWishlist } = useWishlistStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError || !productData) {
          toast.error("Product not found");
          navigate('/shop');
          return;
        }

        setProduct({
          ...productData,
          createdAt: new Date(productData.created_at).getTime(),
          updatedAt: new Date(productData.updated_at).getTime(),
          imageUrl: productData.image_url
        } as Product);

        // Fetch reviews
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: false });

          if (!reviewsError && reviewsData) {
            const mappedReviews = reviewsData.map((d: any) => ({
              id: d.id,
              userId: d.user_id,
              userEmail: d.user_email,
              rating: d.rating,
              comment: d.comment,
              createdAt: new Date(d.created_at).getTime()
            })) as Review[];
            setReviews(mappedReviews);
          }
        } catch (e) {
          console.error("Error fetching reviews", e);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return <div className="container mx-auto px-4 py-24 text-center">Loading...</div>;
  }

  if (!product) return null;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      stock: product.stock
    });
    toast.success("Added to cart");
  };

  const handleAddToWishlist = () => {
    if (isInWishlist(product.id)) {
      toast.success("Already in wishlist!");
    } else {
      addWishlistItem(product);
      toast.success("Added to wishlist!");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return toast.error("Must be logged in to review");
    
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: id,
          user_id: user.id,
          user_email: user.email || 'Anonymous',
          rating,
          comment
        })
        .select()
        .single();
        
      if (error) throw error;

      const newReview: Review = {
        id: data.id,
        userId: data.user_id,
        userEmail: data.user_email,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date(data.created_at).getTime()
      };
      
      setReviews([newReview, ...reviews]);
      setComment('');
      setRating(5);
      toast.success("Review added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 'No reviews';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-xl bg-muted/20 p-12">
          <img src={product.imageUrl} alt={product.name} className="h-full max-h-[500px] w-full object-contain drop-shadow-2xl" />
        </div>
        
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <div className="mb-2 text-sm font-bold uppercase tracking-widest text-brand-blue">{product.brand}</div>
            <h1 className="font-display text-4xl font-bold uppercase md:text-5xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-yellow-500">★ {averageRating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
            <div className="mt-4 font-display text-3xl font-bold text-primary">Ksh {product.price.toLocaleString()}</div>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>{product.description}</p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="h-14 flex-1 bg-brand-blue text-lg font-bold hover:bg-brand-light" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button size="lg" className="h-14 w-14 p-0 bg-brand-blue hover:bg-brand-light" onClick={handleAddToWishlist}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-24">
        <h2 className="mb-8 font-display text-3xl font-bold uppercase tracking-wider">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="font-bold">{review.userEmail.split('@')[0]}</div>
                    <div className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mb-2 text-yellow-500">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="sticky top-24 rounded-lg border border-border bg-card/50 p-6">
              <h3 className="mb-6 font-display text-2xl font-bold uppercase">Write a Review</h3>
              {user ? (
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Rating</label>
                    <select 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                    >
                      <option value="5">★★★★★ - Excellent</option>
                      <option value="4">★★★★☆ - Good</option>
                      <option value="3">★★★☆☆ - Average</option>
                      <option value="2">★★☆☆☆ - Poor</option>
                      <option value="1">★☆☆☆☆ - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Review</label>
                    <textarea 
                      required
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="What did you think of these kicks?"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={submittingReview} className="w-full bg-brand-blue hover:bg-brand-light">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              ) : (
                <div className="text-center rounded border border-dashed border-border p-6 text-muted-foreground">
                  Please log in to leave a review.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
