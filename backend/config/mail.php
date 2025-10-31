<?php

return [
    'default' => env('MAIL_MAILER', 'log'),

    'mailers' => [
        'log' => [
            'transport' => 'log',
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'no-reply@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Mine CMMS'),
    ],
];
