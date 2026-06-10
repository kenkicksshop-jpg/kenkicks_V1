import React from 'react';
import { useCartStore } from '../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-brand-blue" />
        </div>
        <h2 className="mb-2 font-display text-3xl font-bold uppercase tracking-wider">Your Cart is Empty</h2>
        <p className="mb-8 text-muted-foreground">Looks like you haven't added any heat to your cart yet.</p>
        <Link to="/shop">
          <Button size="lg" className="bg-brand-blue font-bold uppercase">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold uppercase tracking-wider">Your Cart</h1>
      
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {items.map((item) => (
              <Card key={item.productId} className="overflow-hidden">
                <CardContent className="flex items-center gap-6 p-4 sm:p-6">
                  <div className="h-24 w-24 shrink-0 rounded-md bg-muted/30 p-2 sm:h-32 sm:w-32">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between self-stretch">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold sm:text-lg">{item.name}</h3>
                        <p className="font-display text-lg font-bold text-brand-blue sm:text-xl">
                          Ksh {item.price.toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="text-brand-blue hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-md border border-input">
                        <button 
                          className="flex h-8 w-8 items-center justify-center text-lg text-brand-blue hover:bg-muted"
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button 
                          className="flex h-8 w-8 items-center justify-center text-lg text-brand-blue hover:bg-muted"
                          onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="sticky top-24 bg-card/50">
            <CardContent className="p-6">
              <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wider">Order Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Ksh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="my-4 border-t border-border"></div>
                <div className="flex justify-between font-display text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-brand-blue">Ksh {total.toLocaleString()}</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="mt-8 w-full bg-brand-blue font-bold uppercase hover:bg-brand-light"
                onClick={handleCheckoutClick}
              >
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
