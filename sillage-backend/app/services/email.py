"""
Servicio de envío de emails para Sillage (via Resend API)
"""
import httpx
from typing import List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class EmailService:
    """Servicio para enviar emails via Resend"""

    @staticmethod
    async def send_email(
        to_email: str | List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        # MODO DESARROLLO: Si estamos en local, solo logueamos el email
        if settings.ENVIRONMENT == "local":
            logger.warning("=" * 80)
            logger.warning("MODO DESARROLLO - EMAIL NO ENVIADO")
            logger.warning(f"Para: {to_email}")
            logger.warning(f"Asunto: {subject}")
            logger.warning("-" * 80)
            if text_content:
                logger.warning(text_content)
            logger.warning("=" * 80)
            return True

        try:
            if isinstance(to_email, str):
                to_email = [to_email]

            payload = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content,
            }
            if text_content:
                payload["text"] = text_content

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    RESEND_API_URL,
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()

            logger.info(f"Email enviado exitosamente a {to_email}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email a {to_email}: {str(e)}")
            return False

    @staticmethod
    async def send_welcome_email(user_email: str, user_name: str) -> bool:
        subject = "¡Bienvenido a Sillage!"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Bienvenido a Sillage!</h1>
                </div>
                <div class="content">
                    <h2>Hola {user_name},</h2>
                    <p>Nos alegra tenerte con nosotros. Sillage es tu asistente personal para descubrir el perfume perfecto para cada ocasión.</p>

                    <h3>¿Qué puedes hacer en Sillage?</h3>
                    <ul>
                        <li>Gestionar tu colección personal de perfumes</li>
                        <li>Obtener recomendaciones personalizadas basadas en clima, ocasión, vestimenta, actitud y lugar</li>
                        <li>Consultar tu historial de recomendaciones</li>
                        <li>Disponible en múltiples idiomas</li>
                    </ul>

                    <p>Empieza agregando tus perfumes favoritos a tu colección y obtén tu primera recomendación.</p>

                    <div class="footer">
                        <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; 2026 Sillage. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        ¡Bienvenido a Sillage!

        Hola {user_name},

        Nos alegra tenerte con nosotros. Sillage es tu asistente personal para descubrir el perfume perfecto para cada ocasión.

        ¿Qué puedes hacer en Sillage?
        - Gestionar tu colección personal de perfumes
        - Obtener recomendaciones personalizadas basadas en clima, ocasión, vestimenta, actitud y lugar
        - Consultar tu historial de recomendaciones
        - Disponible en múltiples idiomas

        Empieza agregando tus perfumes favoritos a tu colección y obtén tu primera recomendación.

        Saludos,
        El equipo de Sillage
        """

        return await EmailService.send_email(user_email, subject, html_content, text_content)

    @staticmethod
    async def send_password_reset_email(user_email: str, user_name: str, reset_url: str) -> bool:
        subject = "Recuperación de contraseña - Sillage"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .reset-button {{ display: inline-block; padding: 14px 32px; background: #D4AF37; color: white !important; text-decoration: none; border-radius: 8px; margin: 24px 0; font-size: 16px; font-weight: bold; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                .url-fallback {{ word-break: break-all; font-size: 12px; color: #D4AF37; margin-top: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                    <h2>Hola {user_name},</h2>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Sillage.</p>

                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="reset-button">Restablecer Contraseña</a>
                    </div>

                    <p class="url-fallback">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{reset_url}</p>

                    <div class="warning">
                        <strong>Importante:</strong>
                        <ul>
                            <li>Este enlace expira en 1 hora</li>
                            <li>Solo puede usarse una vez</li>
                            <li>Si no solicitaste este cambio, ignora este mensaje</li>
                        </ul>
                    </div>

                    <div class="footer">
                        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje de forma segura.</p>
                        <p>&copy; 2026 Sillage. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Recuperación de Contraseña - Sillage

        Hola {user_name},

        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Sillage.

        Haz clic en el siguiente enlace para crear una nueva contraseña:
        {reset_url}

        IMPORTANTE:
        - Este enlace expira en 1 hora
        - Solo puede usarse una vez
        - Si no solicitaste este cambio, ignora este mensaje

        Saludos,
        El equipo de Sillage
        """

        return await EmailService.send_email(user_email, subject, html_content, text_content)

    @staticmethod
    async def send_password_changed_email(user_email: str, user_name: str) -> bool:
        subject = "Tu contraseña ha sido cambiada - Sillage"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success-box {{ background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contraseña Actualizada</h1>
                </div>
                <div class="content">
                    <h2>Hola {user_name},</h2>

                    <div class="success-box">
                        <strong>Tu contraseña ha sido cambiada exitosamente.</strong>
                    </div>

                    <p>Este es un correo de confirmación para informarte que la contraseña de tu cuenta de Sillage ha sido actualizada.</p>

                    <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>

                    <div class="warning">
                        <strong>¿No realizaste este cambio?</strong>
                        <p>Si no cambiaste tu contraseña, tu cuenta podría estar comprometida. Por favor, contacta con nuestro soporte inmediatamente en {settings.RESEND_FROM_EMAIL}</p>
                    </div>

                    <div class="footer">
                        <p>Este es un email de seguridad automático.</p>
                        <p>&copy; 2026 Sillage. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Contraseña Actualizada - Sillage

        Hola {user_name},

        Tu contraseña ha sido cambiada exitosamente.

        Este es un correo de confirmación para informarte que la contraseña de tu cuenta de Sillage ha sido actualizada.

        Ya puedes iniciar sesión con tu nueva contraseña.

        ¿No realizaste este cambio?
        Si no cambiaste tu contraseña, tu cuenta podría estar comprometida.
        Por favor, contacta con nuestro soporte inmediatamente en {settings.RESEND_FROM_EMAIL}

        Saludos,
        El equipo de Sillage
        """

        return await EmailService.send_email(user_email, subject, html_content, text_content)


# Instancia global del servicio
email_service = EmailService()
