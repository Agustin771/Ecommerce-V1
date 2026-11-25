package com.agustin771.e_commerse.controller;

import com.agustin771.e_commerse.service.MercadoPagoWebhookService;
import com.agustin771.e_commerse.service.MercadoPagoWebhookSignatureService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoWebhookController {

    private static final Logger log =
            LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final MercadoPagoWebhookSignatureService signatureService;
    private final MercadoPagoWebhookService webhookService;

    @PostMapping
    public ResponseEntity<Void> receiveOrderNotification(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(name = "data.id", required = false) String queryDataId,
            @RequestParam(name = "type", required = false) String queryType,
            @RequestHeader(name = "x-signature", required = false) String xSignature,
            @RequestHeader(name = "x-request-id", required = false) String xRequestId
    ) {

        String type = queryType;
        String dataId = queryDataId;

        if (body != null) {

            if (type == null) {
                type = body.get("type") == null
                        ? null
                        : body.get("type").toString();
            }

            if (dataId == null && body.get("data") instanceof Map<?, ?> data) {
                Object id = data.get("id");
                dataId = id == null ? null : id.toString();
            }
        }

        log.info(
                "WEBHOOK RECIBIDO | type={} | dataId={} | requestId={}",
                type, dataId, xRequestId
        );

        if (!"order".equalsIgnoreCase(type)) {
            log.info(
                    "WEBHOOK IGNORADO | Evento ajeno a Orders API | type={}",
                    type
            );
            return ResponseEntity.ok().build();
        }

        if (dataId == null || dataId.isBlank()) {
            log.warn("WEBHOOK RECHAZADO | Notificación order sin data.id");
            return ResponseEntity.badRequest().build();
        }

        if (!signatureService.isValid(xSignature, xRequestId, dataId)) {
            log.warn(
                    "WEBHOOK RECHAZADO | Firma inválida | dataId={}",
                    dataId
            );
            return ResponseEntity.status(401).build();
        }

        log.info("WEBHOOK VALIDADO | dataId={}", dataId);

        webhookService.processOrderNotification(dataId);

        log.info("WEBHOOK PROCESADO | dataId={}", dataId);

        return ResponseEntity.ok().build();
    }
}
