import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, formatdate
from app.config import SMTP_SERVER, SMTP_PORT, GMAIL_EMAIL, GMAIL_PASSWORD, FRONTEND_URL
import logging

logger = logging.getLogger(__name__)

def send_invitation_email(to_email: str, workspace_name: str, invited_by: str, token: str):
    subject = f"{invited_by} vous invite a rejoindre {workspace_name} sur SynkHub"

    accept_url = f"{FRONTEND_URL}/accept-invitation?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #13A538, #163E2C); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">SynkHub</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Collaboration en temps reel</p>
            </div>
            <div style="padding: 32px;">
                <h2 style="color: #2c3e50; font-size: 20px; margin: 0 0 16px;">Vous avez une invitation!</h2>
                <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
                    <strong>{invited_by}</strong> vous a invite a rejoindre le workspace:
                </p>
                <p style="font-size: 18px; color: #13A538; font-weight: bold;">{workspace_name}</p>
                <p style="color: #555; font-size: 14px; line-height: 1.8;">
                    Cliquez sur le bouton ci-dessous pour accepter l'invitation:
                </p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="{accept_url}" style="display: inline-block; background: #13A538; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 14px;">Accepter l'invitation</a>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">Si le bouton ne fonctionne pas, copiez ce lien:</p>
                <p style="background: #f9f9f9; padding: 12px; border-left: 3px solid #13A538; margin: 16px 0; font-size: 12px; word-break: break-all; color: #13A538;">{accept_url}</p>
                <p style="font-size: 12px; color: #999;">Ce lien expire dans 7 jours.</p>
            </div>
            <div style="padding: 24px 32px; background: #ecf0f1; text-align: center; border-top: 1px solid #bdc3c7;">
                <p style="color: #7f8c8d; font-size: 12px; margin: 8px 0;">Envoye par SynkHub - Si vous ne l'aviez pas demandee, ignorez ce mail.</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr(("SynkHub", GMAIL_EMAIL))
    msg["To"] = to_email
    msg["Reply-To"] = GMAIL_EMAIL
    msg["Date"] = formatdate(localtime=True)
    msg["X-Mailer"] = "SynkHub"

    text_part = MIMEText(f"Acceptez l'invitation: {accept_url}", "plain", "utf-8")
    html_part = MIMEText(html, "html", "utf-8")
    msg.attach(text_part)
    msg.attach(html_part)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(GMAIL_EMAIL, GMAIL_PASSWORD)
            rejected = server.sendmail(GMAIL_EMAIL, [to_email], msg.as_string())
            server.quit()
        logger.info(f"Email invitation envoye a {to_email}")
        print(f"[EMAIL] Sent to {to_email}, rejected: {rejected}")
        return True
    except Exception as e:
        logger.error(f"Erreur envoi email: {str(e)}")
        print(f"[EMAIL ERROR] {e}")
        return False
