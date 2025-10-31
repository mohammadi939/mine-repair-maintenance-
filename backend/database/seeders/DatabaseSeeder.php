<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $units = collect([
            ['name' => 'استخراج', 'description' => 'واحد استخراج معدن'],
            ['name' => 'کارگاه تعمیرات', 'description' => 'واحد تعمیر و نگهداری تجهیزات'],
            ['name' => 'حمل و نقل', 'description' => 'واحد جابجایی و حمل بار'],
        ])->map(fn($data) => Unit::create($data));

        $manager = User::create([
            'name' => 'مدیر سیستم',
            'username' => 'manager',
            'email' => 'manager@example.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
        ]);

        $storekeeper = User::create([
            'name' => 'انباردار',
            'username' => 'store',
            'email' => 'store@example.com',
            'password' => Hash::make('password'),
            'role' => 'storekeeper',
        ]);

        $maintenance = User::create([
            'name' => 'تعمیرکار',
            'username' => 'tech',
            'email' => 'tech@example.com',
            'password' => Hash::make('password'),
            'role' => 'maintenance',
        ]);

        $units->each(function (Unit $unit) {
            Equipment::create([
                'name' => 'دستگاه ' . $unit->id,
                'code' => 'EQ-' . $unit->id . '-001',
                'unit_id' => $unit->id,
                'location' => 'ناحیه ' . $unit->id,
                'status' => 'active',
            ]);
        });
    }
}
