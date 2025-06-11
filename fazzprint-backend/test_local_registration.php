<?php

$url = 'http://localhost:8001/api/auth/register';

// Test registration with new phone number format (local Indonesian format)
$timestamp = time();
$data = [
    'user_name' => 'localtest' . $timestamp,
    'full_name' => 'Local Test User Registration',
    'email' => 'localtest' . $timestamp . '@example.com',
    'phone_number' => '08123456789', // Local format without country code
    'address' => 'Jl. Test No. 123, Jakarta Selatan, DKI Jakarta',
    'password' => 'Password123',
    'password_confirmation' => 'Password123'
];

echo "Testing LOCAL Registration API with data:\n";
echo "URL: " . $url . "\n";
echo "User Name: " . $data['user_name'] . "\n";
echo "Full Name: " . $data['full_name'] . "\n";
echo "Email: " . $data['email'] . "\n";
echo "Phone: " . $data['phone_number'] . "\n";
echo "Address: " . $data['address'] . "\n";
echo "\n";

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_error($ch)) {
    echo "CURL Error: " . curl_error($ch) . "\n";
}

curl_close($ch);

echo "=== LOCAL REGISTRATION API TEST RESULTS ===\n";
echo "HTTP Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";

if ($httpCode == 201) {
    echo "\n✅ SUCCESS: Registration completed successfully!\n";
    $responseData = json_decode($response, true);
    if ($responseData && isset($responseData['data'])) {
        echo "User ID: " . $responseData['data']['user']['user_id'] . "\n";
        echo "Access Token: " . (strlen($responseData['data']['access_token']) > 20 ? substr($responseData['data']['access_token'], 0, 20) . "..." : $responseData['data']['access_token']) . "\n";
    }
} else {
    echo "\n❌ FAILED: Registration failed with HTTP " . $httpCode . "\n";
    $responseData = json_decode($response, true);
    if ($responseData && isset($responseData['errors'])) {
        echo "Validation Errors:\n";
        foreach ($responseData['errors'] as $field => $errors) {
            echo "  - " . $field . ": " . implode(', ', $errors) . "\n";
        }
    }
} 