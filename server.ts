import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Admin setup endpoint - MUST be before Vite middleware
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.VITE_SUPABASE_URL;

      if (!serviceRoleKey || !supabaseUrl) {
        return res.status(500).json({ 
          error: "Server not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env" 
        });
      }

      // Create Supabase admin client
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Add admin role to users table
      const { error: dbError } = await supabase
        .from("users")
        .upsert({
          id: data.user.id,
          email,
          roles: ["admin"],
        });

      if (dbError) {
        return res.status(400).json({ error: dbError.message });
      }

      res.json({ 
        success: true, 
        message: "Admin user created successfully",
        userId: data.user.id 
      });
    } catch (err) {
      console.error("Setup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Checkout endpoint - bypasses RLS to create users and orders
  app.post("/api/checkout", async (req, res) => {
    try {
      const { email, name, address, phone, items, total } = req.body;

      if (!email || !name || !address || !phone || !items || !items.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.VITE_SUPABASE_URL;

      if (!serviceRoleKey || !supabaseUrl) {
        return res.status(500).json({ error: "Server not configured" });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      let userId = null;

      // Check if user exists or create them
      const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === email);

      if (!user) {
        const password = Math.random().toString(36).slice(-10) + 'A1!';
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name }
        });
        
        if (error) {
          console.error("User creation failed:", error);
          // Just proceed without user ID if creating fails
        } else {
          user = data.user;
          // Trigger handles inserting into public.users, but just in case:
          await supabase.from("users").upsert({
            id: user.id,
            email,
            roles: []
          });
        }
      }
      
      userId = user?.id || null;

      // Create order
      const fullAddress = `${name} - ${address} (${email})`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total,
          status: 'pending',
          delivery_address: fullAddress,
          contact_phone: phone
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((i: any) => ({
        order_id: order.id,
        product_id: i.productId,
        quantity: i.quantity,
        price: i.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      res.json({ success: true, orderId: order.id });
    } catch (err: any) {
      console.error("Checkout error:", err);
      res.status(500).json({ error: err.message || "Failed to place order" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
