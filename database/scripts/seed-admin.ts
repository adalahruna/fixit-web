import { createClient } from '@supabase/supabase-js';

// Load dari .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdminUsers() {
  console.log('🌱 Seeding admin users...\n');

  const users = [
    {
      email: 'admin@bengkel.com',
      password: 'admin123',
      name: 'Admin Bengkel',
      role: 'admin',
    },
    {
      email: 'owner@bengkel.com',
      password: 'owner123',
      name: 'Owner Bengkel',
      role: 'owner',
    },
    {
      email: 'mechanic@bengkel.com',
      password: 'mechanic123',
      name: 'Mekanik Demo',
      role: 'mechanic',
    },
  ];

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
      continue;
    }

    console.log(`✅ Auth user created: ${user.email}`);

    // Create user record in database
    const { error: dbError } = await supabase.from('users').upsert({
      id: authData.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: 'active',
    });

    if (dbError) {
      console.error(`❌ Error creating DB record for ${user.email}:`, dbError.message);
    } else {
      console.log(`✅ DB record created for ${user.email} (role: ${user.role})\n`);
    }
  }

  console.log('✅ Seeding complete!\n');
  console.log('You can now login with:');
  console.log('- admin@bengkel.com / admin123');
  console.log('- owner@bengkel.com / owner123');
  console.log('- mechanic@bengkel.com / mechanic123');
}

seedAdminUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
