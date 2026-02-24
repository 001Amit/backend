import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Gmail App Password
    },
  });

  await transporter.sendMail({
    from: `"E-Commerce" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
