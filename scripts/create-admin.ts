 import { createClient } from "@supabase/supabase-js";
 
 const supabaseUrl = "https://wsvedvdtligvaxspacal.supabase.co";
 const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzdmVkdmR0bGlndmF4c3BhY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk3MzMxOCwiZXhwIjoyMDk0NTQ5MzE4fQ.SkL6j5kWmHqp4BCsijkW9BQti_1g4AfWfVSo8RfpiW8";
 
 const supabase = createClient(supabaseUrl, supabaseServiceKey, {
   auth: {
     autoConfirm: true,
   },
 });
 
 async function createAdmin() {
   const email = "euripedes.inacio@gmail.com";
   const password = "4424253";
 
   console.log(`Creating user ${email}...`);
 
   const { data, error } = await supabase.auth.admin.createUser({
     email,
     password,
     email_confirm: true,
   });
 
   if (error) {
     console.error("Error creating user:", error.message);
     return;
   }
 
   const userId = data.user.id;
   console.log("User created with ID:", userId);
 
   console.log("Assigning admin role...");
   const { error: roleError } = await supabase
     .from("user_roles")
     .insert([{ user_id: userId, role: "admin" }]);
 
   if (roleError) {
     console.error("Error assigning role:", roleError.message);
     return;
   }
 
   console.log("Admin role assigned successfully.");
 }
 
 createAdmin();