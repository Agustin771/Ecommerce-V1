package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class MercadoPagoService {

    private static final Logger log =
            LoggerFactory.getLogger(MercadoPagoService.class);

    private final RestClient restClient;
    private final String accessToken;
    private final String frontendUrl;

    public MercadoPagoService(
            @Value("${app.mercadopago.access-token}") String accessToken,
            @Value("${app.frontend.url}") String frontendUrl
    ) {
        this.accessToken = accessToken;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");

        this.restClient = RestClient.builder()
                .baseUrl("https://api.mercadopago.com")
                .build();
    }

    public MercadoPagoOrder createOrder(
            String idempotencyKey,
            String externalReference,
            String buyerEmail,
            BigDecimal total,
            List<MercadoPagoItem> items
    ) {
        List<Map<String, Object>> mpItems = items.stream()
                .map(item -> Map.<String, Object>of(
                        "title", item.title(),
                        "quantity", item.quantity(),
                        "unit_price", item.unitPrice().toPlainString()
                ))
                .toList();

        String encodedOrderNumber = URLEncoder.encode(
                externalReference, StandardCharsets.UTF_8
        );

        Map<String, Object> onlineConfig = Map.of(
                "success_url", frontendUrl
                        + "/compra/resultado?orderNumber="
                        + encodedOrderNumber + "&resultado=exito",
                "failure_url", frontendUrl
                        + "/compra/resultado?orderNumber="
                        + encodedOrderNumber + "&resultado=error",
                "pending_url", frontendUrl
                        + "/compra/resultado?orderNumber="
                        + encodedOrderNumber + "&resultado=pendiente",
                "auto_return", "approved"
        );

        Map<String, Object> body = Map.of(
                "type", "online",
                "processing_mode", "manual",
                "total_amount", total.toPlainString(),
                "external_reference", externalReference,
                "expiration_time", "PT30M",
                "payer", Map.of("email", buyerEmail),
                "items", mpItems,
                "config", Map.of("online", onlineConfig)
        );

        try {
            log.info("Creando order en Mercado Pago | reference={} | total={}",
                    externalReference, total);

            Map<String, Object> response = restClient.post()
                    .uri("/v1/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Idempotency-Key", idempotencyKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null
                    || response.get("id") == null
                    || response.get("checkout_url") == null) {
                log.error("Respuesta incompleta de Mercado Pago: {}", response);
                throw new BusinessException(
                        "Mercado Pago no devolvió los datos necesarios para iniciar el pago."
                );
            }

            return new MercadoPagoOrder(
                    response.get("id").toString(),
                    response.get("checkout_url").toString()
            );

        } catch (RestClientException exception) {
            log.error("Error al crear order en Mercado Pago: {}",
                    exception.getMessage(), exception);
            throw new BusinessException(
                    "No pudimos iniciar el pago con Mercado Pago. Intentá nuevamente."
            );
        }
    }

    public Map<String, Object> getOrder(String mercadoPagoOrderId) {
        try {
            Map<String, Object> response = restClient.get()
                    .uri("/v1/orders/{id}", mercadoPagoOrderId)
                    .header("Authorization", "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new BusinessException(
                        "Mercado Pago devolvió una respuesta vacía al consultar la orden."
                );
            }

            return response;
        } catch (RestClientException exception) {
            log.error("No se pudo consultar la order {} en Mercado Pago: {}",
                    mercadoPagoOrderId, exception.getMessage(), exception);
            throw new BusinessException(
                    "No pudimos verificar el estado del pago en Mercado Pago."
            );
        }
    }

    public Map<String, Object> cancelOrder(
            String mercadoPagoOrderId,
            String idempotencyKey
    ) {
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/orders/{id}/cancel", mercadoPagoOrderId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Idempotency-Key", idempotencyKey)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new BusinessException(
                        "Mercado Pago no devolvió información de la cancelación."
                );
            }

            return response;

        } catch (org.springframework.web.client.RestClientResponseException exception) {

            if (exception.getStatusCode().value() == 409) {
                log.warn(
                        "Mercado Pago no permitió cancelar la order {}. Se verificará su estado actual.",
                        mercadoPagoOrderId
                );

                return getOrder(mercadoPagoOrderId);
            }

            log.error(
                    "Error cancelando la order {} en Mercado Pago: {}",
                    mercadoPagoOrderId,
                    exception.getResponseBodyAsString()
            );

            throw new BusinessException(
                    "No pudimos cancelar la operación en Mercado Pago."
            );

        } catch (RestClientException exception) {
            log.error(
                    "Error de comunicación cancelando la order {}",
                    mercadoPagoOrderId,
                    exception
            );

            throw new BusinessException(
                    "No pudimos comunicarnos con Mercado Pago para cancelar la operación."
            );
        }
    }

    public record MercadoPagoItem(
            String title,
            int quantity,
            BigDecimal unitPrice
    ) {}

    public record MercadoPagoOrder(
            String id,
            String checkoutUrl
    ) {}
}
