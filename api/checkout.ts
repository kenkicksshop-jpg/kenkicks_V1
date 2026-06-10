import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      } else {
        user = data.user;
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

    return res.status(200).json({ success: true, orderId: order.id });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: err.message || "Failed to place order" });
  }
}
