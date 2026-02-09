export function generateOtpEmailHtml(otp, name) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 40px 30px;
      color: #1f2937;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111827;
    }
    .message {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .otp-container {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      border: 2px dashed #9ca3af;
    }
    .otp-label {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .otp-code {
      font-size: 42px;
      font-weight: 700;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0 20px 0;
      text-shadow: 2px 2px 4px rgba(102, 126, 234, 0.1);
      user-select: all;
      -webkit-user-select: all;
    }
    .copy-btn {
        background-color: #667eea;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        text-decoration: none;
        display: inline-block;
    }
    .copy-btn:hover {
        background-color: #5a67d8;
    }
    .copy-btn:active {
        background-color: #4c51bf;
    }
    .expiry-notice {
      font-size: 13px;
      color: #ef4444;
      margin-top: 15px;
      font-weight: 500;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    .warning p {
      font-size: 14px;
      color: #92400e;
      margin: 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .footer .brand {
      font-weight: 600;
      color: #667eea;
      font-size: 14px;
      margin-top: 12px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 25px 0;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 20px 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .otp-code {
        font-size: 36px;
        letter-spacing: 6px;
      }
    }
  </style>
  <script>
    function copyOtp() {
      const otp = "${otp}";
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(otp).then(function() {
          const btn = document.getElementById('copyBtn');
          const originalText = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(function() {
            btn.innerText = originalText;
          }, 2000);
        }).catch(function(err) {
          console.error('Could not copy text: ', err);
        });
      } else {
        // Fallback for environments where clipboard API is not available
        console.warn('Clipboard API not available');
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CheckIn</h1>
      <p>By Konnexions</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name}! 👋</div>
      
      <p class="message">
        Thank you for signing up with <strong>CheckIn</strong>. 
        To complete your registration and verify your email address, please use the OTP code below:
      </p>
      
      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <!-- Added ID for potential selection -->
        <div class="otp-code" id="otpCode">${otp}</div>
        
        <!-- Copy Button -->
        <!-- Note: JavaScript buttons often don't work in email clients, but we include it for web views -->
        <button id="copyBtn" class="copy-btn" onclick="copyOtp()">
          Copy Code
        </button>

        <div class="expiry-notice">⏰ This code expires in 10 minutes</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="warning">
        <p>
          <strong>⚠️ Security Notice:</strong> If you didn't request this code, please ignore this email. 
          Never share this code with anyone.
        </p>
      </div>
      
      <p class="message">
        Once verified, you'll have full access to track your attendance.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>If you have any questions, contact your lead.</p>
      <div class="brand">Konnexions © 2026</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
