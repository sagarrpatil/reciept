const express = require("express");
const axios = require("axios");
var firebase = require('firebase')
const cors = require('cors');
const FormData = require('form-data');
const bodyParser = require('body-parser');
const app = express();
const cheerio = require('cheerio');
const Buffer = require('buffer').Buffer;
const cron = require('node-cron');
const PDFDocument = require('pdfkit');
app.use(cors());
app.use(bodyParser.json());

const PORT = 9000;
const moment = require('moment');
var firebaseConfig = {
  apiKey: "AIzaSyDmzc1OQFVeuosyRS4263k2fPPIIL6Fo1Y",
  authDomain: "merashows.firebaseapp.com",
  databaseURL: "https://merashows-default-rtdb.firebaseio.com",
  projectId: "merashows",
  storageBucket: "merashows.appspot.com",
  messagingSenderId: "909913122644",
  appId: "1:909913122644:web:d993e7e78d284f308a0ac1",
  measurementId: "G-X2CQNZX4QW"
};
firebase.initializeApp(firebaseConfig)
let database = firebase.database();

// app.get('/api/getAllEvents', async (req, res) => {
//   try {
//     const snapshot = await database.ref('/events').orderByChild('rank').once('value');
//     const eventsArray = Object.entries(snapshot.val() || {}).map(([key, value]) => ({ key, ...value }));
//     const sortedEvents = eventsArray
//       .filter(event => event.active === true)
//       .sort((a, b) => a.rank - b.rank);
//     const resultEvents = sortedEvents.reduce((acc, event) => {
//       acc[event.key] = event;
//       return acc;
//     }, {});

//     console.log(resultEvents); // Log the sorted and filtered events for debugging
//     res.json(resultEvents);
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });




// Sample data for demonstration
const sampleData = {
    '1': {
        id: '1',
        name: 'John Doe',
        address: '123 Main St, Anytown, USA',
        phone: '123-456-7890',
        invoiceNumber: 'INV-001',
        date: new Date().toLocaleDateString(),
        products: [
            { type: 'Product A', mrp: 100, qty: 2, discount: 10, rate: 90, total: 180 },
            { type: 'Product B', mrp: 200, qty: 1, discount: 20, rate: 180, total: 180 }
        ]
    },
    // Add more sample data as needed
};

app.get('/generate-pdf/:id/:invoice', (req, res) => {
    const { id, invoice } = req.params;

    // Fetch customer data based on the ID (for demo purposes, using sample data)
    const customerData = sampleData[id];

    if (!customerData || customerData.invoiceNumber !== invoice) {
        return res.status(404).send('Receipt not found');
    }

    const doc = new PDFDocument();
    let filename = `receipt_${invoice}.pdf`;
    
    // Set headers to open in the browser
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF into the response
    doc.pipe(res);

    // Add a stylish title
    doc.fontSize(30).fillColor('blue').text('Receipt', { align: 'center' });
    doc.moveDown();

    // Add customer details with a separator line
    doc.fillColor('black').fontSize(12).text(`Name: ${customerData.name}`, { continued: true }).text('                               ');
    doc.text(`Address: ${customerData.address}`);
    doc.text(`Phone: ${customerData.phone}`);
    doc.text(`Invoice Number: ${customerData.invoiceNumber}`);
    doc.text(`Date: ${customerData.date}`);
    doc.moveDown();

    // Draw a horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Add table headers with styling
    const tableHeaders = ['Product Type', 'MRP', 'Qty', 'Discount', 'Rate', 'Total'];

    // Set header style
    doc.fillColor('white').rect(50, doc.y, 500, 20).fill();
    doc.fillColor('black').fontSize(12);
    tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + (i * 80), doc.y, { width: 80, align: 'center', font: 'Helvetica-Bold' });
    });

    doc.moveDown(1); // move down for the table rows

    // Draw table rows
    customerData.products.forEach((product, rowIndex) => {
        const rowY = doc.y;
        doc.fillColor('lightgray').rect(50, rowY, 500, 20).fill(); // row background
        doc.fillColor('black').text(product.type, 50, rowY, { width: 80 });
        doc.text(product.mrp.toString(), 130, rowY, { width: 80, align: 'center' });
        doc.text(product.qty.toString(), 210, rowY, { width: 80, align: 'center' });
        doc.text(product.discount.toString(), 290, rowY, { width: 80, align: 'center' });
        doc.text(product.rate.toString(), 370, rowY, { width: 80, align: 'center' });
        doc.text(product.total.toString(), 450, rowY, { width: 80, align: 'center' });
    });

    // Finalize the PDF and end the stream
    doc.end();
});






// setInterval(() => {
process.env.TZ = 'Asia/Kolkata';



app.listen(process.env.PORT || PORT, () => {
    console.log('listening on *:' + PORT);
});
