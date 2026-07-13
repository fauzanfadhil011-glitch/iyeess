<?php
function app_forms()
{
    return [
        'SQ' => [
            'title' => 'Penawaran Harga Form',
            'tab' => 'Penawaran Harga Form',
            'icon' => '🧾',
            'path' => 'internal-tools://generator/form/PenawaranHarga',
            'slot_text' => 'SLOT SQ KOSONG',
            'short' => 'sq',
        ],
    ];
}

function active_page()
{
    $forms = app_forms();
    $page = $_GET['page'] ?? 'SQ';

    if (!isset($forms[$page])) {
        return 'SQ';
    }

    return $page;
}

function unit_logos()
{
    return [
        'INDO SUPER GROSIR',
    ];
}

function form_types()
{
    return [
        'SQ - PENAWARAN HARGA',
    ];
}

function payment_methods()
{
    return [
        'C.B.D',
        'COD',
        'Cash',
        'Transfer',
    ];
}

/**
 * Data perusahaan yang tampil statis di kop dokumen (kanan atas).
 * Ubah nilainya di sini kalau ada perubahan alamat/kontak.
 */
function company_info()
{
    return [
        'name'     => '',
        'address'  => 'Jl. Arif Rahman Hakim No 27, Muka,',
        'address2' => 'Kec. Cianjur, Kab Cianjur, Jawa Barat 43215',
        'email'    => 'Email : info@indogroup.id',
        'web'      => 'Web  : www.indogroup.id',
    ];
}

/**
 * Mapping nama Unit Logo -> path file logo di storage/assets.
 * Tambahkan baris baru di sini setiap kali ada Unit Logo baru.
 */
function unit_logo_image($unitName)
{
    $map = [
        'INDO SUPER GROSIR' => 'storage/assets/gambar.png',
    ];

    return $map[$unitName] ?? '';
}

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}
