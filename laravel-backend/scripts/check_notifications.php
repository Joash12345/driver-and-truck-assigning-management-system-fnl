<?php
$dsn = 'mysql:host=127.0.0.1;dbname=dtams3;charset=utf8mb4';
$user = 'root';
$pass = '';
try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query('SELECT COUNT(*) AS c FROM notifications');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "notifications_count:" . ($row['c'] ?? 0) . PHP_EOL;
} catch (PDOException $e) {
    echo "error:" . $e->getMessage() . PHP_EOL;
    exit(1);
}
