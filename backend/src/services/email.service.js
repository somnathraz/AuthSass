const nodemailer = require('nodemailer');
const { auditLog } = require('../utils/audit');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  /**
   * Initialize email transporter
   */
  init() {
    try {
      console.log('📧 Initializing email service with config:', {
        user: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        pass: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'
      });

      // Always use Gmail SMTP configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'somnathkhadanga810@gmail.com',
          pass: process.env.EMAIL_PASS || 'vkczxvuekbkqamih'
        }
      });

      // Verify connection
      this.transporter.verify()
        .then(() => {
          console.log('✅ Email service ready - SMTP connection verified');
        })
        .catch((error) => {
          console.error('❌ Email service error:', error);
          throw error; // Re-throw to handle in the catch block
        });

    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error; // Stop the server if email service fails to initialize
    }
  }

  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} token - Verification token
   */
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Auth SaaS',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email Address',
      html: this.getVerificationEmailTemplate(verificationUrl),
      text: `Please verify your email address by clicking this link: ${verificationUrl}`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      await auditLog('EMAIL_SENT', null, { 
        type: 'VERIFICATION', 
        email, 
        messageId: result.messageId 
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      await auditLog('EMAIL_FAILED', null, { 
        type: 'VERIFICATION', 
        email, 
        error: error.message 
      });
      
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} token - Reset token
   * @param {string} username - User's username
   */
  async sendPasswordResetEmail(email, token, username) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Auth SaaS',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Reset Your Password',
      html: this.getPasswordResetEmailTemplate(resetUrl, username),
      text: `Reset your password by clicking this link: ${resetUrl}`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      await auditLog('EMAIL_SENT', null, { 
        type: 'PASSWORD_RESET', 
        email, 
        messageId: result.messageId 
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      await auditLog('EMAIL_FAILED', null, { 
        type: 'PASSWORD_RESET', 
        email, 
        error: error.message 
      });
      
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send invitation email
   * @param {string} email - Recipient email
   * @param {string} token - Invitation token
   * @param {Object} inviteData - Invitation data (inviterName, organizationName, etc.)
   */
  async sendInvitationEmail(email, token, inviteData) {
    console.log('📧 Attempting to send invitation email:', {
      to: email,
      inviteData,
      emailConfig: {
        user: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        pass: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'
      }
    });
    
    const { inviterName, organizationName, role, isOrgInvite } = inviteData;
    
    // Use different URLs for organization vs application invitations
    const acceptUrl = isOrgInvite 
      ? `${process.env.FRONTEND_URL}/accept-org?token=${token}`
      : `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    
    const subject = isOrgInvite 
      ? `Invitation to join ${organizationName}` 
      : `Invitation to join application`;

    const mailOptions = {
      from: {
        name: 'Auth SaaS',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject,
      html: this.getInvitationEmailTemplate(acceptUrl, inviteData),
      text: `You've been invited by ${inviterName} to join ${organizationName || 'an application'} as ${role}. Accept the invitation: ${acceptUrl}`
    };

    try {
      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        acceptUrl: acceptUrl
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      
      await auditLog('EMAIL_SENT', null, { 
        type: 'INVITATION', 
        email, 
        messageId: result.messageId,
        inviteType: isOrgInvite ? 'ORGANIZATION' : 'APPLICATION'
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send invitation email:', {
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      
      await auditLog('EMAIL_FAILED', null, { 
        type: 'INVITATION', 
        email, 
        error: error.message 
      });
      
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} username - User's username
   */
  async sendWelcomeEmail(email, username) {
    const mailOptions = {
      from: {
        name: 'Auth SaaS',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to Auth SaaS!',
      html: this.getWelcomeEmailTemplate(username),
      text: `Welcome to Auth SaaS, ${username}! Thank you for joining us.`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      await auditLog('EMAIL_SENT', null, { 
        type: 'WELCOME', 
        email, 
        messageId: result.messageId 
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome emails as they're not critical
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification email
   * @param {string} email - Recipient email
   * @param {Object} notification - Notification data
   */
  async sendNotificationEmail(email, notification) {
    const { subject, message, type, metadata } = notification;
    
    const mailOptions = {
      from: {
        name: 'Auth SaaS',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `[Auth SaaS] ${subject}`,
      html: this.getNotificationEmailTemplate(subject, message, metadata),
      text: message
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      await auditLog('EMAIL_SENT', null, { 
        type: 'NOTIFICATION', 
        email, 
        messageId: result.messageId,
        notificationType: type
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get verification email template
   * @param {string} verificationUrl - Verification URL
   * @returns {string} - HTML template
   */
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <h2>Welcome to Auth SaaS!</h2>
            <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Auth SaaS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   * @param {string} resetUrl - Reset URL
   * @param {string} username - Username
   * @returns {string} - HTML template
   */
  getPasswordResetEmailTemplate(resetUrl, username) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Auth SaaS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get invitation email template
   * @param {string} acceptUrl - Accept invitation URL
   * @param {Object} inviteData - Invitation data
   * @returns {string} - HTML template
   */
  getInvitationEmailTemplate(acceptUrl, inviteData) {
    const { inviterName, organizationName, role, isOrgInvite } = inviteData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          <div class="content">
            <h2>Join ${organizationName || 'our team'}!</h2>
            <p><strong>${inviterName}</strong> has invited you to join ${isOrgInvite ? organizationName : 'an application'} as a <strong>${role}</strong>.</p>
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #28a745;">${acceptUrl}</p>
            <p>This invitation will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Auth SaaS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   * @param {string} username - Username
   * @returns {string} - HTML template
   */
  getWelcomeEmailTemplate(username) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Auth SaaS!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; }
          .footer { text-align: center; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Auth SaaS!</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>Welcome to Auth SaaS! We're excited to have you on board.</p>
            <p>You can now start managing your applications and organizations with our platform.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Auth SaaS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get notification email template
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {Object} metadata - Additional data
   * @returns {string} - HTML template
   */
  getNotificationEmailTemplate(subject, message, metadata = {}) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
          .header { background: #6c757d; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; }
          .footer { text-align: center; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            ${metadata.actionUrl ? `<a href="${metadata.actionUrl}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>&copy; 2024 Auth SaaS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService(); 