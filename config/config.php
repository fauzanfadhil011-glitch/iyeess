<?php
// Konfigurasi ringan. Tidak pakai database.
// Kalau folder project diganti, cukup ubah BASE_URL kalau perlu.

$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$baseUrl = $basePath === '' ? '.' : $basePath;

$GLOBALS['APP'] = [
    'name' => 'INDOGROUP',
    'base_url' => $baseUrl,
];
