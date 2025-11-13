"""
Servicio de envío de emails para Sillage
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Servicio para enviar emails"""

    @staticmethod
    def send_email(
        to_email: str | List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Enviar email usando SMTP

        Args:
            to_email: Email(s) destinatario(s)
            subject: Asunto del email
            html_content: Contenido HTML del email
            text_content: Contenido en texto plano (opcional)

        Returns:
            bool: True si se envió exitosamente
        """
        # MODO DESARROLLO: Si estamos en local, solo logueamos el email
        if settings.ENVIRONMENT == "local":
            logger.warning("=" * 80)
            logger.warning("📧 MODO DESARROLLO - EMAIL NO ENVIADO")
            logger.warning(f"Para: {to_email}")
            logger.warning(f"Asunto: {subject}")
            logger.warning("-" * 80)
            if text_content:
                logger.warning(text_content)
            logger.warning("=" * 80)
            return True

        try:
            # Crear mensaje
            msg = MIMEMultipart('alternative')
            msg['From'] = settings.DEFAULT_FROM_EMAIL
            msg['Subject'] = subject

            # Convertir to_email a lista si es string
            if isinstance(to_email, str):
                to_email = [to_email]

            msg['To'] = ', '.join(to_email)

            # Agregar contenido de texto plano
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)

            # Agregar contenido HTML
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)

            # Conectar al servidor SMTP
            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                if settings.EMAIL_USE_TLS:
                    server.starttls()

                server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                server.send_message(msg)

            logger.info(f"Email enviado exitosamente a {to_email}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email a {to_email}: {str(e)}")
            # En desarrollo, retornar True para no bloquear el flujo
            if settings.ENVIRONMENT == "local":
                logger.warning("⚠️ Error de email ignorado en modo desarrollo")
                return True
            return False

    @staticmethod
    def send_welcome_email(user_email: str, user_name: str) -> bool:
        """
        Enviar email de bienvenida a nuevo usuario

        Args:
            user_email: Email del usuario
            user_name: Nombre del usuario

        Returns:
            bool: True si se envió exitosamente
        """
        subject = "¡Bienvenido a Sillage! 🌸"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
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
                        <li>🌸 Gestionar tu colección personal de perfumes</li>
                        <li>🤖 Obtener recomendaciones personalizadas con IA</li>
                        <li>📍 Recomendaciones basadas en clima y ubicación</li>
                        <li>📊 Consultar tu historial de recomendaciones</li>
                        <li>🌍 Disponible en múltiples idiomas</li>
                    </ul>

                    <p>Empieza agregando tus perfumes favoritos a tu colección y obtén tu primera recomendación.</p>

                    <div class="footer">
                        <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; 2025 Sillage. Todos los derechos reservados.</p>
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
        - Obtener recomendaciones personalizadas con IA
        - Recomendaciones basadas en clima y ubicación
        - Consultar tu historial de recomendaciones
        - Disponible en múltiples idiomas

        Empieza agregando tus perfumes favoritos a tu colección y obtén tu primera recomendación.

        Saludos,
        El equipo de Sillage
        """

        return EmailService.send_email(user_email, subject, html_content, text_content)

    @staticmethod
    def send_password_reset_email(user_email: str, user_name: str, reset_token: str) -> bool:
        """
        Enviar email de recuperación de contraseña

        Args:
            user_email: Email del usuario
            user_name: Nombre del usuario
            reset_token: Token de recuperación

        Returns:
            bool: True si se envió exitosamente
        """
        subject = "Recuperación de contraseña - Sillage 🔒"

        # En producción, esto debería ser tu dominio real
        # Por ahora usamos un placeholder
        reset_link = f"sillage://reset-password?token={reset_token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .token-box {{ background: #fff; border: 2px dashed #667eea; padding: 15px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 18px; letter-spacing: 2px; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                    <h2>Hola {user_name},</h2>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Sillage.</p>

                    <p>Tu código de recuperación es:</p>
                    <div class="token-box">
                        {reset_token}
                    </div>

                    <p>Ingresa este código en la aplicación para crear una nueva contraseña.</p>

                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Este código expira en 1 hora</li>
                            <li>Solo puede usarse una vez</li>
                            <li>Si no solicitaste este cambio, ignora este mensaje</li>
                        </ul>
                    </div>

                    <div class="footer">
                        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje de forma segura.</p>
                        <p>&copy; 2025 Sillage. Todos los derechos reservados.</p>
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

        Tu código de recuperación es: {reset_token}

        Ingresa este código en la aplicación para crear una nueva contraseña.

        IMPORTANTE:
        - Este código expira en 1 hora
        - Solo puede usarse una vez
        - Si no solicitaste este cambio, ignora este mensaje

        Saludos,
        El equipo de Sillage
        """

        return EmailService.send_email(user_email, subject, html_content, text_content)

    @staticmethod
    def send_password_changed_email(user_email: str, user_name: str) -> bool:
        """
        Enviar email de confirmación de cambio de contraseña

        Args:
            user_email: Email del usuario
            user_name: Nombre del usuario

        Returns:
            bool: True si se envió exitosamente
        """
        subject = "Tu contraseña ha sido cambiada - Sillage ✅"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success-box {{ background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Contraseña Actualizada</h1>
                </div>
                <div class="content">
                    <h2>Hola {user_name},</h2>

                    <div class="success-box">
                        <strong>✅ Tu contraseña ha sido cambiada exitosamente.</strong>
                    </div>

                    <p>Este es un correo de confirmación para informarte que la contraseña de tu cuenta de Sillage ha sido actualizada.</p>

                    <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>

                    <div class="warning">
                        <strong>⚠️ ¿No realizaste este cambio?</strong>
                        <p>Si no cambiaste tu contraseña, tu cuenta podría estar comprometida. Por favor, contacta con nuestro soporte inmediatamente en {settings.DEFAULT_FROM_EMAIL}</p>
                    </div>

                    <div class="footer">
                        <p>Este es un email de seguridad automático.</p>
                        <p>&copy; 2025 Sillage. Todos los derechos reservados.</p>
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
        Por favor, contacta con nuestro soporte inmediatamente en {settings.DEFAULT_FROM_EMAIL}

        Saludos,
        El equipo de Sillage
        """

        return EmailService.send_email(user_email, subject, html_content, text_content)


# Instancia global del servicio
email_service = EmailService()
