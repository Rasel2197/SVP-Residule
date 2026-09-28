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
        // Use service: 'gmail' or host/port config for optimal Gmail delivery
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        console.log(`[SVP RESCHEDULE] Attempting to send email via Gmail to ${email} using ${smtpUser}`);

        const info = await transporter.sendMail({
          from: `"SVP Reschedule Portal" <${smtpUser}>`,
          to: email,
          subject: `[SVP Reschedule] আপনার ওটিপি ভেরিফিকেশন কোড: ${otp}`,
          text: `আপনার SVP Reschedule Portal একাউন্ট ভেরিফিকেশন কোড হলো: ${otp}। এই কোডটির মেয়াদ ১০ মিনিট। অনুগ্রহ করে এটি কারও সাথে শেয়ার করবেন না।`,
          headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
          },
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #0B3B3C;">
                <h2 style="color: #0B3B3C; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">SVP RESCHEDULE PORTAL</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Skill Verification Program (SVP তাকামুল)</p>
              </div>
              <p style="color: #1e293b; font-size: 15px; margin-bottom: 14px;">প্রিয় <strong>${fullName || 'ব্যবহারকারী'}</strong>,</p>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                SVP Reschedule পোর্টালে আপনার একাউন্ট সিকিউরিটি ভেরিফিকেশনের জন্য নিচের ৬-সংখ্যার গোপন ওটিপি (OTP) কোডটি ব্যবহার করুন:
              </p>
              <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
                <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f766e;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 10px;">
                ⏱️ এই ওটিপি কোডটির মেয়াদ <strong>১০ মিনিট</strong>। নিরাপত্তার স্বার্থে কোডটি কাউকে জানাবেন না।
              </p>
              <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin-bottom: 20px;">
                (যদি আপনি এই রিকোয়েস্ট না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।)
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} SVP Reschedule Portal. All rights reserved.
              </div>
            </div>
          `,
        });
        emailSent = true;
        console.log(`[SVP RESCHEDULE] Email successfully sent to ${email}. MessageId: ${info.messageId}`);
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

  // API route to send OTP SMS
  app.post("/api/send-sms", async (req, res) => {
    const { phone, otp, fullName } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("880") ? `+${cleanPhone}` : cleanPhone.startsWith("0") ? `+880${cleanPhone.slice(1)}` : `+880${cleanPhone}`;
    const smsMessage = `[SVP Reschedule] আপনার ওটিপি ভেরিফিকেশন কোড: ${otp}। মেয়াদ ১০ মিনিট। কোডটি গোপন রাখুন।`;

    console.log(`[RESIDULE SVP] Attempting SMS dispatch to ${formattedPhone}`);

    // Check for Greenweb SMS
    const greenwebToken = process.env.GREENWEB_TOKEN || process.env.SMS_API_KEY;
    if (greenwebToken) {
      try {
        const gwUrl = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(greenwebToken)}&to=${encodeURIComponent(formattedPhone)}&message=${encodeURIComponent(smsMessage)}`;
        const gwRes = await fetch(gwUrl);
        const gwText = await gwRes.text();
        console.log(`[RESIDULE SVP] Greenweb response:`, gwText);
        return res.json({ success: true, provider: "greenweb", message: "SMS dispatched successfully" });
      } catch (e: any) {
        console.error("[RESIDULE SVP] Greenweb error:", e);
      }
    }

    // Check for BulksmsBD
    const bulksmsKey = process.env.BULKSMS_API_KEY;
    const bulksmsSender = process.env.BULKSMS_SENDER_ID || "8809612443880";
    if (bulksmsKey) {
      try {
        const bsUrl = `http://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(bulksmsKey)}&type=text&number=${encodeURIComponent(cleanPhone)}&senderid=${encodeURIComponent(bulksmsSender)}&message=${encodeURIComponent(smsMessage)}`;
        const bsRes = await fetch(bsUrl);
        const bsData = await bsRes.json();
        console.log(`[RESIDULE SVP] BulksmsBD response:`, bsData);
        return res.json({ success: true, provider: "bulksmsbd", message: "SMS dispatched successfully" });
      } catch (e: any) {
        console.error("[RESIDULE SVP] BulksmsBD error:", e);
      }
    }

    return res.status(501).json({
      success: false,
      reason: "NO_GATEWAY",
      error: "সার্ভারে বাহ্যিক এসএমএস গেটওয়ে কনফিগার করা নেই। অনুগ্রহ করে ফায়ারবেস ফোন অথেন্টিকেশন অথবা জিমেইল ওটিপি ব্যবহার করুন।"
    });
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
