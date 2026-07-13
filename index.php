<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/function/get_data.php';

$forms = app_forms();
$page = active_page();
$current = $forms[$page];
$units = unit_logos();
$types = form_types();
$payments = payment_methods();
$company = company_info();

$logoMap = [];
foreach ($units as $unitName) {
    $logoMap[$unitName] = unit_logo_image($unitName);
}
?>
<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($current['title']); ?> - INDOGROUP</title>
    <link rel="stylesheet" href="style.css">
</head>

<body data-page="<?= e($page); ?>" data-slot-text="<?= e($current['slot_text']); ?>">
    <div class="app-shell">
        <header class="top-tabs">
            <?php foreach ($forms as $key => $form): ?>
                <a class="tab-link <?= $key === $page ? 'active' : ''; ?>" href="?page=<?= e($key); ?>">
                    <span class="tab-icon"><?= e($form['icon']); ?></span>
                    <span><?= e($form['tab']); ?></span>
                </a>
            <?php endforeach; ?>
        </header>

        <div class="address-bar">
            <div class="brand">INDOGROUP</div>
            <div class="fake-url"><?= e($current['path']); ?></div>
        </div>

        <main class="workspace">
            <aside class="side-panel">
                <div class="panel-inner">
                    <h1 class="form-title"><?= e($current['title']); ?></h1>

                    <section class="form-section">
                        <h2>🧾 IDENTITAS PERUSAHAAN</h2>

                        <label for="unit_logo">Unit Logo</label>
                        <select id="unit_logo" name="unit_logo" class="field js-source">
                            <?php foreach ($units as $unit): ?>
                                <option value="<?= e($unit); ?>"><?= e($unit); ?></option>
                            <?php endforeach; ?>
                        </select>

                        <label for="type_form">Type Form</label>
                        <select id="type_form" name="type_form" class="field js-source">
                            <?php foreach ($types as $type): ?>
                                <option value="<?= e($type); ?>"><?= e($type); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </section>

                    <?php if ($page === 'SQ'): ?>
                        <section class="form-section compact-section">
                            <h2>📌 INFORMASI PENAWARAN</h2>
                            <div class="two-cols">
                                <div>
                                    <label for="tanggal">Tanggal</label>
                                    <input id="tanggal" name="tanggal" type="date" class="field js-source">
                                </div>
                                <div>
                                    <label for="nomor_urut">No. Urut</label>
                                    <input id="nomor_urut" name="nomor_urut" type="text" class="field js-source" placeholder="01108" maxlength="8">
                                </div>
                            </div>

                            <label for="kepada_yth">Kepada Yth</label>
                            <input id="kepada_yth" name="kepada_yth" type="text" class="field js-source" placeholder="Nama Perusahaan / Instansi Tujuan">

                            <label for="payment_method">Metode Payment</label>
                            <select id="payment_method" name="payment_method" class="field js-source">
                                <?php foreach ($payments as $method): ?>
                                    <option value="<?= e($method); ?>"><?= e($method); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </section>

                        <section class="form-section">
                            <h2>📋 DAFTAR PENAWARAN</h2>
                            <div id="sqRows" class="dynamic-box rows-box">
                                <div class="item-row sq-row">
                                    <input type="text" class="field js-source item-name" placeholder="Nama Barang">
                                    <input type="text" class="field js-source item-merk" placeholder="Merk">
                                    <input type="number" class="field js-source item-qty" value="1" min="1" inputmode="numeric" step="1">
                                    <input type="text" class="field js-source item-sat" placeholder="Sat. (Btg/Pcs)">
                                    <input type="text" class="field js-source item-price" placeholder="Rp.1000" inputmode="numeric">
                                    <input type="number" class="field js-source item-disc" min="0" max="100" inputmode="numeric" step="1" placeholder="Disc %">
                                    <button type="button" class="row-remove" title="Hapus">×</button>
                                </div>
                            </div>
                            <button type="button" class="add-row" data-target="sq">+ Tambah Baris Baru</button>
                        </section>

                        <section class="form-section">
                            <h2>🧮 RINCIAN BIAYA</h2>
                            <div class="two-cols">
                                <div>
                                    <label for="diskon_nominal">Diskon (Rp)</label>
                                    <input id="diskon_nominal" type="number" class="field js-source" value="0" min="0">
                                </div>
                                <div>
                                    <label for="biaya_lain">Biaya Lain-lain (Rp)</label>
                                    <input id="biaya_lain" type="number" class="field js-source" value="0" min="0">
                                </div>
                            </div>
                            <div class="two-cols">
                                <div>
                                    <label for="ppn_percent">PPN (%)</label>
                                    <input id="ppn_percent" type="number" class="field js-source" value="11" min="0" max="100">
                                </div>
                            </div>
                        </section>

                        <section class="form-section">
                            <h2>🧾 KETERANGAN</h2>
                            <label for="keterangan">Isi Keterangan</label>
                            <textarea id="keterangan" class="field textarea-md js-source" placeholder="Catatan tambahan (opsional)..."></textarea>
                        </section>
                    <?php endif; ?>

                    <?php if ($page === 'internal-memo'): ?>
                        <section class="form-section">
                            <h2>📝 INFO DOKUMEN</h2>

                            <label for="memo_from">From (Name &amp; Position)</label>
                            <input id="memo_from" type="text" class="field js-source" placeholder="Nama & Jabatan">

                            <label for="memo_to">To (Name &amp; Position)</label>
                            <input id="memo_to" type="text" class="field js-source" placeholder="Tujuan Memo">

                            <label for="memo_date">Date</label>
                            <input id="memo_date" type="date" class="field js-source">

                            <label for="memo_subject">Subject</label>
                            <textarea id="memo_subject" class="field textarea-xs js-source" placeholder="Perihal..."></textarea>
                        </section>

                        <section class="form-section">
                            <h2>📌 JENIS MEMO (PILIH MAKSIMAL 1)</h2>
                            <div class="check-grid">
                                <label><input type="checkbox" name="memo_type" value="Urgent / High Priority" class="memo-check js-source"> Urgent / High Priority</label>
                                <label><input type="checkbox" name="memo_type" value="Action Required" class="memo-check js-source"> Action Required</label>
                                <label><input type="checkbox" name="memo_type" value="For Information" class="memo-check js-source"> For Information</label>
                                <label><input type="checkbox" name="memo_type" value="For Review / Comment" class="memo-check js-source"> For Review / Comment</label>
                            </div>
                        </section>

                        <section class="form-section">
                            <h2>💬 ISI CATATAN (NOTE)</h2>
                            <label for="memo_note">Isi Catatan</label>
                            <textarea id="memo_note" class="field textarea-lg js-source" placeholder="Tulis isi memo disini..."></textarea>
                        </section>
                    <?php endif; ?>

                    <?php if ($page === 'purchase-request'): ?>
                        <section class="form-section compact-section">
                            <div class="two-cols">
                                <div>
                                    <label for="pr_date">Tanggal</label>
                                    <input id="pr_date" type="date" class="field js-source">
                                </div>
                                <div>
                                    <label for="pr_name">Nama Pemohon</label>
                                    <input id="pr_name" type="text" class="field js-source" placeholder="Nama">
                                </div>
                            </div>

                            <label for="pr_divisi">Divisi / Unit</label>
                            <input id="pr_divisi" type="text" class="field js-source" placeholder="Contoh: Sales / IT">

                            <label for="pr_need">Kebutuhan</label>
                            <input id="pr_need" type="text" class="field js-source" placeholder="Contoh: Kebutuhan ATK">
                        </section>

                        <section class="form-section">
                            <h2>📦 DAFTAR ITEMS</h2>
                            <div id="prRows" class="dynamic-box rows-box">
                                <div class="item-row pr-row">
                                    <input type="text" class="field js-source item-name" placeholder="Nama Barang">
                                    <input type="number" class="field js-source item-qty" value="1" min="1">
                                    <input type="text" class="field js-source item-note" placeholder="Keterangan">
                                    <button type="button" class="row-remove" title="Hapus">×</button>
                                </div>
                            </div>
                            <button type="button" class="add-row" data-target="pr">+ Tambah Baris Baru</button>
                        </section>

                        <section class="form-section">
                            <h2>🧾 CATATAN TAMBAHAN</h2>
                            <label for="pr_note">Isi Catatan</label>
                            <textarea id="pr_note" class="field textarea-md js-source" placeholder="Tulis instruksi atau catatan khusus di sini..."></textarea>
                        </section>
                    <?php endif; ?>

                    <section class="form-section final-section">
                        <h2>🚀 FINALISASI</h2>
                        <div class="final-box">
                            <button type="button" class="slot-btn slot-main">📄 MASUKKAN KE DOKUMEN</button>
                            <p>Tinggi dokumen otomatis menyesuaikan jumlah baris item. Jika melebihi 1 halaman A4, otomatis dibuat halaman baru.</p>
                        </div>
                    </section>

                    <button type="button" class="reset-btn" disabled>♻ RESET INPUT DATA</button>
                    <button type="button" class="print-btn" disabled>⌘ CETAK DOKUMEN (A4)</button>
                </div>
            </aside>

            <section class="preview-area">
                <div class="doc-pages" id="paper">
                    <div class="paper a4-sheet">
                        <div class="paper-slot empty" data-slot="main">
                            <span><?= e($current['slot_text']); ?></span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script id="app-config" type="application/json">
        <?= json_encode([
            'company' => $company,
            'logos' => $logoMap,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>
    </script>

    <script src="js.js"></script>
</body>

</html>