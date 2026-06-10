import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    // SECURITY LOCKDOWN: Check if any admin exists in the system
    const { data: existingAdmins, error: adminSearchError } = await supabase
      .from('users')
      .select('id')
      .contains('roles', ['admin'])
      .limit(1);

    if (adminSearchError) {
      console.error("Admin search error:", adminSearchError);
      return res.status(500).json({ error: "Failed to verify existing admins" });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({ 
        error: "An admin account already exists. For security reasons, initial setup is locked. To add co-admins, please log into the admin dashboard." 
      });
    }

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

    return res.status(200).json({ 
      success: true, 
      message: "Admin user created successfully",
      userId: data.user.id 
    });
  } catch (err) {
    console.error("Setup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
