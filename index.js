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
const fs = require("fs");
const PDFDocument = require('pdfkit');
app.use(cors());
app.use(bodyParser.json());
const { createInvoice } = require("./createInvoice.js");

const PORT = 9000;
const moment = require('moment');
var firebaseConfig = {
    apiKey: 'AIzaSyCRaOwpNVRQpLvR4BBhiZRDgGOeh1QeKlQ',
    authDomain: 'fitnessspacehub.firebaseapp.com',
    databaseURL: 'https://fitnessspacehub-default-rtdb.firebaseio.com',
    projectId: 'fitnessspacehub',
    storageBucket: 'fitnessspacehub.appspot.com',
    messagingSenderId: '557014361022',
    appId: '1:557014361022:web:432618e887aa7a4d998fef',
    measurementId: 'G-QQ63KRPMXK',
};
firebase.initializeApp(firebaseConfig)
let database = firebase.database();
const invoice = {
    shipping: {
      name: "John Doe",
      address: "1234 Main Street",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postal_code: 94111
    },
    items: [
      {
        item: "TC 100",
        description: "Toner Cartridge",
        quantity: 2,
        amount: 6000
      },
      {
        item: "USB_EXT",
        description: "USB Cable Extender",
        quantity: 1,
        amount: 2000
      }
    ],
    subtotal: 8000,
    paid: 0,
    invoice_nr: 1234
  };

app.get('/invoice/:id/:invoiceID', async (req, res) => {
    const { id, invoiceID } = req.params;
  try {
            const snapshot = await database.ref(id + '/transactions/'+ invoiceID).once('value');
            const recieptData = snapshot.val();
          
        console.log(recieptData)

        if (!recieptData) {
            return res.status(404).send('Receipt not found');
        }
        createInvoice(invoice, "invoice.pdf", res, recieptData, invoiceID);
} catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

// Sample data for demonstration


// app.get('/invoice/:id/:invoice', async (req, res) => {
//     const { id, invoice } = req.params;
 

//     try {
//         const snapshot = await database.ref(id + '/transactions/'+ invoice).once('value');
//         const recieptData = snapshot.val();
      
//     console.log(recieptData)
//     const { customerName, phoneNumber, receipterName, paymentMode, paymentOption, totalAmount, partialPayment, balance, checkedAdditional, Cart } = recieptData;
//     if (!recieptData) {
//         return res.status(404).send('Receipt not found');
//     }

//     const doc = new PDFDocument();
//     let filename = `receipt_${invoice}.pdf`;
    
//     // Set headers to open in the browser
//     res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
//     res.setHeader('Content-Type', 'application/pdf');

//     // Pipe the PDF into the response
//     doc.pipe(res);

//     // Add a stylish title
//     doc.fontSize(30).fillColor('blue').text('Receipt', { align: 'center' });
//     doc.moveDown();

//     // Add customer details with a separator line
//     doc.fillColor('black').fontSize(12).text(`Name: ${customerName}`, { continued: true }).text('                               ');
//     // doc.text(`Address: ${recieptData.address}`);
//     doc.text(`Phone: ${phoneNumber}`);
//     doc.text(`Invoice Number: ${invoice}`);
//     doc.text(`Date: ${moment(Number(invoice)).format("MMM DD, YYYY")}`);
//     doc.moveDown();

//     // Draw a horizontal line
//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
//     doc.moveDown();

//     const tableHeaders = ['Product Name', 'MRP', 'Quantity', 'Selling Price', 'Total'];

// // Set header background color
//         doc.fillColor('#007BFF').rect(50, doc.y, 500, 30).fill(); // Blue background
//         doc.fillColor('white').fontSize(12).font('Helvetica-Bold'); // Use a supported font

//         // Add headers with adjusted positions
//         const headerY = doc.y;
//         tableHeaders.forEach((header, i) => {
//             doc.text(header, 50 + (i * 80), headerY, { width: 80, align: 'center' });
//         });



// // Move down to prepare for table rows
// doc.moveDown(1); // Move down for the table rows

// // Draw table rows for each product in the cart
// Cart.forEach((product, rowIndex) => {
//     const rowY = doc.y;
//     doc.fillColor('lightgray').rect(50, rowY, 500, 20).fill(); // Row background
//     doc.fillColor('black')
//         .font('Helvetica') // Ensure to use a supported font for rows too
//         .text(product.name, 50, rowY, { width: 100 })
//         .text(`₹${product.mrpOfProduct}`, 150, rowY, { width: 100, align: 'center' })
//         .text(product.quantity.toString(), 250, rowY, { width: 100, align: 'center' })
//         .text(`₹${product.sellPrice}`, 350, rowY, { width: 100, align: 'center' })
//         .text(`₹${(product.sellPrice * product.quantity).toFixed(2)}`, 450, rowY, { width: 100, align: 'center' });
// });


//     doc.end();
// } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });







// setInterval(() => {
process.env.TZ = 'Asia/Kolkata';



app.listen(process.env.PORT || PORT, () => {
    console.log('listening on *:' + PORT);
});
