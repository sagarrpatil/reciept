
const PDFDocument = require("pdfkit");
const moment = require('moment');
function createInvoice(invoice, path, res, recieptData, invoiceID) {
    const { customerName, phoneNumber, receipterName, paymentMode, paymentOption, totalAmount, partialPayment, balance, checkedAdditional, Cart } = recieptData;
  let doc = new PDFDocument({ size: "A4", margin: 50 });
  let filename = `receipt_${invoice}.pdf`;
    
  // Set headers to open in the browser
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');

  // Pipe the PDF into the response

  generateHeader(doc);
  generateCustomerInformation(doc, invoice, invoiceID, recieptData);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);
  doc.pipe(res);
  doc.end();
//   doc.pipe(fs.createWriteStream(path));
}

function generateHeader(doc) {
  doc
    .image("logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("DY Nutrition", 110, 57)
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
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoiceID, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(str, 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
      "Rs " + recieptData.balance,
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(recieptData.customerName, 300, customerInformationTop)
    .font("Helvetica")
    .text("+91 " + recieptData.phoneNumber, 300, customerInformationTop + 15)
    .text(
        "Transaction Mode: "+ recieptData.paymentOption,
      300,
      customerInformationTop + 30
    ) .text(
        "Receipter Name: "+ recieptData.receipterName,
      300,
      customerInformationTop + 45
    )
    .moveDown();

  generateHr(doc, 260);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.item,
      item.description,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Paid To Date",
    "",
    formatCurrency(invoice.paid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Balance Due",
    "",
    formatCurrency(invoice.subtotal - invoice.paid)
  );
  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
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

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

module.exports = {
  createInvoice
};