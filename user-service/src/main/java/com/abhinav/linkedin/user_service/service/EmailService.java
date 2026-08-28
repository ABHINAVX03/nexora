package com.abhinav.linkedin.user_service.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:support@nexoranetwork.site}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String name, String otp) {
        CompletableFuture.runAsync(() -> {
            String subject = "Verify your Nexora account — " + otp;
            String htmlContent = buildEmailTemplate(
                    "Welcome to Nexora",
                    "Hi " + (name != null ? name : "there") + ",",
                    "Thank you for joining Nexora. Use the single-use verification code below to activate your account:",
                    otp,
                    "This code will expire in 10 minutes. If you did not create an account on Nexora, please disregard this email."
            );
            sendHtmlEmail(toEmail, subject, htmlContent, otp, "Email Verification");
        });
    }

    public void sendPasswordResetEmail(String toEmail, String name, String otp) {
        CompletableFuture.runAsync(() -> {
            String subject = "Nexora Password Reset Code — " + otp;
            String htmlContent = buildEmailTemplate(
                    "Password Reset Request",
                    "Hi " + (name != null ? name : "there") + ",",
                    "We received a request to reset your Nexora account password. Use the verification code below to proceed:",
                    otp,
                    "This code will expire in 10 minutes. If you did not request a password reset, please change your password immediately or contact support."
            );
            sendHtmlEmail(toEmail, subject, htmlContent, otp, "Password Recovery");
        });
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody, String plainOtp, String actionType) {
        if (mailSender == null) {
            log.info("\n==================================================" +
                     "\n[EMAIL DISPATCH - SIMULATED / CONSOLE FALLBACK]" +
                     "\nTo: " + toEmail +
                     "\nAction: " + actionType +
                     "\nSubject: " + subject +
                     "\nOTP Code: >>> " + plainOtp + " <<<" +
                     "\n==================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Nexora Network");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Sent {} email successfully to: {}", actionType, toEmail);
        } catch (Exception e) {
            log.error("Failed to deliver {} email to {}: {}. Falling back to log OTP: {}", actionType, toEmail, e.getMessage(), plainOtp);
        }
    }

    private String buildEmailTemplate(String title, String greeting, String intro, String code, String footerNotice) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%%" max-width="560px" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 32px 36px; background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nexora</h1>
                          <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">The Professional Network</p>
                        </td>
                      </tr>
                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 36px 24px 36px; color: #e2e8f0;">
                          <h2 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">%s</h2>
                          <p style="margin: 0 0 12px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">%s</p>
                          <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">%s</p>
                          
                          <!-- OTP Code Box -->
                          <div style="background-color: #0f172a; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8;">%s</span>
                          </div>
                          
                          <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">%s</p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 24px 36px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
                          © 2026 Nexora Network Inc. All rights reserved.<br>
                          Secure verification code sent automatically by Nexora Authentication.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(title, title, greeting, intro, code, footerNotice);
    }
}
