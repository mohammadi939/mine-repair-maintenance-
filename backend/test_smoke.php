<?php
/**
 * test_smoke.php
 * تست ساده برای بررسی موجود بودن اندپوینت‌های کلیدی.
 */

declare(strict_types=1);

$base = rtrim($argv[1] ?? 'http://localhost:8000/backend/api', '/');

function call(string $method, string $url, ?array $payload = null, ?string $token = null, array $files = []): array {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    if ($files) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $files);
    } elseif ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
        $headers[] = 'Content-Type: application/json';
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return [$info['http_code'], $response];
}

list($code, $body) = call('POST', $base . '/auth.php', ['username' => 'admin', 'password' => 'admin123']);
if ($code !== 200) {
    echo "[X] ورود ناموفق: {$body}\n";
    exit(1);
}
$data = json_decode($body, true);
$token = $data['token'] ?? null;
if (!$token) {
    echo "[X] دریافت توکن انجام نشد.\n";
    exit(1);
}

echo "[✓] ورود موفق\n";

list($code, $body) = call('GET', $base . '/units.php', null, $token);
if ($code !== 200) {
    echo "[X] دریافت واحدها ناموفق: {$body}\n";
    exit(1);
}

echo "[✓] لیست واحدها\n";

echo "تست‌ها تکمیل شد.\n";
