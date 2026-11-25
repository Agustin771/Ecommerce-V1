package com.agustin771.e_commerse.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class MercadoPagoWebhookSignatureService {

    private final String secret;

    public MercadoPagoWebhookSignatureService(
            @Value("${app.mercadopago.webhook-secret:}") String secret
    ) {
        this.secret = secret;
    }

    public boolean isValid(
            String xSignature,
            String xRequestId,
            String dataId
    ) {
        if (secret == null || secret.isBlank()
                || xSignature == null || xRequestId == null
                || dataId == null || dataId.isBlank()) {
            return false;
        }

        Map<String, String> signatureParts = new HashMap<>();

        for (String part : xSignature.split(",")) {
            String[] pair = part.trim().split("=", 2);

            if (pair.length == 2) {
                signatureParts.put(
                        pair[0].trim(),
                        pair[1].trim()
                );
            }
        }

        String timestamp = signatureParts.get("ts");
        String receivedHash = signatureParts.get("v1");

        if (timestamp == null || receivedHash == null) {
            return false;
        }

        String normalizedDataId = dataId.toLowerCase(Locale.ROOT);

        String manifest = "id:" + normalizedDataId
                + ";request-id:" + xRequestId
                + ";ts:" + timestamp + ";";

        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));

            byte[] digest = mac.doFinal(
                    manifest.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder calculatedHash = new StringBuilder();

            for (byte value : digest) {
                calculatedHash.append(
                        String.format("%02x", value & 0xff)
                );
            }

            return MessageDigest.isEqual(
                    calculatedHash.toString().getBytes(StandardCharsets.UTF_8),
                    receivedHash.toLowerCase(Locale.ROOT)
                            .getBytes(StandardCharsets.UTF_8)
            );

        } catch (Exception exception) {
            return false;
        }
    }
}
