import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    address: '',
    phone: ''
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const generateWhatsappPrompt = (cartItems: any[], totalPrice: number, orderId: string, customerName: string) => {
    // 1. Build the Item List
    const itemDetails = cartItems.map(item => 
      `• *${item.name}* (x${item.quantity}) - KES ${item.price.toLocaleString()}`
    ).join('\n');

    // 2. The Final Message "Prompt"
    return `*NEW ORDER RECEIVED* 🛒
--------------------------
*Order ID:* #${orderId}

*Items:*
${itemDetails}

*Total Amount:* KES ${totalPrice.toLocaleString()}
--------------------------
*Customer Name:* ${customerName}
_Please confirm availability and delivery steps._`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          items: items,
          total: total
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Order successfully placed in DB. Now redirect to WhatsApp.
      const myPhone = "254792939794";
      const message = generateWhatsappPrompt(items, total, data.orderId.slice(0, 8).toUpperCase(), formData.name);
      const encodedMessage = encodeURIComponent(message);
      
      // Open WhatsApp in new tab
      window.open(`https://wa.me/${myPhone}?text=${encodedMessage}`, '_blank');

      clearCart();
      toast.success("Order placed successfully! Redirecting to WhatsApp...");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold uppercase tracking-wider">Checkout</h1>
      
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardContent className="space-y-6 p-6">
              <h2 className="font-display text-2xl font-bold uppercase">Delivery Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Official Names</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    disabled={!!user}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    required 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    disabled={!!user}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact / Phone Number</Label>
                  <Input 
                    id="phone" 
                    required 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="07XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input 
                    id="address" 
                    required 
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, City, Building"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-brand-blue font-bold uppercase hover:bg-brand-light"
            disabled={loading}
          >
            {loading ? 'Processing...' : `Place Order (Ksh ${total.toLocaleString()})`}
          </Button>
        </form>

        <div>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <h2 className="mb-6 font-display text-2xl font-bold uppercase">Order Summary</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-contain" />
                      </div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-bold">Ksh {(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                
                <div className="my-4 border-t border-border"></div>
                <div className="flex justify-between font-display text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-brand-blue">Ksh {total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
