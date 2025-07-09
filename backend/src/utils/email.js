const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  // Development mode - just log the email instead of sending
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("📧 [DEV MODE] Email would be sent:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Content: ${text}`);
    console.log("  ✅ Email logged (not sent in development mode)");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Use 465 for SSL or 587 for TLS
    secure: true, // Set to true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    // In development, don't throw error - just log it
    if (process.env.NODE_ENV === 'development') {
      console.log("📧 [DEV MODE] Email failed to send but continuing...");
      return;
    }
    throw error;
  }
};

module.exports = { sendEmail };
