import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card py-12 text-card-foreground">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold italic tracking-wider text-primary">KENKICKS</h3>
            <p className="text-sm text-muted-foreground">
              STEP UP. STAND OUT.<br />
              Authentic sneakers. Fast delivery. Best prices everyday.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold uppercase">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-primary">All Sneakers</Link></li>
              <li><Link to="/shop?brand=Nike" className="hover:text-primary"></Link></li>
              <li><Link to="/shop?brand=Adidas" className="hover:text-primary"></Link></li>
              <li><Link to="/shop?brand=Jordan" className="hover:text-primary"></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold uppercase">Customer Service</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Phone or WhatsApp: <a href="https://wa.me/254791851929" target="_blank" rel="noopener noreferrer" className="hover:text-primary">0791851929</a></li>
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold uppercase">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/ken._.mwita?igsh=MWxodGd1ZnF1cXBneQ==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram @Kenkicks</span>
              </a>
              <a href="https://tiktok.com/@ken_mwita" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.45-2.39 6.08-1.58 1.7-3.83 2.72-6.19 2.87-2.31.15-4.66-.27-6.57-1.48-1.99-1.25-3.37-3.32-3.8-5.6-.45-2.45.12-5.12 1.56-7.14 1.25-1.74 3.16-2.9 5.25-3.32 1.22-.24 2.5-.22 3.73-.02v4.06c-1.39-.1-2.82.16-3.95.96-1.17.82-1.92 2.15-2.14 3.55-.22 1.48.16 3.06 1.09 4.2 1.01 1.24 2.58 1.93 4.16 2.01 1.57.08 3.16-.36 4.39-1.35 1.15-.92 1.83-2.33 1.92-3.81.16-2.58.07-5.18.09-7.76-.01-4.04-.01-8.08-.01-12.12z" />
                </svg>
                <span className="sr-only">TikTok @Kenkicks</span>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} KENKICKS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
