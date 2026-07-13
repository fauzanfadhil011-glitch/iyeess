<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

date_default_timezone_set('Asia/Jakarta');

$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'indogroup_form';

$APP_NAME = 'INDOGROUP';
$BASE_URL = '';
$UPLOAD_DIR = __DIR__ . '/../storage/uploads';
$MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
$ALLOWED_UPLOAD_EXT = array('pdf', 'jpg', 'jpeg', 'png');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $koneksi = mysqli_connect($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    mysqli_set_charset($koneksi, 'utf8mb4');
} catch (Exception $e) {
    http_response_code(500);
    die('Koneksi database gagal: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
}
