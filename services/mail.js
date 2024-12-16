const nodemailer = require("nodemailer");
const ejs = require('ejs');
const path = require('path');

// Create a reusable transporter
const transporter = nodemailer.createTransport({
    host: `${process.env.MAIL_HOST}`,
    port: process.env.MAIL_PORT,
    auth: {
        user: `${process.env.MAIL_USER}`,
        pass: `${process.env.MAIL_PASS}`
    }
});

// Export a function to send emails
const sendEmail = async (to, subject) => {
    try {
        const data = {
            name: 'John Doe',
            age: 30
        };
        const templatePath = path.join(__dirname, '../templates', 'template.ejs');
        const renderedHtml = await ejs.renderFile(templatePath, data);

        const mailOptions = {
            from: '"Your Name" <your-email@gmail.com>',
            to,
            subject,
            html: renderedHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

const sendBookingTicketEmail = async (to, data) => {
    try {
        // const data = {
        //     fullName: "Adi Hardianto",
        //     birthDate: "12-10-1991",
        //     nationality: "Indonesia",
        //     phoneNumber: "+6281444410280",
        //     email: "fahim.sgs@gmail.com",
        //     departureDate: "31-07-2022",
        //     localTourists: 1,
        //     internationalTourists: 0,
        //     totalPayment: 10000, // in IDR
        //     ticketImage: "/path/to/ticket-image.jpg"
        // };

        const templatePath = path.join(__dirname, '../templates', 'bookingTicket.ejs');
        const renderedHtml = await ejs.renderFile(templatePath, data);

        const mailOptions = {
            from: '"Your Name" <your-email@gmail.com>',
            to,
            subject: "Booking Ticket",
            html: renderedHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email booking ticket sent successfully:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending  booking ticket email:", error.message);
        throw error;
    }
}

module.exports = { sendEmail, sendBookingTicketEmail };
