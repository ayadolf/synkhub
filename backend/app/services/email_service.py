import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import GMAIL_EMAIL, GMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_invitation_email(to_email: str, workspace_name: str, invited_by: str, invitation_token: str, frontend_url: str = "http://localhost:5173"):
        """
        Envoyer un email d'invitation au workspace
        """
        try:
            # Créer le lien d'activation
            accept_link = f"{frontend_url}/accept-invitation?token={invitation_token}"
            
            # Créer le message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Invitation à rejoindre {workspace_name} - Brainstorming Pro"
            msg['From'] = GMAIL_EMAIL
            msg['To'] = to_email
            
            # Contenu en texte
            text = f"""
Bonjour,

{invited_by} vous a invité à rejoindre le workspace "{workspace_name}" sur Brainstorming Pro.

Cliquez sur le lien suivant pour accepter l'invitation:
{accept_link}

Ce lien expire dans 7 jours.

Si vous n'avez pas de compte, il sera créé automatiquement lors de votre acceptation.

---
Brainstorming Pro - Collaboration en Temps Réel
            """
            
            # Contenu en HTML
            html = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      
      <h2 style="color: #2c3e50;">🎯 Invitation Brainstorming Pro</h2>
      
      <p>Bonjour,</p>
      
      <p><strong>{invited_by}</strong> vous a invité à rejoindre le workspace:</p>
      
      <h3 style="color: #3498db;">{workspace_name}</h3>
      
      <p style="margin: 30px 0;">
        <a href="{accept_link}" 
           style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          ✓ Accepter l'invitation
        </a>
      </p>
      
      <p style="font-size: 12px; color: #7f8c8d;">
        Ce lien expire dans 7 jours.<br>
        Si le bouton ne fonctionne pas, copiez ce lien:
      </p>
      
      <p style="font-size: 12px; color: #3498db; word-break: break-all;">
        {accept_link}
      </p>
      
      <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
      
      <p style="font-size: 12px; color: #95a5a6;">
        Brainstorming Pro - Collaboration en Temps Réel<br>
        © 2026 | Tous droits réservés
      </p>
    </div>
  </body>
</html>
            """
            
            # Attacher les parties
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Envoyer via Gmail SMTP
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(GMAIL_EMAIL, GMAIL_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email invitation envoyé à {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email: {str(e)}")
            raise Exception(f"Impossible d'envoyer l'email: {str(e)}")

    @staticmethod
    def send_welcome_email(to_email: str, username: str):
        """
        Envoyer un email de bienvenue au nouvel utilisateur
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Bienvenue sur Brainstorming Pro!"
            msg['From'] = GMAIL_EMAIL
            msg['To'] = to_email
            
            text = f"""
Bienvenue {username}!

Votre compte Brainstorming Pro a été créé avec succès.

Vous pouvez maintenant accéder à: http://localhost:5173/

---
Brainstorming Pro
            """
            
            html = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #27ae60;">✓ Bienvenue {username}!</h2>
      <p>Votre compte Brainstorming Pro a été créé avec succès.</p>
      <p style="margin: 20px 0;">
        <a href="http://localhost:5173/" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
          Accéder à Brainstorming Pro
        </a>
      </p>
    </div>
  </body>
</html>
            """
            
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(GMAIL_EMAIL, GMAIL_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email de bienvenue envoyé à {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email de bienvenue: {str(e)}")
            return False
