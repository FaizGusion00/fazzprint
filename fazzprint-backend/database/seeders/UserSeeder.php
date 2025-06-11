<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'user_name' => 'admin',
            'full_name' => 'System Administrator',
            'email' => 'admin@fazzprint.com',
            'phone_number' => '+1234567890',
            'address' => '123 Admin Street, Admin City',
            'password' => Hash::make('admin123'),
            'role' => User::ROLE_ADMIN,
        ]);

        // Create Sales Manager
        User::create([
            'user_name' => 'sales_manager',
            'full_name' => 'John Sales Manager',
            'email' => 'sales@fazzprint.com',
            'phone_number' => '+1234567891',
            'address' => '456 Sales Avenue, Sales City',
            'password' => Hash::make('sales123'),
            'role' => User::ROLE_SALES_MANAGER,
        ]);

        // Create Staff Members
        User::create([
            'user_name' => 'staff1',
            'full_name' => 'Mike Production Staff',
            'email' => 'staff1@fazzprint.com',
            'phone_number' => '+1234567892',
            'address' => '789 Production Lane, Production City',
            'password' => Hash::make('staff123'),
            'role' => User::ROLE_STAFF,
        ]);

        User::create([
            'user_name' => 'staff2',
            'full_name' => 'Sarah Quality Control',
            'email' => 'staff2@fazzprint.com',
            'phone_number' => '+1234567893',
            'address' => '321 Quality Street, Quality City',
            'password' => Hash::make('staff123'),
            'role' => User::ROLE_STAFF,
        ]);

        // Create Test Customers
        User::create([
            'user_name' => 'customer1',
            'full_name' => 'Alice Johnson',
            'email' => 'alice@example.com',
            'phone_number' => '+1234567894',
            'address' => '555 Customer Road, Customer City',
            'password' => Hash::make('customer123'),
            'role' => User::ROLE_CUSTOMER,
        ]);

        User::create([
            'user_name' => 'customer2',
            'full_name' => 'Bob Smith',
            'email' => 'bob@example.com',
            'phone_number' => '+1234567895',
            'address' => '777 Client Avenue, Client City',
            'password' => Hash::make('customer123'),
            'role' => User::ROLE_CUSTOMER,
        ]);

        User::create([
            'user_name' => 'customer3',
            'full_name' => 'Carol Davis',
            'email' => 'carol@example.com',
            'phone_number' => '+1234567896',
            'address' => '999 Buyer Boulevard, Buyer City',
            'password' => Hash::make('customer123'),
            'role' => User::ROLE_CUSTOMER,
        ]);

        $this->command->info('Users seeded successfully!');
        $this->command->info('Admin: admin / admin123');
        $this->command->info('Sales Manager: sales_manager / sales123');
        $this->command->info('Staff: staff1, staff2 / staff123');
        $this->command->info('Customers: customer1, customer2, customer3 / customer123');
    }
}
