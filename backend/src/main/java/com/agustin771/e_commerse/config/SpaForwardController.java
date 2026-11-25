package com.agustin771.e_commerse.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/compra/resultado",
            "/compra",
            "/carrito",
            "/login",
            "/registro",
            "/verificar-email",
            "/recuperar-password",
            "/restablecer-password",
            "/admin",
            "/productos",
            "/productos/{id}",
            "/producto/{id}"
    })
    public String forwardReact() {
        return "forward:/index.html";
    }
}