<?php
// PHP Transparent Proxy for LytronPay Payouts
// This script forwards requests to LytronPay Payouts API so that the request originates from the server's whitelisted IP.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Api-Access-Key, Transaction-Hash");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

$apiAccessKey = $_SERVER['HTTP_API_ACCESS_KEY'] ?? '';
$transactionHash = $_SERVER['HTTP_TRANSACTION_HASH'] ?? '';

if (empty($apiAccessKey)) {
    http_response_code(400);
    echo json_encode(["message" => "Api-Access-Key header is required"]);
    exit;
}

$rawInput = file_get_contents('php://input');

$ch = curl_init('https://api.lytronpay.com/api/v1/payouts');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $rawInput);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Api-Access-Key: ' . $apiAccessKey,
    'Transaction-Hash: ' . $transactionHash
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(500);
    echo json_encode(["message" => "Proxy Error: " . $error_msg]);
    curl_close($ch);
    exit;
}

curl_close($ch);
http_response_code($httpCode);
echo $response;
