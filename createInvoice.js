const PDFDocument = require("pdfkit");
const moment = require('moment');
const capitalize = s => (s && s[0].toUpperCase() + s.slice(1)) || ""
function createInvoice(invoice, path, res, recieptData, invoiceID) {
    const { customerName, phoneNumber, receipterName, paymentMode, paymentOption, totalAmount, partialPayment, balance, checkedAdditional, Cart } = recieptData;
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    let filename = `receipt_${customerName}_${invoiceID}.pdf`;
    
    // Set headers to open in the browser
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Generate PDF content
    generateHeader(doc);
    generateCustomerInformation(doc, invoiceID, recieptData);
    generateInvoiceTable(doc, recieptData);
    generateFooter(doc);

    // Pipe the PDF into the response
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

function generateCustomerInformation(doc, invoiceID, recieptData) {
    let invoiceDate = moment(Number(invoiceID)).format("MMM DD, YYYY hh:mm a");
    const customerInformationTop = 140;

    doc
        .fillColor("#444444")
        .fontSize(15)
        .text("Invoice", 50, 100);

    generateHr(doc, 125);

    doc
        .fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoiceID, 150, customerInformationTop)
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(invoiceDate, 150, customerInformationTop + 15)
        .text("Receipter Name:", 50, customerInformationTop + 30)
        .text(capitalize(recieptData.receipterName), 150, customerInformationTop + 30)
        .font("Helvetica-Bold")
        .text(capitalize(recieptData.customerName), 300, customerInformationTop)
        .font("Helvetica")
        .text("+91 " + recieptData.phoneNumber, 300, customerInformationTop + 15)
        .text("Transaction Mode: " + recieptData.paymentOption, 300, customerInformationTop + 30)
        .moveDown();

    generateHr(doc, 200);
}

function generateInvoiceTable(doc, recieptData) {
    let position = 230; // Starting Y position for the table
    const tableHeaderHeight = 20;

    // Table header
    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        position,
        "Sr",
        "Item",
        "Flavour",
        "MRP",
        "Disc",
        "Rate",
        "Qty",
        "Total"
    );
    generateHr(doc, position + tableHeaderHeight);  // HR right after header
    position += tableHeaderHeight +8;  // Move below HR

    // Table content
    doc.font("Helvetica");

    for (let i = 0; i < recieptData.Cart.length; i++) {
        const item = recieptData.Cart[i];

        // Calculate row height dynamically based on item name length
        const itemNameHeight = doc.heightOfString(item.name, { width: 90 });
        const rowHeight = Math.max(20, itemNameHeight); // Ensure a minimum row height of 20

      
        generateTableRow(
            doc,
            position,
            i + 1,
            capitalize(item.name),
            item?.flavour ? capitalize(item.flavour) : "NA",
            item.mrpOfProduct,
            (100 - Number((item.sellPrice / item.mrpOfProduct) * 100).toFixed(0)) + "%",
            item.sellPrice,
            item.buyingQty,
            item.buyingQty * item.sellPrice
        );

        // Move to the next row
        position += rowHeight;  // Only increase by rowHeight, no extra padding

        // Draw the HR touching the next row
        generateHr(doc, position );

        // Move down just enough for the next row to start directly after HR
        position += 10;  // Very minimal space so the row touches HR
    }

    // Additional charges (if any) and totals
    position += 10;
    if (recieptData.checkedAddittional) {
        generateTableRow(
            doc,
            position,
            "",
            "",
            "",
            "",
            "",
            "",
            recieptData.checkedAddittional.type + " Fee",
            "Rs. " + Number(recieptData.checkedAddittional.amount)
        );
        position += 20;  // Move down
        generateHr(doc, position);
    }

    // Totals
    generateTableRow(
        doc,
        position,
        "",
        "",
        "",
        "",
        "",
        "",
        "Total Amount",
        "Rs. " + Number(recieptData.totalAmmount)
    );
    position += 20;
    generateHr(doc, position);

    generateTableRow(
        doc,
        position + 10,
        "",
        "",
        "",
        "",
        "",
        "",
        "Paid Amount",
        "Rs. " + Number(recieptData.totalAmmount - recieptData.balance)
    );
    position += 30;

    if (recieptData.balance) {
        doc.font("Helvetica-Bold");
        generateTableRow(
            doc,
            position,
            "",
            "",
            "",
            "",
            "",
            "",
            "Balance Due",
            "Rs. " + Number(recieptData.balance)
        );
        doc.font("Helvetica");
    }
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
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
    flavour,
    mrpOfProduct,
    disc,
    buyingQty,
    sellPrice,
    total
) {
        doc
        .fontSize(10)
        .text(item, 50, y)  // "Sr" column, starts at 50
        .text(name, 70, y, { width: 100, align: "left" })  // "Item" column, width reduced to 80
        .text(flavour, 200, y, { width: 80, align: "left" })  // "Flavour" column starts at 150
        .text(mrpOfProduct, 230, y, { width: 70, align: "right" })  // "MRP" column starts at 230
        .text(disc, 300, y, { width: 50, align: "right" })  // "Disc" column starts at 300
        .text(buyingQty, 350, y, { width: 50, align: "right" })  // "Qty" column starts at 350
        .text(sellPrice, 400, y, { width: 60, align: "right" })  // "Rate" column starts at 400
        .text(total, 460, y, { width: 90, align: "right" });  
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

module.exports = {
    createInvoice
};
