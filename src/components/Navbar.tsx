import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { Button } from './ui/button';
import { ShoppingCart, LogOut, User as UserIcon, Heart, Search, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Navbar() {
  const { user, isAdmin, login, logout } = useAuth();
  const cartItemsCount = useCartStore((state) => state.items.reduce((acc, i) => acc + i.quantity, 0));
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Sheet>
          <SheetTrigger render={<Button className="mr-2 px-0 text-base bg-brand-blue hover:bg-brand-light md:hidden" />}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-background/95 backdrop-blur">
            <Link to="/" className="mb-8 flex items-center space-x-2 px-7">
              <span className="font-display text-2xl font-bold italic uppercase tracking-wider !text-primary">
                KenKicks
              </span>
            </Link>
            <div className="flex flex-col space-y-4 px-7">
              <Link to="/shop" className="text-lg font-medium transition-colors hover:text-foreground/80">Shop</Link>
              {isAdmin && (
                <Link to="/admin" className="text-lg font-medium transition-colors hover:text-foreground/80">Admin Dashboard</Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-display text-2xl font-bold italic uppercase tracking-wider !text-primary sm:inline-block">
              KenKicks
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/shop" className="transition-colors hover:text-foreground/80">Shop</Link>
            {isAdmin && (
              <Link to="/admin" className="transition-colors hover:text-foreground/80">Admin</Link>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <nav className="flex items-center space-x-2">
            <Link to="/wishlist">
              <Button size="icon" className="relative bg-brand-blue hover:bg-brand-light">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/cart">
              <Button size="icon" className="relative bg-brand-blue hover:bg-brand-light">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {user && isAdmin && (
              <Button size="icon" className="bg-brand-blue hover:bg-brand-light" onClick={() => logout()} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}
