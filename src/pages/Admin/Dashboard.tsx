import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  Search,
  UserPlus,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  brand: string;
  stock: number;
  created_at: string;
};

type TabType = 'products' | 'orders' | 'admins';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  
  // Product state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    brand: '',
    stock: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Admin state
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchAdmins();

    // Set up Real-time subscriptions
    const productsSub = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    const ordersSub = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(productsSub);
      supabase.removeChannel(ordersSub);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) toast.error("Error fetching products");
    else setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) toast.error("Error fetching orders");
    else setOrders(data || []);
  };

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .contains('roles', ['admin'])
      .order('created_at', { ascending: false });
    if (error) toast.error("Error fetching admins");
    else setAdmins(data || []);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error("Image upload failed: " + error.message);
      return null;
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = productForm.image_url;

      if (imageFile) {
        setUploading(true);
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
        setUploading(false);
      }

      if (!finalImageUrl) {
        throw new Error("Please provide an image URL or upload a file.");
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        image_url: finalImageUrl,
        brand: productForm.brand,
        stock: Number(productForm.stock)
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success("Product updated");
        setEditingId(null);
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success("Product added");
        setIsAdding(false);
      }
      setProductForm({ name: '', description: '', price: '', image_url: '', brand: '', stock: '' });
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create user in auth and then update roles
      // Note: This requires standard Supabase signUp but we immediately mark as admin
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: adminForm.email,
        password: adminForm.password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("No user created");

      // Update public.users roles
      const { error: roleError } = await supabase
        .from('users')
        .update({ roles: ['admin'] })
        .eq('id', data.user.id);

      if (roleError) throw roleError;

      toast.success("New Admin added successfully");
      setIsAddingAdmin(false);
      setAdminForm({ email: '', password: '' });
      fetchAdmins();
    } catch (e: any) {
      toast.error(e.message || "Failed to add admin");
    } finally {
      setLoading(false);
    }
  };

  const markOrderDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Delivered' })
        .eq('id', orderId);
        
      if (error) throw error;
      toast.success(`Order marked as Delivered`);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to update order status");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      brand: p.brand,
      stock: String(p.stock)
    });
    setIsAdding(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">Admin System</h1>
          <p className="text-muted-foreground">Manage inventory, orders, and co-admins</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'products' && (
            <Button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setProductForm({ name: '', description: '', price: '', image_url: '', brand: '', stock: '' }); }} className="bg-brand-blue hover:bg-brand-light">
              <Plus className="mr-2 h-4 w-4" /> {isAdding ? 'Cancel' : 'Add Sneaker'}
            </Button>
          )}
          {activeTab === 'admins' && (
            <Button onClick={() => setIsAddingAdmin(!isAddingAdmin)} className="bg-brand-blue hover:bg-brand-light">
              <UserPlus className="mr-2 h-4 w-4" /> {isAddingAdmin ? 'Cancel' : 'New Admin'}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 flex space-x-6 border-b border-white/10 pb-2">
        {(['products', 'orders', 'admins'] as TabType[]).map(tab => (
          <button 
            key={tab}
            className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-blue/60 hover:text-brand-blue'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'products' ? <Package size={18} /> : tab === 'orders' ? <ShoppingBag size={18} /> : <Users size={18} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isAdding && activeTab === 'products' && (
          <Card className="mb-8 border-brand-blue/30 bg-card/50">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Sneaker' : 'Add New Sneaker'}</CardTitle>
              <CardDescription>Enter the details below to update the inventory.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Air Jordan 1 Retro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input required value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} placeholder="e.g. Nike" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (Ksh)</Label>
                      <Input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} 
                      className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-light"
                    />
                  </div>
                  <div className="space-y-2 text-center opacity-50">
                    <span className="text-xs uppercase font-bold">OR</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL (Optional if uploading)</Label>
                    <Input value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea 
                      required 
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-brand-blue"
                      value={productForm.description} 
                      onChange={e => setProductForm({...productForm, description: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-span-1 flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={loading || uploading} className="w-full bg-brand-blue font-bold uppercase transition-transform active:scale-95">
                    {loading || uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {uploading ? 'Uploading Image...' : editingId ? 'Update Sneaker' : 'Add Sneaker'}
                  </Button>
                  <Button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-8 bg-brand-blue hover:bg-brand-light">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isAddingAdmin && activeTab === 'admins' && (
          <Card className="mb-8 border-brand-blue/30 bg-card/50">
            <CardHeader>
              <CardTitle>Add Co-Admin</CardTitle>
              <CardDescription>Created admins will have full access to this dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="flex flex-col gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Passcode</Label>
                  <Input type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                </div>
                <Button type="submit" disabled={loading} className="bg-brand-blue font-bold uppercase">
                  {loading ? 'Creating Account...' : 'Create Admin Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" size={18} />
              <Input 
                placeholder="Search sneakers by name or brand..." 
                className="pl-10 bg-card/30 border-white/10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredProducts.map(p => (
                <Card key={p.id} className="group overflow-hidden border-white/5 bg-card/20 transition-all hover:border-brand-blue/30">
                  <CardContent className="flex p-0">
                    <div className="w-1/3 overflow-hidden bg-black/40">
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold uppercase text-brand-blue">{p.brand}</div>
                          <h3 className="text-lg font-bold text-white">{p.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg font-bold text-brand-blue">Ksh {p.price.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                      <div className="mt-auto flex justify-end gap-2 pt-4">
                        <Button size="sm" onClick={() => startEditing(p)} className="h-8 bg-brand-blue hover:bg-brand-light">
                          <Edit3 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)} className="h-8 text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue">
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Package className="mx-auto mb-4 text-brand-blue" size={48} />
                  <p className="text-muted-foreground">No sneakers found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-card/20">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Delivery Details</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-white/80">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 font-bold text-brand-blue">Ksh {order.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter ${
                        (order.status === 'completed' || order.status?.toLowerCase() === 'delivered') ? 'bg-green-500/20 text-green-400' : 
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold">{order.contact_phone}</div>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap max-w-xs">{order.delivery_address}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      <Button 
                        size="sm" 
                        className="h-8 bg-brand-blue hover:bg-brand-light disabled:opacity-50"
                        onClick={() => markOrderDelivered(order.id)}
                        disabled={order.status === 'completed' || order.status?.toLowerCase() === 'delivered'}
                      >
                        Mark Complete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admins.map(admin => (
              <Card key={admin.id} className="border-white/5 bg-card/20">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{admin.email}</div>
                    <div className="text-xs text-muted-foreground">Joined {format(new Date(admin.created_at), 'MMM yyyy')}</div>
                    <div className="mt-1 flex gap-1">
                      {admin.roles.map((r: string) => (
                        <span key={r} className="rounded bg-brand-blue/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-blue">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
