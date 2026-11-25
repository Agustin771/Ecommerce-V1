<p align="center">
  <img src="https://github.com/user-attachments/assets/5a6c01b2-066f-4195-a95c-db58be5bbfba" width="800" alt="Captura 1" />
  <br><br>
  <img width="1021" height="619" alt="image" src="https://github.com/user-attachments/assets/62e1c683-8d5c-44b2-9e8f-f674a9621bec" />
  <br><br>
  <img width="979" height="616" alt="image" src="https://github.com/user-attachments/assets/0b16a835-7540-46d0-b254-9c132be0c32d" />
  <br><br>
  <img src="https://github.com/user-attachments/assets/6df500a7-418c-448c-b708-3ea7a69a8f16" width="800" alt="Captura 4" />
  <br><br>
  <img src="https://github.com/user-attachments/assets/a4d3d604-8f7f-4aef-a883-ff6db9729f36" width="424" alt="Captura 7" />
  <br><br>
  <img src="https://github.com/user-attachments/assets/9fff6855-7915-46a0-86d4-82e93fd72fe4" width="800" alt="Captura 5" />
  <br><br>
  <img src="https://github.com/user-attachments/assets/e71f32e5-e8d1-4373-8d04-0f962c2a6365" width="800" alt="Captura 6" />
  <br><br>
  <img src="https://github.com/user-attachments/assets/6563f499-f047-415c-bea9-3354359ebaa0" width="800" alt="Captura 2" />
</p>

# Ecommerce Full Stack

Ecommerce full stack con React y Spring Boot: catálogo, carrito, checkout con Mercado Pago, control de stock y autenticación con JWT.

El repo incluye frontend, backend y pruebas automatizadas de ambos.

## Estructura

```text
backend/     API REST (Spring Boot) + frontend compilado en static/
frontend/    SPA React + Vite y tests del front

## Tecnologías

- **Frontend:** React, Vite, JavaScript, React Router, Axios y Vitest.
- **Backend:** Java, Spring Boot, Spring Security, Spring Data JPA y Maven.
- **Base de datos:** MySQL.
- **Pagos:** integración con Mercado Pago.
- **Pruebas backend:** JUnit, Mockito y H2.
- **Pruebas frontend:** Vitest y React Testing Library.

## Configuración

1. Crear la base de datos MySQL.
2. Configurar las variables de entorno indicadas en `.env.example` en el entorno desde el que se ejecutará Spring Boot.
3. Instalar dependencias del frontend desde `frontend/` con `npm install`.
4. Ejecutar el frontend en desarrollo con `npm run dev`.
5. Ejecutar el backend desde `backend/` con `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`).

El backend sirve la versión compilada del frontend desde `backend/src/main/resources/static/`

Para actualizar esos archivos luego de modificar React:

Ejecutar `npm run build` en `frontend/` y copiar el contenido generado en `frontend/dist/`a `backend/src/main/resources/static/`.
```
## Pruebas

Frontend:

```bash
cd frontend
npm install
npm test
npm run build (y acá creamos la carpeta dist que copiamos su contenido)
```

Backend:

```bash
cd backend
./mvnw clean test
```

En Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd clean test
```

## ESTADO

Primera versión del ecommerce. La idea central es que un usuario con el rol permitido pueda crear productos y categorías desde la misma web, filtrar el catálogo por categoría y comprar con cuenta verificada: sin verificación no se completa el registro ni se puede comprar.Integré webhooks de Mercado Pago y email (confirmación de compra, aviso de pago fallido para reintentar, y código de verificación al registrarse). El stock está pensado para no overselling: se reserva al iniciar el checkout, se libera si la compra se cancela o falla, y hay un margen de reconciliación (~35 min) por si un webhook llega tarde. Si abandonás el carrito y volvés, en el carrito podés retomar el pago o cancelar la reserva para devolver el stock.En seguridad uso Spring Security con JWT y refresh token, más control CSRF enviando el token en el header.La idea es seguir mejorándolo: historial de compras, costo de envío, integración con Google Sheets, etc.


Proyecto by Agustín Aníbal Pérez



