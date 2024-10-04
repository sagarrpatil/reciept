const PDFDocument = require("pdfkit");
const moment = require('moment');

function createInvoice(invoice, path, res, recieptData, invoiceID) {
    const { customerName, phoneNumber, receipterName, paymentMode, paymentOption, totalAmount, partialPayment, balance, checkedAdditional, Cart } = recieptData;
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    let filename = `receipt_${customerName}_${invoiceID}.pdf`;
    
    // Set headers to open in the browser
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF into the response
    generateHeader(doc);
    generateCustomerInformation(doc, invoice, invoiceID, recieptData);
    generateInvoiceTable(doc, invoice, recieptData);
    generateFooter(doc);
    doc.pipe(res);
    doc.end();
}

function generateHeader(doc) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("DY Nutritions", 50, 57)
        .fontSize(10)
        .text("Jadhavnagar, Wadgaon", 200, 50, { align: "right" })
        .text("Pune - 411041", 200, 65, { align: "right" })
        .text("+91 99709 09757", 200, 80, { align: "right" })
        .moveDown();
}

function generateCustomerInformation(doc, invoice, invoiceID, recieptData) {
    let str = moment(Number(invoiceID)).format("MMM DD, YYYY hh:mm a");
    doc
        .fillColor("#444444")
        .fontSize(15)
        .text("Invoice", 50, 100);

    generateHr(doc, 125);

    const customerInformationTop = 140;

    doc
        .fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoiceID, 150, customerInformationTop)
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(str, 150, customerInformationTop + 15)
        .text("Receipter Name:", 50, customerInformationTop + 30)
        .text(
            recieptData.receipterName,
            150,
            customerInformationTop + 30
        )
        .font("Helvetica-Bold")
        .text(recieptData.customerName, 300, customerInformationTop)
        .font("Helvetica")
        .text("+91 " + recieptData.phoneNumber, 300, customerInformationTop + 15)
        .text(
            "Transaction Mode: " + recieptData.paymentOption,
            300,
            customerInformationTop + 30
        )
        .moveDown();

    generateHr(doc, 200);
}

function generateInvoiceTable(doc, invoice, recieptData) {
    let i;
    const invoiceTableTop = 230;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Sr",
        "Item",
        "MRP",
        "Disc",
        "Rate",
        "Qty",
        "Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < recieptData.Cart.length; i++) {
        const item = recieptData.Cart[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            i + 1,
            item.name,
            item.mrpOfProduct,
            (100 - Number((item.sellPrice / item.mrpOfProduct) * 100).toFixed(0)) + "%",
            item.sellPrice,
            item.buyingQty,
            item.buyingQty * item.sellPrice
        );

        generateHr(doc, position + 20);
    }

    let subtotalPosition = invoiceTableTop + (i + 1) * 30;
    if (recieptData?.checkedAdditional) {
        subtotalPosition += 20;
        generateTableRow(
            doc,
            invoiceTableTop + (i + 1) * 30,
            "",
            "",
            "",
            "",
            "",
            recieptData.checkedAdditional.type + " Fee",
            "Rs. " + Number(recieptData.checkedAdditional.amount)
        );
    }
    generateTableRow(
        doc,
        subtotalPosition,
        "",
        "",
        "",
        "",
        "",
        "Total Amount",
        "Rs. " + Number(recieptData.totalAmount)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        "",
        "",
        "",
        "",
        "",
        "Paid Amount",
        "Rs. " + Number(recieptData.totalAmount - recieptData.balance)
    );

    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    if (recieptData.balance) {
        generateTableRow(
            doc,
            duePosition,
            "",
            "",
            "",
            "",
            "",
            "Balance Due",
            "Rs. " + Number(recieptData.balance)
        );
    }
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "No Return and No Replace",
            50,
            780,
            { align: "center", width: 500 }
        );
}

function generateTableRow(
    doc,
    y,
    item,
    name,
    mrpOfProduct,
    disc,
    buyingQty,
    sellPrice,
    total
) {
    const nameWidth = 90;
    const nameY = doc.y;

    // Check if name needs to be wrapped
    if (doc.widthOfString(name) > nameWidth) {
        const nameLines = doc.text(name, 70, y, { width: nameWidth, align: "left" }).split("\n");
        const lineHeight = 15; // Adjust line height as necessary
        nameLines.forEach((line, index) => {
            doc.text(line, 70, nameY + index * lineHeight, { width: nameWidth, align: "left" });
        });
    } else {
        doc.text(name, 70, y);
    }

    doc
        .fontSize(10)
        .text(item, 50, y)
        .text(mrpOfProduct, 170, y, { width: 90, align: "right" })
        .text(disc, 230, y, { width: 90, align: "right" })
        .text(buyingQty, 300, y, { width: 90, align: "right" })
        .text(sellPrice, 350, y, { width: 90, align: "right" })
        .text(total, 420, y, { width: 90, align: "right" });
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(cents) {
    return "$" + (cents / 100).toFixed(2);
}

module.exports = {
    createInvoice
};
