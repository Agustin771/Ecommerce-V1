package com.agustin771.e_commerse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ECommerseApplication {

	public static void main(String[] args) {
		SpringApplication.run(ECommerseApplication.class, args);
	}

}
