<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    $config = load_config();
    $token = (string)($_GET['token'] ?? '');
    $expectedToken = (string)($config['diagnostic_token'] ?? '');

    if ($token === '' || $expectedToken === '' || !hash_equals($expectedToken, $token)) {
        http_response_code(404);
        echo "Not found.\n";
        exit;
    }

    echo "Config loaded.\n";
    echo "Host: " . mask((string)($config['host'] ?? '')) . "\n";
    echo "Port: " . (int)($config['port'] ?? 0) . "\n";
    echo "Username: " . mask_email((string)($config['username'] ?? '')) . "\n";
    echo "To: " . mask_email((string)($config['to_email'] ?? '')) . "\n";
    echo "OpenSSL loaded: " . (extension_loaded('openssl') ? 'yes' : 'no') . "\n";

    $host = (string)($config['host'] ?? '');
    $port = (int)($config['port'] ?? 465);
    $timeout = (int)($config['timeout'] ?? 20);

    if ($host === '' || $port <= 0) {
        throw new RuntimeException('SMTP host or port is missing.');
    }

    $socket = stream_socket_client(
        'ssl://' . $host . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT
    );

    if (!is_resource($socket)) {
        throw new RuntimeException('Connection failed: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, $timeout);
    echo "Connected to SMTP server.\n";

    echo "Server greeting: " . sanitize_response(smtp_expect($socket, [220])) . "\n";
    echo "EHLO response: " . sanitize_response(smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250])) . "\n";
    echo "AUTH prompt: " . sanitize_response(smtp_command($socket, 'AUTH LOGIN', [334])) . "\n";
    echo "Username prompt: " . sanitize_response(smtp_command($socket, base64_encode((string)$config['username']), [334])) . "\n";
    echo "Password response: " . sanitize_response(smtp_command($socket, base64_encode((string)$config['password']), [235])) . "\n";
    smtp_command($socket, 'QUIT', [221]);
    fclose($socket);

    echo "SMTP authentication succeeded.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo "Diagnostic failed: " . $e->getMessage() . "\n";
}

function load_config(): array
{
    $paths = [
        dirname(__DIR__) . '/healthystart-smtp-config.php',
        __DIR__ . '/smtp-config.php',
    ];

    foreach ($paths as $path) {
        if (is_readable($path)) {
            $config = require $path;
            if (is_array($config)) {
                return $config;
            }
        }
    }

    throw new RuntimeException('Missing SMTP configuration file.');
}

function smtp_command($socket, string $command, array $expectedCodes): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_expect($socket, $expectedCodes);
}

function smtp_expect($socket, array $expectedCodes): string
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }

    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('Unexpected SMTP response: ' . sanitize_response($response));
    }

    return $response;
}

function sanitize_response(string $response): string
{
    return trim(preg_replace('/[^\PC\s]/u', '', str_replace(["\r", "\n"], ' | ', $response)) ?? $response);
}

function mask(string $value): string
{
    if (strlen($value) <= 4) {
        return '****';
    }

    return substr($value, 0, 2) . str_repeat('*', max(2, strlen($value) - 4)) . substr($value, -2);
}

function mask_email(string $email): string
{
    if (!str_contains($email, '@')) {
        return mask($email);
    }

    [$local, $domain] = explode('@', $email, 2);
    return mask($local) . '@' . $domain;
}
