#!/usr/bin/env php
<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$command = $argv[1] ?? 'up';
$migrationsDir = __DIR__ . '/../database/migrations';

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_DATABASE'] ?? 'business_os';
$user = $_ENV['DB_USERNAME'] ?? 'root';
$pass = $_ENV['DB_PASSWORD'] ?? '';

try {
    // 1. Ensure database exists
    $rootPdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 2. Connect to target database
    $pdoFactory = require __DIR__ . '/../config/database.php';
    /** @var PDO $pdo */
    $pdo = $pdoFactory();

    // 3. Ensure migrations tracking table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `schema_migrations` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `migration` VARCHAR(255) NOT NULL UNIQUE,
            `batch` INT UNSIGNED NOT NULL,
            `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $executed = $pdo->query("SELECT migration, batch, executed_at FROM schema_migrations ORDER BY id ASC")
        ->fetchAll(PDO::FETCH_ASSOC);
    $executedMap = array_column($executed, null, 'migration');

    $files = glob($migrationsDir . '/*.sql') ?: [];
    sort($files);

    if ($command === 'status') {
        echo "\nMigration Status ({$dbName}):\n";
        echo str_repeat('-', 65) . "\n";
        if (empty($files)) {
            echo "No .sql migration files found in database/migrations/\n\n";
            exit(0);
        }
        foreach ($files as $file) {
            $name = basename($file);
            if (isset($executedMap[$name])) {
                echo "[RAN]     {$name} (Batch {$executedMap[$name]['batch']} @ {$executedMap[$name]['executed_at']})\n";
            } else {
                echo "[PENDING] {$name}\n";
            }
        }
        echo "\n";
        exit(0);
    }

    if ($command === 'up') {
        $pending = array_filter($files, static fn(string $f): bool => !isset($executedMap[basename($f)]));

        if (empty($pending)) {
            echo "Nothing to migrate. Database is up to date.\n";
            exit(0);
        }

        $nextBatch = (int) $pdo->query("SELECT COALESCE(MAX(batch), 0) + 1 FROM schema_migrations")->fetchColumn();
        $stmt = $pdo->prepare("INSERT INTO schema_migrations (migration, batch) VALUES (:migration, :batch)");

        foreach ($pending as $file) {
            $name = basename($file);
            echo "Migrating: {$name} ... ";
            $sql = file_get_contents($file);

            if ($sql === false || trim($sql) === '') {
                echo "SKIPPED (empty)\n";
                continue;
            }

            $pdo->exec($sql);
            $stmt->execute([
                ':migration' => $name,
                ':batch'     => $nextBatch,
            ]);
            echo "DONE\n";
        }

        echo "\nAll migrations completed successfully (Batch {$nextBatch}).\n";
        exit(0);
    }

    echo "Unknown command '{$command}'. Available commands:\n";
    echo "  php bin/migrate.php up       Run pending migrations\n";
    echo "  php bin/migrate.php status   Show migration status\n";
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, "\n[MIGRATION ERROR] " . $e->getMessage() . "\n");
    exit(1);
}
