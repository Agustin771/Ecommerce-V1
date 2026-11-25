package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.model.Order;
import com.agustin771.e_commerse.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final JavaMailSender mailSender;
    private final String frontendUrl;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.frontend.url}") String frontendUrl
    ) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public void sendVerificationEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Verificá tu cuenta");
        message.setText(
                "¡Hola!\n\n" +
                "Tu código de verificación es: " + code + "\n\n" +
                "Este código vence en 15 minutos.\n\n" +
                "¡Gracias por registrarte!"
        );
        mailSender.send(message);
    }

    public void sendResetPasswordEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Recuperación de contraseña");
        message.setText(
                "¡Hola!\n\n" +
                "Recibimos una solicitud para restablecer tu contraseña.\n\n" +
                "Tu código de recuperación es: " + token + "\n\n" +
                "Este código vence en 15 minutos.\n\n" +
                "Si no solicitaste este cambio, podés ignorar este correo."
        );
        mailSender.send(message);
    }

    public void sendPurchaseConfirmation(Order order) {
        StringBuilder text = new StringBuilder();

        text.append("¡Hola ")
                .append(order.getUser().getName())
                .append("!\n\n")
                .append("¡Tu pago fue acreditado correctamente! ")
                .append("Ya recibimos tu compra.\n\n")
                .append("RESUMEN DE TU COMPRA\n")
                .append("Orden: ").append(order.getOrderNumber()).append("\n")
                .append("Fecha: ")
                .append(order.getCreatedAt().format(DATE_FORMATTER))
                .append("\n\n");

        for (OrderItem item : order.getItems()) {
            text.append("• ")
                    .append(item.getProductName())
                    .append(" (").append(item.getSku()).append(")")
                    .append(" x ").append(item.getQuantity())
                    .append(" - $").append(item.getSubtotal())
                    .append("\n");
        }

        text.append("\nTOTAL: $").append(order.getTotal())
                .append("\n\n")
                .append("Estado: PAGADO\n\n")
                .append("¡Muchas gracias por comprar en nuestra tienda!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getUser().getEmail());
        message.setSubject("¡Tu compra fue confirmada! - Ecommerce");
        message.setText(text.toString());

        mailSender.send(message);
        log.info("Email de confirmación enviado para la orden {}",
                order.getOrderNumber());
    }

    public void sendPaymentNotCompleted(Order order, String paymentStatus) {
        StringBuilder text = new StringBuilder();

        text.append("¡Hola ")
                .append(order.getUser().getName())
                .append("!\n\n")
                .append("No pudimos completar el pago de tu compra.\n\n")
                .append("RESUMEN DEL INTENTO\n")
                .append("Orden: ").append(order.getOrderNumber()).append("\n")
                .append("Fecha: ")
                .append(order.getCreatedAt().format(DATE_FORMATTER))
                .append("\n\n");

        for (OrderItem item : order.getItems()) {
            text.append("• ")
                    .append(item.getProductName())
                    .append(" (").append(item.getSku()).append(")")
                    .append(" x ").append(item.getQuantity())
                    .append(" - $").append(item.getSubtotal())
                    .append("\n");
        }

        text.append("\nTOTAL: $").append(order.getTotal())
                .append("\nEstado del intento: ").append(paymentStatus)
                .append("\n\n")
                .append("La reserva fue liberada y recuperamos los productos en tu carrito. ")
                .append("Ingresá a nuestra tienda para revisar tu carrito e intentar pagar otra vez:\n")
                .append(frontendUrl).append("/carrito\n\n")
                .append("Si ya realizaste un pago, contactanos antes de volver a intentarlo.");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getUser().getEmail());
        message.setSubject("No pudimos completar tu pago - Ecommerce");
        message.setText(text.toString());

        mailSender.send(message);
        log.info("Email de pago no completado enviado para la orden {}",
                order.getOrderNumber());
    }
}
