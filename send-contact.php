<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed.']);
}

if (!empty($_POST['_honey'] ?? '')) {
    respond(200, ['success' => true]);
}

$config = load_config();
$submission = build_submission($_POST);

try {
    smtp_send(
        $config,
        $submission['subject'],
        $submission['body'],
        $submission['reply_to_email'],
        $submission['reply_to_name']
    );
    respond(200, ['success' => true]);
} catch (Throwable $e) {
    error_log('Contact form SMTP error: ' . $e->getMessage());
    respond(500, ['error' => 'We could not send your message. Please call (252) 674-1812.']);
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

function build_submission(array $post): array
{
    $type = clean_text((string)($post['form_type'] ?? 'contact'), 40);
    $definitions = form_definitions();
    $definition = $definitions[$type] ?? $definitions['contact'];

    $data = [];
    foreach ($definition['fields'] as $field => $label) {
        $data[$field] = clean_text((string)($post[$field] ?? ''), 4000);
    }

    foreach ($definition['required'] as $field) {
        if (($data[$field] ?? '') === '') {
            respond(422, ['error' => 'Please complete all required fields.']);
        }
    }

    if (isset($data['email']) && $data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        respond(422, ['error' => 'Please enter a valid email address.']);
    }

    $lines = [
        $definition['heading'],
        '',
    ];

    foreach ($definition['fields'] as $field => $label) {
        $value = $data[$field] ?? '';
        if ($value === '') {
            continue;
        }

        $lines[] = $label . ':';
        $lines[] = $value;
        $lines[] = '';
    }

    $lines[] = 'Submitted: ' . gmdate('Y-m-d H:i:s') . ' UTC';
    $lines[] = 'Source IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

    return [
        'subject' => $definition['subject'],
        'body' => implode("\r\n", $lines),
        'reply_to_email' => $data['email'] ?? '',
        'reply_to_name' => $data['name'] ?? ($data['org'] ?? ''),
    ];
}

function form_definitions(): array
{
    return [
        'contact' => [
            'subject' => 'Healthy Start website contact form',
            'heading' => 'New contact form submission',
            'required' => ['name', 'email', 'message'],
            'fields' => [
                'name' => 'Name',
                'email' => 'Email',
                'message' => 'Message',
            ],
        ],
        'ride' => [
            'subject' => 'New Healthy Start ride request',
            'heading' => 'New ride request from the Patients page',
            'required' => ['name', 'phone', 'pickup', 'dropoff', 'date', 'time', 'mobility'],
            'fields' => [
                'name' => 'Full Name',
                'phone' => 'Phone',
                'pickup' => 'Pickup Address',
                'dropoff' => 'Drop-off Facility',
                'date' => 'Date',
                'time' => 'Pickup Time',
                'mobility' => 'Mobility Needs',
                'roundtrip' => 'Round Trip',
                'notes' => 'Notes',
            ],
        ],
        'demo' => [
            'subject' => 'New Healthy Start organization demo request',
            'heading' => 'New organization demo request',
            'required' => ['org', 'role', 'email', 'phone', 'volume'],
            'fields' => [
                'org' => 'Organization',
                'role' => 'Role',
                'email' => 'Work Email',
                'phone' => 'Phone',
                'volume' => 'Monthly Ride Volume',
                'mix' => 'Vehicle Mix',
                'notes' => 'Notes',
            ],
        ],
    ];
}

function smtp_send(array $config, string $subject, string $body, string $replyToEmail, string $replyToName): void
{
    $host = (string)($config['host'] ?? '');
    $port = (int)($config['port'] ?? 465);
    $username = (string)($config['username'] ?? '');
    $password = (string)($config['password'] ?? '');
    $fromEmail = (string)($config['from_email'] ?? $username);
    $fromName = (string)($config['from_name'] ?? 'Healthy Start Website');
    $toEmail = (string)($config['to_email'] ?? '');
    $toName = (string)($config['to_name'] ?? '');
    $timeout = (int)($config['timeout'] ?? 20);

    foreach ([$host, $username, $password, $fromEmail, $toEmail] as $required) {
        if ($required === '') {
            throw new RuntimeException('SMTP configuration is incomplete.');
        }
    }

    $socket = stream_socket_client(
        'ssl://' . $host . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT
    );

    if (!is_resource($socket)) {
        throw new RuntimeException('SMTP connection failed: ' . $errstr);
    }

    stream_set_timeout($socket, $timeout);

    try {
        smtp_expect($socket, [220]);
        smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
        smtp_command($socket, 'AUTH LOGIN', [334]);
        smtp_command($socket, base64_encode($username), [334]);
        smtp_command($socket, base64_encode($password), [235]);
        smtp_command($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . $toEmail . '>', [250, 251]);
        smtp_command($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . mailbox($fromEmail, $fromName),
            'To: ' . mailbox($toEmail, $toName),
            'Subject: ' . encode_header($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'X-Mailer: Healthy Start Contact Form',
        ];

        if ($replyToEmail !== '' && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $headers[] = 'Reply-To: ' . mailbox($replyToEmail, $replyToName);
        }

        fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . dot_stuff($body) . "\r\n.\r\n");
        smtp_expect($socket, [250]);
        smtp_command($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
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
        throw new RuntimeException('Unexpected SMTP response: ' . trim($response));
    }

    return $response;
}

function clean_text(string $value, int $maxLength): string
{
    $value = trim(str_replace(["\r\n", "\r"], "\n", $value));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
}

function mailbox(string $email, string $name = ''): string
{
    $email = str_replace(["\r", "\n"], '', $email);
    $name = trim(str_replace(["\r", "\n", '"'], ['', '', "'"], $name));

    if ($name === '') {
        return '<' . $email . '>';
    }

    return '"' . addcslashes($name, "\\\"") . '" <' . $email . '>';
}

function encode_header(string $value): string
{
    return '=?UTF-8?B?' . base64_encode(str_replace(["\r", "\n"], '', $value)) . '?=';
}

function dot_stuff(string $body): string
{
    $normalized = str_replace(["\r\n", "\r"], "\n", $body);
    $stuffed = preg_replace('/^\./m', '..', $normalized) ?? $normalized;
    return str_replace("\n", "\r\n", $stuffed);
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}
