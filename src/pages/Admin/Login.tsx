import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { ShieldAlert, Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptingRedirect, setAttemptingRedirect] = useState(false);
  const { loginWithEmail, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Watch for successful admin authentication
  useEffect(() => {
    if (attemptingRedirect && isAdmin) {
      navigate('/admin');
      setAttemptingRedirect(false);
      setLoading(false);
    }
  }, [isAdmin, attemptingRedirect, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await loginWithEmail(email, passcode);
      if (error) {
        toast.error("Invalid credentials. Please contact the lead admin.");
        setLoading(false);
      } else {
        toast.success("Welcome back, Admin");
        setAttemptingRedirect(true);
        // Set a timeout in case admin status check fails
        setTimeout(() => {
          if (!isAdmin) {
            toast.error("Failed to verify admin status. Please try again.");
            setAttemptingRedirect(false);
            setLoading(false);
          }
        }, 3000);
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-brand-blue/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
            <ShieldAlert size={28} />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight">Admin Gate</CardTitle>
          <CardDescription>
            Enter your credentials to access the management panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Username (Email)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@kenkicks.com" 
                  required 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="passcode" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="pl-10"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-brand-blue font-bold uppercase hover:bg-brand-light"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
