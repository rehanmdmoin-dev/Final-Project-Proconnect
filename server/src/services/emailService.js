const transporter = require('../config/mail');

/**
 * Spec section 21: reusable email functions, no SMTP code in controllers.
 * Every function swallows its own errors - a failed email must not break
 * the request that triggered it.
 */
const send = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error(`Email send failed (${subject} -> ${to}):`, error.message);
        return false;
    }
};

const wrap = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
    <h2 style="color:#1b2430;margin-top:0">${title}</h2>
    ${body}
    <p style="color:#888;font-size:12px;margin-top:28px">ProConnect</p>
  </div>`;

const sendWelcomeEmail = (user) =>
    send({
        to: user.email,
        subject: 'Welcome to ProConnect',
        html: wrap(`Welcome, ${user.name}`, `
            <p>Your ProConnect account has been created as a <b>${user.role}</b>.</p>
            <p>Complete your profile to get the most out of the platform.</p>`),
    });

const sendEmailVerificationCode = (user, code) =>
    send({
        to: user.email,
        subject: 'Verify your ProConnect email',
        html: wrap('Verify your email address', `
            <p>Hello ${user.name},</p>
            <p>Enter this code to verify your ProConnect account. It expires in 10 minutes.</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
            <p style="color:#888;font-size:12px">If you didn't create this account, you can ignore this email.</p>`),
    });

const sendPasswordResetEmail = (user, resetUrl) =>
    send({
        to: user.email,
        subject: 'Reset your ProConnect password',
        html: wrap('Password reset requested', `
            <p>Hello ${user.name},</p>
            <p>Click below to set a new password. This link expires in 15 minutes and can only be used once.</p>
            <p><a href="${resetUrl}" style="background:#1b2430;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px">Reset password</a></p>
            <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>`),
    });

const sendApplicationConfirmation = (user, job) =>
    send({
        to: user.email,
        subject: `Application received - ${job.title}`,
        html: wrap('Application submitted', `
            <p>Hello ${user.name},</p>
            <p>Your application for <b>${job.title}</b> has been submitted successfully.</p>`),
    });

const sendApplicationStatusEmail = (user, job, status) =>
    send({
        to: user.email,
        subject: `Application update - ${job.title}`,
        html: wrap('Application status updated', `
            <p>Hello ${user.name},</p>
            <p>Your application for <b>${job.title}</b> is now: <b>${status}</b>.</p>`),
    });

const sendInterviewInvitation = (user, job, interview) =>
    send({
        to: user.email,
        subject: `Interview scheduled - ${job.title}`,
        html: wrap('Interview scheduled', `
            <p>Hello ${user.name},</p>
            <p>An interview has been scheduled for <b>${job.title}</b>.</p>
            <ul>
              <li><b>When:</b> ${new Date(interview.scheduledAt).toLocaleString()}</li>
              <li><b>Mode:</b> ${interview.mode}</li>
              ${interview.meetingLink ? `<li><b>Link:</b> <a href="${interview.meetingLink}">${interview.meetingLink}</a></li>` : ''}
              ${interview.address ? `<li><b>Address:</b> ${interview.address}</li>` : ''}
            </ul>
            ${interview.notes ? `<p><b>Notes:</b> ${interview.notes}</p>` : ''}`),
    });

module.exports = {
    send,
    sendWelcomeEmail,
    sendEmailVerificationCode,
    sendPasswordResetEmail,
    sendApplicationConfirmation,
    sendApplicationStatusEmail,
    sendInterviewInvitation,
};
