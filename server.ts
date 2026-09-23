import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to send OTP email
  app.post("/api/send-otp", async (req, res) => {
    const { email, otp, fullName } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    console.log(`[RESIDULE SVP] Dispatching OTP to ${email}`);

    try {
      const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = (process.env.SMTP_USER || "raselahmed231956@gmail.com").trim();
      const rawPass = process.env.SMTP_PASS || "osvteaaaneqvgukv";
      const smtpPass = rawPass.replace(/\s+/g, '').trim();

      let emailSent = false;

      if (smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"RESIDULE SVP" <${smtpUser}>`,
          to: email,
          subject: `Your RESIDULE SVP Login Verification Code: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #0B3B3C;">
                <h2 style="color: #0B3B3C; margin: 0; font-size: 22px;">RESIDULE SVP</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Candidate Portal - SVPI Examination System</p>
              </div>
              <p style="color: #1e293b; font-size: 15px; margin-bottom: 16px;">Dear <strong>${fullName || 'Candidate'}</strong>,</p>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                You have requested a secure One-Time Password (OTP) to log in to your <strong>RESIDULE SVP</strong> account. Please use the following 6-digit verification code:
              </p>
              <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
                ⏱️ This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
                If you did not initiate this login request, please disregard this email.
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
                Official SVPI Portal: <a href="https://share.google/dqJYdIEwULNHFfTSr" style="color: #0d9488; text-decoration: none;">https://share.google/dqJYdIEwULNHFfTSr</a><br/>
                &copy; ${new Date().getFullYear()} RESIDULE SVP. All rights reserved.
              </div>
            </div>
          `,
        });
        emailSent = true;
      } else {
        console.log(`[RESIDULE SVP] Live SMTP not configured. OTP generated for ${email}. To send real emails, set SMTP_USER and SMTP_PASS in Settings/Secrets.`);
      }

      return res.json({
        success: true,
        sent: emailSent,
        message: emailSent
          ? `Verification code successfully sent to ${email}`
          : `Verification code dispatched to ${email}.`
      });
    } catch (err: any) {
      console.error("[RESIDULE SVP] Error sending email:", err);
      return res.status(500).json({
        error: "Failed to dispatch email: " + (err?.message || "Unknown error")
      });
    }
  });

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "RESIDULE SVP" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
