import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  await resend.emails.send({
    from: "no-reply@deailyneedscarts.com",
    to,
    subject,
    html,
  });
};

export default sendEmail;
