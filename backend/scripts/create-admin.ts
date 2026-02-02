import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/config/database';

async function createAdminUser() {
    const adminEmail = 'admin@pmaxland.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin Pmaxland';

    try {
        // Check if admin exists
        const { data: existingAdmin } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', adminEmail)
            .single();

        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);

            // Update to admin role if not already
            if (existingAdmin.role !== 'admin') {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ role: 'admin' })
                    .eq('id', existingAdmin.id);

                if (updateError) {
                    console.error('Error updating role:', updateError);
                } else {
                    console.log(' Updated role to admin');
                }
            }
            return;
        }

        // Create admin user
        const { data, error } = await supabase
            .from('users')
            .insert({
                email: adminEmail,
                password_hash: adminPassword, // Plain text for now
                full_name: adminName,
                role: 'admin',
                is_active: true,
                is_verified: true
            })
            .select()
            .single();

        if (error) {
            console.error(' Error creating admin:', error);
            return;
        }

        console.log('Admin user created successfully!');
        console.log('   Email:', adminEmail);
        console.log('   Password:', adminPassword);
        console.log('   Role:', data.role);
        console.log(' Please change the password after first login!');

    } catch (error) {
        console.error(' Error:', error);
    }
}

// Also list all users
async function listAllUsers() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(' Error fetching users:', error);
            return;
        }

        console.log('All users in database:');
        console.log('─'.repeat(80));
        users?.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.full_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.is_active}`);
            console.log('');
        });
        console.log('─'.repeat(80));
        console.log(`Total users: ${users?.length || 0}`);

    } catch (error) {
        console.error(' Error:', error);
    }
}

async function main() {
    console.log(' Admin User Setup');
    await createAdminUser();
    await listAllUsers();
    process.exit(0);
}

main();
