<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
        ]);

        $this->command->info('🎉 FazzPrint ERP Database has been seeded successfully!');
        $this->command->info('');
        $this->command->info('=== Login Credentials ===');
        $this->command->info('👑 Admin: admin / admin123');
        $this->command->info('💼 Sales Manager: sales_manager / sales123');
        $this->command->info('⚙️  Staff: staff1, staff2 / staff123');
        $this->command->info('👤 Customers: customer1, customer2, customer3 / customer123');
        $this->command->info('');
        $this->command->info('You can now start developing the frontend sites!');
    }
}
