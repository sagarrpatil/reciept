const PDFDocument = require("pdfkit");
const moment = require('moment');
const path = require("path");
const fs = require("fs");

const LOGO_PATH = path.join(__dirname, "brand-logo.png");

const COLORS = {
    brandDark: "#16142a",   // matches the logo background
    accent: "#f59e0b",
    text: "#1f2937",
    muted: "#6b7280",
    border: "#e5e7eb",
    panel: "#f5f6fa",
    stripe: "#fafafa",
    danger: "#dc2626",
    success: "#16a34a",
};

const PAGE = { left: 40, right: 555, width: 515, bottomLimit: 740 };

// Table columns: x position, width, alignment
const COLUMNS = [
    { key: "sr", label: "#", x: 40, width: 25, align: "center" },
    { key: "name", label: "Item", x: 68, width: 145, align: "left" },
    { key: "flavour", label: "Flavour", x: 216, width: 82, align: "left" },
    { key: "mrp", label: "MRP", x: 300, width: 55, align: "right" },
    { key: "disc", label: "Disc", x: 357, width: 40, align: "right" },
    { key: "rate", label: "Rate", x: 399, width: 55, align: "right" },
    { key: "qty", label: "Qty", x: 456, width: 30, align: "right" },
    { key: "total", label: "Amount", x: 488, width: 62, align: "right" },
];

const capitalize = s => (s && String(s)[0].toUpperCase() + String(s).slice(1)) || "";
const toNumber = v => Number(v) || 0;
const money = v => "Rs. " + toNumber(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function createInvoice(invoice, path, res, recieptData, invoiceID) {
    const { customerName } = recieptData;
    let doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 20, left: 40, right: 40 }, bufferPages: true });
    let filename = `receipt_${customerName}_${invoiceID}.pdf`;

    // Set headers to open in the browser
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF into the response
    doc.pipe(res);

    // Generate PDF content
    generateHeader(doc);
    let position = generateCustomerInformation(doc, invoiceID, recieptData);
    position = generateInvoiceTable(doc, recieptData, position);
    generateTotals(doc, recieptData, position);
    generateFooters(doc);

    doc.end();
}

function generateHeader(doc) {
    doc.rect(0, 0, doc.page.width, 130).fill(COLORS.brandDark);
    doc.rect(0, 130, doc.page.width, 4).fill(COLORS.accent);

    if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, PAGE.left, 12, { width: 106, height: 106 });
    }

    doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(24)
        .text("DY Nutritions", 200, 30, { width: PAGE.right - 200, align: "right" })
        .fillColor(COLORS.accent)
        .font("Helvetica")
        .fontSize(10)
        .text("Supplements & Sports Nutrition", 200, 60, { width: PAGE.right - 200, align: "right" })
        .fillColor("#d1d5db")
        .fontSize(9)
        .text("Jadhavnagar, Wadgaon, Pune - 411041", 200, 80, { width: PAGE.right - 200, align: "right" })
        .text("+91 99709 09757", 200, 94, { width: PAGE.right - 200, align: "right" });
}

function generateCustomerInformation(doc, invoiceID, recieptData) {
    const invoiceDate = moment(Number(invoiceID)).format("DD MMM YYYY, hh:mm A");
    const titleTop = 152;

    doc
        .fillColor(COLORS.brandDark)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("RECEIPT", PAGE.left, titleTop);

    doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLORS.muted)
        .text("Receipt No.", 330, titleTop, { width: 100 })
        .text("Date", 330, titleTop + 14, { width: 100 })
        .fillColor(COLORS.text)
        .font("Helvetica-Bold")
        .text(String(invoiceID), 400, titleTop, { width: 155, align: "right" })
        .font("Helvetica")
        .text(invoiceDate, 400, titleTop + 14, { width: 155, align: "right" });

    // Two info panels
    const panelTop = 190;
    const panelHeight = 72;
    const panelWidth = 250;
    drawPanel(doc, PAGE.left, panelTop, panelWidth, panelHeight, "BILLED TO", [
        { text: capitalize(recieptData.customerName), bold: true, size: 12 },
        { text: recieptData.phoneNumber ? "+91 " + recieptData.phoneNumber : "" },
    ]);
    drawPanel(doc, PAGE.right - panelWidth, panelTop, panelWidth, panelHeight, "PAYMENT DETAILS", [
        { text: "Mode: " + (capitalize(recieptData.paymentOption || recieptData.paymentMode) || "NA") },
        { text: "Received by: " + (capitalize(recieptData.receipterName) || "NA") },
    ]);

    return panelTop + panelHeight + 20;
}

function drawPanel(doc, x, y, width, height, title, lines) {
    doc.roundedRect(x, y, width, height, 6).fill(COLORS.panel);
    doc.rect(x, y, 3, height).fill(COLORS.accent);

    doc
        .fillColor(COLORS.muted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(title, x + 14, y + 12, { characterSpacing: 1 });

    let lineY = y + 28;
    lines.forEach(line => {
        if (!line.text) return;
        doc
            .fillColor(COLORS.text)
            .font(line.bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(line.size || 10)
            .text(line.text, x + 14, lineY, { width: width - 28, lineBreak: false, ellipsis: true });
        lineY += (line.size || 10) + 6;
    });
}

function generateTableHeader(doc, y) {
    doc.rect(PAGE.left, y, PAGE.width, 24).fill(COLORS.brandDark);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    COLUMNS.forEach(col => {
        doc.text(col.label, col.x, y + 8, { width: col.width, align: col.align });
    });
    return y + 24;
}

function generateInvoiceTable(doc, recieptData, startY) {
    let position = generateTableHeader(doc, startY);
    const cart = recieptData.Cart || [];

    cart.forEach((item, i) => {
        const mrp = toNumber(item.mrpOfProduct);
        const rate = toNumber(item.sellPrice);
        const qty = toNumber(item.buyingQty);
        const disc = mrp > 0 ? Math.max(0, Math.round(100 - (rate / mrp) * 100)) : 0;

        const values = {
            sr: String(i + 1),
            name: capitalize(item.name),
            flavour: item?.flavour ? capitalize(item.flavour) : "NA",
            mrp: mrp.toLocaleString("en-IN"),
            disc: disc + "%",
            rate: rate.toLocaleString("en-IN"),
            qty: String(qty),
            total: (qty * rate).toLocaleString("en-IN"),
        };

        doc.font("Helvetica").fontSize(9);
        const textHeight = Math.max(
            doc.heightOfString(values.name, { width: COLUMNS[1].width }),
            doc.heightOfString(values.flavour, { width: COLUMNS[2].width })
        );
        const rowHeight = Math.max(24, textHeight + 14);

        if (position + rowHeight > PAGE.bottomLimit) {
            doc.addPage();
            position = generateTableHeader(doc, 40);
        }

        if (i % 2 === 1) {
            doc.rect(PAGE.left, position, PAGE.width, rowHeight).fill(COLORS.stripe);
        }

        doc.fillColor(COLORS.text).font("Helvetica").fontSize(9);
        COLUMNS.forEach(col => {
            doc
                .font(col.key === "name" || col.key === "total" ? "Helvetica-Bold" : "Helvetica")
                .fillColor(col.key === "disc" && disc > 0 ? COLORS.success : COLORS.text)
                .text(values[col.key], col.x, position + 7, { width: col.width, align: col.align });
        });

        position += rowHeight;
        generateHr(doc, position);
    });

    return position + 16;
}

function generateTotals(doc, recieptData, startY) {
    const cart = recieptData.Cart || [];
    // Field names as stored in Firebase (with fallbacks for the correctly spelled variants)
    const additional = recieptData.checkedAddittional || recieptData.checkedAdditional;
    const totalAmount = toNumber(recieptData.totalAmmount ?? recieptData.totalAmount);
    const balance = toNumber(recieptData.balance);
    const subtotal = cart.reduce((sum, item) => sum + toNumber(item.buyingQty) * toNumber(item.sellPrice), 0);
    const mrpTotal = cart.reduce((sum, item) => sum + toNumber(item.buyingQty) * toNumber(item.mrpOfProduct), 0);
    const savings = mrpTotal - subtotal;

    const rows = [{ label: "Subtotal", value: money(subtotal) }];
    if (additional && additional.amount) {
        rows.push({ label: capitalize(additional.type) + " Fee", value: money(additional.amount) });
    }

    const boxWidth = 230;
    const boxX = PAGE.right - boxWidth;
    const boxHeight = rows.length * 20 + 34 + 20 + (balance ? 28 : 0) + 16;

    if (startY + boxHeight > PAGE.bottomLimit) {
        doc.addPage();
        startY = 40;
    }

    // "You saved" badge on the left
    if (savings > 0) {
        doc.roundedRect(PAGE.left, startY, 200, 40, 6).fill("#ecfdf5");
        doc
            .fillColor(COLORS.success)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text("YOU SAVED", PAGE.left + 14, startY + 8, { characterSpacing: 1 })
            .fontSize(13)
            .text(money(savings) + " on MRP", PAGE.left + 14, startY + 20);
    }

    let y = startY + 8;
    doc.font("Helvetica").fontSize(10);
    rows.forEach(row => {
        totalsRow(doc, boxX, y, boxWidth, row.label, row.value, COLORS.muted);
        y += 20;
    });

    // Grand total band
    doc.roundedRect(boxX, y, boxWidth, 30, 4).fill(COLORS.brandDark);
    doc.font("Helvetica-Bold").fontSize(12);
    totalsRow(doc, boxX, y + 9, boxWidth, "Total", money(totalAmount), "#ffffff");
    y += 38;

    doc.font("Helvetica").fontSize(10);
    totalsRow(doc, boxX, y, boxWidth, "Paid", money(totalAmount - balance), COLORS.success);
    y += 20;

    if (balance) {
        doc.roundedRect(boxX, y, boxWidth, 26, 4).fill("#fef2f2");
        doc.font("Helvetica-Bold").fontSize(11);
        totalsRow(doc, boxX, y + 8, boxWidth, "Balance Due", money(balance), COLORS.danger);
    } else {
        doc
            .roundedRect(boxX + boxWidth - 90, y, 80, 22, 11)
            .lineWidth(1.5)
            .stroke(COLORS.success);
        doc
            .fillColor(COLORS.success)
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("PAID", boxX + boxWidth - 90, y + 6, { width: 80, align: "center", characterSpacing: 2 });
    }
}

function totalsRow(doc, x, y, width, label, value, color) {
    doc
        .fillColor(color)
        .text(label, x + 12, y, { width: width / 2 - 12 })
        .text(value, x + width / 2, y, { width: width / 2 - 12, align: "right" });
}

function generateHr(doc, y) {
    doc
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .moveTo(PAGE.left, y)
        .lineTo(PAGE.right, y)
        .stroke();
}

function generateFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0; // allow drawing in the bottom margin without triggering a new page
        const top = 770;
        doc.rect(0, top, doc.page.width, 2).fill(COLORS.accent);
        doc
            .fillColor(COLORS.brandDark)
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("Thank you for shopping with DY Nutritions!", PAGE.left, top + 14, { width: PAGE.width, align: "center", lineBreak: false })
            .fillColor(COLORS.muted)
            .font("Helvetica")
            .fontSize(8)
            .text("No Return and No Replace  •  This is a computer generated receipt", PAGE.left, top + 32, { width: PAGE.width, align: "center", lineBreak: false });

        if (range.count > 1) {
            doc.text(`Page ${i + 1} of ${range.count}`, PAGE.left, top + 46, { width: PAGE.width, align: "right", lineBreak: false });
        }
    }
}

module.exports = {
    createInvoice
};
