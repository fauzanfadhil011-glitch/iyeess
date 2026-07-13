(function () {
  "use strict";

  var body = document.body;
  var page = body.getAttribute("data-page");
  var slotText = body.getAttribute("data-slot-text") || "SLOT KOSONG";
  var resetBtn = document.querySelector(".reset-btn");
  var printBtn = document.querySelector(".print-btn");
  var pagesContainer = document.getElementById("paper");
  var documentFilled = false;

  // Lebar acuan A4 (210mm @ 96dpi) dipakai untuk mengukur & membagi halaman.
  // Karena SELURUH ukuran di .sq-doc pakai satuan cqw (proporsional terhadap
  // lebar kontainernya), rasio "berapa baris muat per halaman A4" akan SAMA
  // persis berapa pun lebar render aslinya nanti (preview di layar kecil/besar
  // ataupun saat dicetak). Jadi cukup diukur sekali pakai lebar acuan ini.
  var A4_REF_WIDTH_PX = (210 * 96) / 25.4;
  var A4_ASPECT_RATIO = 1.414;
  var PAGE_SAFETY_BUFFER_PX = 6;

  var SQ_TABLE_THEAD =
    "<tr><th>No.</th><th>Nama Barang</th><th>Merk</th><th>Qty</th><th>Sat.</th><th>@Harga</th><th>Disc %</th><th>@Harga Nett Sat.</th><th>Total</th></tr>";

  // Data dari PHP (company info + mapping logo unit) dikirim lewat <script id="app-config">
  var appConfig = { company: {}, logos: {} };
  var appConfigEl = document.getElementById("app-config");
  if (appConfigEl) {
    try {
      appConfig = JSON.parse(appConfigEl.textContent || "{}");
    } catch (err) {
      appConfig = { company: {}, logos: {} };
    }
  }

  var MONTHS_ID = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  function valueOf(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function text(value, fallback) {
    if (typeof fallback === "undefined") {
      fallback = "-";
    }
    return value && value !== "" ? escapeHtml(value) : fallback;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toNumber(value) {
    if (!value) {
      return 0;
    }
    var cleaned = String(value).replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }

  function parseCurrencyValue(value) {
    var cleaned = String(value || "").replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }

  function formatNumber(num) {
    var n = Math.round(num || 0);
    return n.toLocaleString("id-ID");
  }

  function formatCurrency(num) {
    var n = Math.round(num || 0);
    return "Rp." + n.toLocaleString("id-ID");
  }

  function showModal(message, callback) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    var content = document.createElement("div");
    content.className = "modal-content";

    var messageDiv = document.createElement("div");
    messageDiv.className = "modal-message";
    messageDiv.textContent = message;

    var button = document.createElement("button");
    button.className = "modal-button";
    button.textContent = "OK";

    function close() {
      overlay.remove();
      if (callback) {
        callback();
      }
    }

    button.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        close();
      }
    });

    content.appendChild(messageDiv);
    content.appendChild(button);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    button.focus();
  }

  function formatDiscountValue(value) {
    if (value === null || typeof value === "undefined" || value === "") {
      return "";
    }

    var n = toNumber(value);
    return n > 0 ? n : "";
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    var parts = value.split("-");
    if (parts.length !== 3) {
      return text(value);
    }

    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  // Format tanggal ala Indonesia: "30 Jun 2026"
  function formatDateID(value) {
    if (!value) {
      return "-";
    }

    var parts = value.split("-");
    if (parts.length !== 3) {
      return text(value);
    }

    var day = parseInt(parts[2], 10);
    var monthIdx = parseInt(parts[1], 10) - 1;
    var monthName = MONTHS_ID[monthIdx] || parts[1];

    return day + " " + monthName + " " + parts[0];
  }

  function getCommonData() {
    return {
      unit: valueOf("unit_logo"),
      type: valueOf("type_form"),
    };
  }

  function rowsToTable(rows, headers) {
    var html = '<table class="doc-table"><thead><tr>';

    headers.forEach(function (header) {
      html += "<th>" + escapeHtml(header) + "</th>";
    });

    html += "</tr></thead><tbody>";

    if (!rows.length) {
      html +=
        '<tr><td colspan="' + headers.length + '">Belum ada data.</td></tr>';
    } else {
      rows.forEach(function (row, index) {
        html += "<tr><td>" + (index + 1) + "</td>";
        row.forEach(function (cell) {
          html += "<td>" + text(cell) + "</td>";
        });
        html += "</tr>";
      });
    }

    html += "</tbody></table>";
    return html;
  }

  // ==== Daftar Penawaran (SQ) ====
  function sqRows() {
    var rows = [];
    document.querySelectorAll(".sq-row").forEach(function (row) {
      var name = row.querySelector(".item-name").value.trim();
      var merk = row.querySelector(".item-merk")
        ? row.querySelector(".item-merk").value.trim()
        : "";
      var qty = toNumber(row.querySelector(".item-qty").value);
      var sat = row.querySelector(".item-sat").value.trim();
      var price = parseCurrencyValue(row.querySelector(".item-price").value);
      var discRaw = row.querySelector(".item-disc").value.trim();
      var disc = discRaw === "" ? 0 : toNumber(discRaw);

      if (name || qty || price) {
        var nett = price - (price * disc) / 100;
        var total = nett * qty;

        rows.push({
          name: name,
          merk: merk,
          qty: qty,
          sat: sat,
          price: price,
          disc: discRaw === "" ? "" : disc,
          nett: nett,
          total: total,
        });
      }
    });
    return rows;
  }

  function buildSqRowHtmlList(rows) {
    if (!rows.length) {
      return ['<tr><td colspan="9">Belum ada data.</td></tr>'];
    }

    return rows.map(function (row, index) {
      return (
        "<tr>" +
        '<td class="num">' +
        (index + 1) +
        "</td>" +
        "<td>" +
        text(row.name) +
        "</td>" +
        "<td>" +
        text(row.merk) +
        "</td>" +
        '<td class="num">' +
        row.qty +
        "</td>" +
        '<td class="num">' +
        text(row.sat) +
        "</td>" +
        '<td class="money-black">' +
        formatCurrency(row.price) +
        "</td>" +
        '<td class="num">' +
        formatDiscountValue(row.disc) +
        "</td>" +
        '<td class="money">' +
        formatCurrency(row.nett) +
        "</td>" +
        '<td class="money">' +
        formatCurrency(row.total) +
        "</td>" +
        "</tr>"
      );
    });
  }

  // Nomor: {PREFIX-dari-TypeForm}.{tahun-berjalan}.{bulan-berjalan}.{no urut manual, auto pad 5 digit}
  function buildSqNumber() {
    var type = valueOf("type_form");
    var prefix = (type.split("-")[0] || "SQ").trim().toUpperCase() || "SQ";

    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth() + 1).padStart(2, "0");

    var urutClean = valueOf("nomor_urut").replace(/[^0-9]/g, "");
    var urutPadded = urutClean ? urutClean.padStart(5, "0") : "00000";

    return prefix + "." + yyyy + "." + mm + "." + urutPadded;
  }

  function prRows() {
    var rows = [];
    document.querySelectorAll(".pr-row").forEach(function (row) {
      var name = row.querySelector(".item-name").value.trim();
      var qty = row.querySelector(".item-qty").value.trim();
      var note = row.querySelector(".item-note").value.trim();

      if (name || qty || note) {
        rows.push([name, qty, note]);
      }
    });
    return rows;
  }

  function selectedMemoType() {
    var checked = document.querySelector(".memo-check:checked");
    return checked ? checked.value : "-";
  }

  function buildDocHeader(title) {
    var common = getCommonData();
    return (
      "" +
      '<div class="doc-head">' +
      "<div>" +
      '<div class="doc-brand">INDOGROUP</div>' +
      "<div>" +
      text(common.unit) +
      "</div>" +
      "</div>" +
      '<div class="doc-title">' +
      escapeHtml(title) +
      "<br><span>" +
      text(common.type) +
      "</span></div>" +
      "</div>"
    );
  }

  // ==== Blok-blok dokumen SQ (dipisah supaya bisa diukur & dipaginasi per halaman A4) ====

  function buildSqHeaderBlock() {
    var unit = valueOf("unit_logo");
    var type = valueOf("type_form");
    var company = appConfig.company || {};
    var logoSrc = (appConfig.logos && appConfig.logos[unit]) || "";

    var logoHtml = logoSrc
      ? '<img src="' + escapeHtml(logoSrc) + '" alt="' + text(unit) + '">'
      : '<div style="font-weight:900;font-size:13px;color:#0000c9;">' +
        text(unit) +
        "</div>";

    return (
      "" +
      '<div class="sq-top">' +
      '<div class="sq-logo-block">' +
      logoHtml +
      "</div>" +
      '<div class="sq-company">' +
      '<div class="name">' +
      text(company.name, "") +
      "</div>" +
      "<div>" +
      text(company.address) +
      "</div>" +
      "<div>" +
      text(company.address2) +
      "</div>" +
      "<div>" +
      text(company.email) +
      "</div>" +
      "<div>" +
      text(company.web) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="sq-mid">' +
      '<div class="sq-kepada">' +
      '<div class="label">Kepada Yth :</div>' +
      '<div class="value">' +
      text(valueOf("kepada_yth")) +
      "</div>" +
      "</div>" +
      '<div class="sq-title-block">' +
      '<div class="title">' +
      text(type, "SQ - PENAWARAN HARGA") +
      "</div>" +
      '<div class="sq-meta">' +
      '<div class="k">Nomor</div><div>:</div><div class="v">' +
      buildSqNumber() +
      "</div>" +
      '<div class="k">Tanggal</div><div>:</div><div class="v">' +
      formatDateID(valueOf("tanggal")) +
      "</div>" +
      '<div class="k">Payment</div><div>:</div><div class="v">' +
      text(valueOf("payment_method")) +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function buildSqContinuationBlock() {
    return '<div class="sq-continuation">' + buildSqNumber() + "</div>";
  }

  function buildSqFooterBlock(totals) {
    return (
      "" +
      '<div class="sq-bottom">' +
      '<div class="sq-keterangan">' +
      '<div class="rule"></div>' +
      '<div class="label">Keterangan</div>' +
      '<div class="rule"></div>' +
      '<div class="value">' +
      text(valueOf("keterangan"), "") +
      "</div>" +
      '<div class="rule"></div>' +
      "</div>" +
      '<div class="sq-totals">' +
      '<div class="row"><span>Sub Total</span><span class="val">' +
      formatNumber(totals.subTotal) +
      "</span></div>" +
      '<div class="row"><span>Diskon</span><span class="val">' +
      (totals.diskon > 0 ? formatNumber(totals.diskon) : "") +
      "</span></div>" +
      '<div class="row money"><span>PPN (' +
      totals.ppnPercent +
      '%)</span><span class="val">' +
      formatCurrency(totals.ppn) +
      "</span></div>" +
      '<div class="row"><span>PPNBM (%)</span><span class="val">' +
      formatCurrency(totals.ppnbm) +
      "</span></div>" +
      '<div class="row"><span>Biaya Lain-lain</span><span class="val">' +
      formatCurrency(totals.biayaLain) +
      "</span></div>" +
      '<div class="row total"><span>Total</span><span class="val">' +
      formatCurrency(totals.total) +
      "</span></div>" +
      "</div>" +
      "</div>" +
      '<div class="sq-sign">' +
      '<div class="col"><div class="line"></div><div class="label">Dibuat Oleh</div><div class="tgl">Tgl.</div></div>' +
      '<div class="col"><div class="line"></div><div class="label">Disetujui Oleh</div><div class="tgl">Tgl.</div></div>' +
      "</div>"
    );
  }

  // ==== Mesin pagination A4: ukur tinggi tiap bagian dokumen lalu bagi jadi halaman ====

  function createMeasurementRoot(widthPx) {
    var root = document.createElement("div");
    root.style.position = "fixed";
    root.style.left = "-99999px";
    root.style.top = "0";
    root.style.visibility = "hidden";
    root.style.pointerEvents = "none";
    root.className = "paper-slot";
    root.style.width = widthPx + "px";
    document.body.appendChild(root);
    return root;
  }

  function measureSqLayout(
    widthPx,
    headerHtml,
    continuationHtml,
    theadHtml,
    rowHtmls,
    footerHtml,
  ) {
    var root = createMeasurementRoot(widthPx);
    var doc = document.createElement("div");
    doc.className = "sq-doc";
    root.appendChild(doc);

    var cs = getComputedStyle(doc);
    var paddingTop = parseFloat(cs.paddingTop) || 0;
    var paddingBottom = parseFloat(cs.paddingBottom) || 0;

    var headerWrap = document.createElement("div");
    headerWrap.innerHTML = headerHtml;
    doc.appendChild(headerWrap);
    var headerHeight = headerWrap.getBoundingClientRect().height;

    var continuationWrap = document.createElement("div");
    continuationWrap.innerHTML = continuationHtml;
    doc.appendChild(continuationWrap);
    var continuationHeight = continuationWrap.getBoundingClientRect().height;

    var theadWrap = document.createElement("table");
    theadWrap.className = "sq-table";
    theadWrap.innerHTML = "<thead>" + theadHtml + "</thead><tbody></tbody>";
    doc.appendChild(theadWrap);
    var theadHeight = theadWrap
      .querySelector("thead")
      .getBoundingClientRect().height;

    var rowsTable = document.createElement("table");
    rowsTable.className = "sq-table";
    var tbody = document.createElement("tbody");
    rowsTable.appendChild(tbody);
    doc.appendChild(rowsTable);

    var rowHeights = rowHtmls.map(function (rowHtml) {
      var before = tbody.getBoundingClientRect().height;
      tbody.insertAdjacentHTML("beforeend", rowHtml);
      var after = tbody.getBoundingClientRect().height;
      return after - before;
    });

    var footerWrap = document.createElement("div");
    footerWrap.innerHTML = footerHtml;
    doc.appendChild(footerWrap);
    var footerHeight = footerWrap.getBoundingClientRect().height;

    document.body.removeChild(root);

    return {
      paddingTop: paddingTop,
      paddingBottom: paddingBottom,
      headerHeight: headerHeight,
      continuationHeight: continuationHeight,
      theadHeight: theadHeight,
      rowHeights: rowHeights,
      footerHeight: footerHeight,
    };
  }

  function paginateSqDocument(headerHtml, theadHtml, rowHtmls, footerHtml) {
    var continuationHtml = buildSqContinuationBlock();
    var m = measureSqLayout(
      A4_REF_WIDTH_PX,
      headerHtml,
      continuationHtml,
      theadHtml,
      rowHtmls,
      footerHtml,
    );

    var pageBudget = A4_REF_WIDTH_PX * A4_ASPECT_RATIO;
    var usable =
      pageBudget - m.paddingTop - m.paddingBottom - PAGE_SAFETY_BUFFER_PX;

    var pages = [];
    var currentPage = {
      header: true,
      continuation: false,
      rows: [],
      footer: false,
    };
    var remaining = usable - m.headerHeight - m.theadHeight;

    for (var i = 0; i < rowHtmls.length; i++) {
      var rowHeight = m.rowHeights[i];

      if (rowHeight > remaining && currentPage.rows.length > 0) {
        pages.push(currentPage);
        currentPage = {
          header: false,
          continuation: true,
          rows: [],
          footer: false,
        };
        remaining = usable - m.continuationHeight - m.theadHeight;
      }

      currentPage.rows.push(rowHtmls[i]);
      remaining -= rowHeight;
    }

    pages.push(currentPage);

    if (m.footerHeight <= remaining) {
      currentPage.footer = true;
    } else {
      pages.push({
        header: false,
        continuation: false,
        rows: [],
        footer: true,
        tableless: true,
      });
    }

    return {
      pages: pages,
      headerHtml: headerHtml,
      continuationHtml: continuationHtml,
      theadHtml: theadHtml,
      footerHtml: footerHtml,
    };
  }

  function renderSqPages(paginationResult) {
    return paginationResult.pages.map(function (pageInfo) {
      var html = '<div class="sq-doc">';

      if (pageInfo.header) {
        html += paginationResult.headerHtml;
      } else if (pageInfo.continuation) {
        html += paginationResult.continuationHtml;
      }

      if (!pageInfo.tableless) {
        html +=
          '<table class="sq-table"><thead>' +
          paginationResult.theadHtml +
          "</thead><tbody>" +
          pageInfo.rows.join("") +
          "</tbody></table>";
      }

      if (pageInfo.footer) {
        html += paginationResult.footerHtml;
      }

      html += "</div>";
      return html;
    });
  }

  function buildExpensesPages() {
    var rows = sqRows();
    var subTotal = rows.reduce(function (sum, r) {
      return sum + r.total;
    }, 0);

    var diskon = toNumber(valueOf("diskon_nominal"));
    var ppnPercent = toNumber(valueOf("ppn_percent"));
    var ppnbmPercent = toNumber(valueOf("ppnbm_percent"));
    var biayaLain = toNumber(valueOf("biaya_lain"));

    var base = subTotal - diskon;
    var ppn = (base * ppnPercent) / 100;
    var ppnbm = (base * ppnbmPercent) / 100;
    var total = base + ppn + ppnbm + biayaLain;

    var headerHtml = buildSqHeaderBlock();
    var rowHtmls = buildSqRowHtmlList(rows);
    var footerHtml = buildSqFooterBlock({
      subTotal: subTotal,
      diskon: diskon,
      ppnPercent: ppnPercent,
      ppn: ppn,
      ppnbm: ppnbm,
      biayaLain: biayaLain,
      total: total,
    });

    var pagination = paginateSqDocument(
      headerHtml,
      SQ_TABLE_THEAD,
      rowHtmls,
      footerHtml,
    );
    return renderSqPages(pagination);
  }

  function buildMemoDoc() {
    return (
      "" +
      '<div class="doc-card">' +
      buildDocHeader("Internal Memo") +
      '<div class="doc-meta">' +
      '<div class="doc-label">From</div><div class="doc-value">' +
      text(valueOf("memo_from")) +
      "</div>" +
      '<div class="doc-label">To</div><div class="doc-value">' +
      text(valueOf("memo_to")) +
      "</div>" +
      '<div class="doc-label">Date</div><div class="doc-value">' +
      formatDate(valueOf("memo_date")) +
      "</div>" +
      '<div class="doc-label">Subject</div><div class="doc-value">' +
      text(valueOf("memo_subject")) +
      "</div>" +
      '<div class="doc-label">Type</div><div class="doc-value">' +
      text(selectedMemoType()) +
      "</div>" +
      "</div>" +
      '<div class="doc-label">Note</div>' +
      '<div class="doc-note">' +
      text(valueOf("memo_note")) +
      "</div>" +
      '<div class="doc-sign"><div>Dibuat</div><div>Diketahui</div><div>Disetujui</div></div>' +
      "</div>"
    );
  }

  function buildPrDoc() {
    return (
      "" +
      '<div class="doc-card">' +
      buildDocHeader("Purchase Request") +
      '<div class="doc-meta">' +
      '<div class="doc-label">Tanggal</div><div class="doc-value">' +
      formatDate(valueOf("pr_date")) +
      "</div>" +
      '<div class="doc-label">Pemohon</div><div class="doc-value">' +
      text(valueOf("pr_name")) +
      "</div>" +
      '<div class="doc-label">Divisi / Unit</div><div class="doc-value">' +
      text(valueOf("pr_divisi")) +
      "</div>" +
      '<div class="doc-label">Kebutuhan</div><div class="doc-value">' +
      text(valueOf("pr_need")) +
      "</div>" +
      "</div>" +
      rowsToTable(prRows(), ["No", "Nama Barang", "Qty", "Keterangan"]) +
      '<div class="doc-label">Catatan</div>' +
      '<div class="doc-note">' +
      text(valueOf("pr_note")) +
      "</div>" +
      '<div class="doc-sign"><div>Dibuat</div><div>Diperiksa</div><div>Disetujui</div></div>' +
      "</div>"
    );
  }

  function validateSqForm() {
    if (page !== "SQ") {
      return true;
    }

    var recipient = valueOf("kepada_yth").trim();
    if (!recipient) {
      showModal("Silakan isi field 'Kepada Yth' terlebih dahulu.", function () {
        var recipientInput = document.getElementById("kepada_yth");
        if (recipientInput) {
          recipientInput.focus();
        }
      });
      return false;
    }

    var nomorUrut = valueOf("nomor_urut").trim();
    if (!nomorUrut) {
      showModal("Silakan isi field 'No. Urut' terlebih dahulu.", function () {
        var nomorUrutInput = document.getElementById("nomor_urut");
        if (nomorUrutInput) {
          nomorUrutInput.focus();
        }
      });
      return false;
    }

    return true;
  }

  function makePaperPage(innerHtml) {
    var paperEl = document.createElement("div");
    paperEl.className = "paper a4-sheet";

    var slotEl = document.createElement("div");
    slotEl.className = "paper-slot";
    slotEl.setAttribute("data-slot", "main");
    slotEl.innerHTML = innerHtml;

    paperEl.appendChild(slotEl);
    return paperEl;
  }

  function renderDocument() {
    if (!pagesContainer) {
      return;
    }

    var pagesHtml;

    if (page === "SQ") {
      if (!validateSqForm()) {
        return;
      }
      pagesHtml = buildExpensesPages();
    } else if (page === "internal-memo") {
      pagesHtml = [buildMemoDoc()];
    } else if (page === "purchase-request") {
      pagesHtml = [buildPrDoc()];
    } else {
      pagesHtml = [];
    }

    pagesContainer.innerHTML = "";
    pagesHtml.forEach(function (docHtml) {
      pagesContainer.appendChild(makePaperPage(docHtml));
    });

    documentFilled = true;
    updateButtons();
  }

  function clearDocument() {
    if (!pagesContainer) {
      return;
    }

    var paperEl = document.createElement("div");
    paperEl.className = "paper a4-sheet";

    var slotEl = document.createElement("div");
    slotEl.className = "paper-slot empty";
    slotEl.setAttribute("data-slot", "main");
    slotEl.innerHTML = "<span>" + escapeHtml(slotText) + "</span>";

    paperEl.appendChild(slotEl);

    pagesContainer.innerHTML = "";
    pagesContainer.appendChild(paperEl);

    documentFilled = false;
    updateButtons();
  }

  function updateButtons() {
    if (resetBtn) {
      resetBtn.disabled = !documentFilled;
    }
    if (printBtn) {
      printBtn.disabled = !documentFilled;
    }
  }

  function makeSqRow() {
    var div = document.createElement("div");
    div.className = "item-row sq-row can-remove";
    div.innerHTML =
      "" +
      '<input type="text" class="field js-source item-name" placeholder="Nama Barang">' +
      '<input type="text" class="field js-source item-merk" placeholder="Merk">' +
      '<input type="number" class="field js-source item-qty" value="1" min="1" inputmode="numeric" step="1">' +
      '<input type="text" class="field js-source item-sat" placeholder="Sat. (Btg/Pcs)">' +
      '<input type="text" class="field js-source item-price" placeholder="Rp.1000" inputmode="numeric">' +
      '<input type="number" class="field js-source item-disc" min="0" max="100" inputmode="numeric" step="1" placeholder="Disc %">' +
      '<button type="button" class="row-remove" title="Hapus">×</button>';
    return div;
  }

  function makePrRow() {
    var div = document.createElement("div");
    div.className = "item-row pr-row can-remove";
    div.innerHTML =
      "" +
      '<input type="text" class="field js-source item-name" placeholder="Nama Barang">' +
      '<input type="number" class="field js-source item-qty" value="1" min="1">' +
      '<input type="text" class="field js-source item-note" placeholder="Keterangan">' +
      '<button type="button" class="row-remove" title="Hapus">×</button>';
    return div;
  }

  function normalizeRowInput(target) {
    if (!target || !target.classList) {
      return;
    }

    if (target.classList.contains("item-sat")) {
      target.value = String(target.value).replace(/\d/g, "");
      return;
    }

    if (target.classList.contains("item-price")) {
      var digits = String(target.value).replace(/[^0-9]/g, "");
      if (!digits) {
        target.value = "";
        return;
      }
      target.value = "Rp." + parseInt(digits, 10).toLocaleString("id-ID");
      return;
    }

    if (
      target.classList.contains("item-qty") ||
      target.classList.contains("item-disc")
    ) {
      target.value = String(target.value).replace(/\D/g, "");
    }
  }

  function bindEvents() {
    function addRowForTarget(target) {
      if (target === "sq") {
        var sqContainer = document.getElementById("sqRows");
        if (sqContainer) {
          sqContainer.appendChild(makeSqRow());
        }
      }

      if (target === "pr") {
        var prContainer = document.getElementById("prRows");
        if (prContainer) {
          prContainer.appendChild(makePrRow());
        }
      }
    }

    var slotBtn = document.querySelector(".slot-main");
    if (slotBtn) {
      slotBtn.addEventListener("click", function () {
        renderDocument();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        clearDocument();
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }

    document.addEventListener("input", function (event) {
      normalizeRowInput(event.target);
    });

    document.addEventListener("click", function (event) {
      var addRowBtn = event.target.closest(".add-row");
      if (addRowBtn) {
        event.preventDefault();
        addRowForTarget(addRowBtn.getAttribute("data-target"));
        return;
      }

      if (event.target.classList.contains("row-remove")) {
        var row = event.target.closest(".item-row");
        if (row) {
          row.remove();
        }
        return;
      }
    });

    document.querySelectorAll(".memo-check").forEach(function (check) {
      check.addEventListener("change", function () {
        if (!check.checked) {
          return;
        }

        document.querySelectorAll(".memo-check").forEach(function (other) {
          if (other !== check) {
            other.checked = false;
          }
        });
      });
    });
  }

  function setDefaultDate() {
    var tanggalInput = document.getElementById("tanggal");
    if (tanggalInput && !tanggalInput.value) {
      var today = new Date();
      var year = today.getFullYear();
      var month = String(today.getMonth() + 1).padStart(2, "0");
      var day = String(today.getDate()).padStart(2, "0");
      tanggalInput.value = year + "-" + month + "-" + day;
    }
  }

  bindEvents();
  setDefaultDate();
  updateButtons();
})();
