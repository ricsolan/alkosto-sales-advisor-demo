# Alkosto Sales Advisor App · Demo v0.6A.1.1

Esta versión agrega **Copilot Reactive UI**: la Client App puede escuchar un estado de conversación expuesto por AWS API Gateway + Lambda + DynamoDB y reaccionar a eventos detectados por Copilot o Data Actions.

## Archivos incluidos

- `index.html`
- `styles.css`
- `app.js`
- `products.json`
- `articles.json`
- `assets/`

## Parámetros soportados

La app mantiene los parámetros previos:

```text
category
budget
city
useCase
priority
need
origin
```

Y agrega estos parámetros nuevos:

```text
conversationId=demo-123
stateApiUrl=https://TU_API.execute-api.us-east-2.amazonaws.com/conversation-state
pollSeconds=2
```

Ejemplo:

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/?conversationId=demo-123&stateApiUrl=https%3A%2F%2FTU_API.execute-api.us-east-2.amazonaws.com%2Fconversation-state&category=Televisores&budget=3000000&city=Barranquilla&useCase=deportes%20y%20streaming&priority=precio%20y%20calidad&need=televisor%20de%2055%20pulgadas&origin=AVA
```

> Importante: `stateApiUrl` debe ir URL-encoded si lo agregas como query parameter.

## Eventos soportados desde AWS

La app procesa estos `eventType` / `lastEventType`:

```text
intent_detected
context_updated
knowledge_article_suggested
objection_detected
comparison_requested
```

## Contrato JSON para POST /conversation-state

### Contexto actualizado

```json
{
  "conversationId": "demo-123",
  "eventType": "context_updated",
  "category": "Computadores",
  "budget": 3000000,
  "city": "Barranquilla",
  "useCase": "Trabajo y estudio",
  "need": "Portátil para trabajo remoto",
  "priority": "Precio y calidad",
  "source": "Agent Copilot"
}
```

### Artículo sugerido

```json
{
  "conversationId": "demo-123",
  "eventType": "knowledge_article_suggested",
  "category": "Televisores",
  "articleId": "uhd-vs-qled",
  "articleTitle": "Diferencia entre UHD, QLED y OLED",
  "source": "Agent Copilot"
}
```

### Objeción detectada

```json
{
  "conversationId": "demo-123",
  "eventType": "objection_detected",
  "category": "Televisores",
  "objectionType": "precio",
  "customerPhrase": "Está un poco caro, lo voy a pensar",
  "source": "Agent Copilot"
}
```

### Comparativo solicitado

```json
{
  "conversationId": "demo-123",
  "eventType": "comparison_requested",
  "category": "Televisores",
  "comparisonFocus": "precio, marca y disponibilidad",
  "source": "Agent Copilot"
}
```

## Prueba rápida

1. Publica estos archivos en GitHub Pages.
2. Abre la app con `conversationId` y `stateApiUrl`.
3. Presiona **Consultar estado ahora** para validar GET.
4. Presiona **Enviar evento demo a AWS** para validar POST desde la app.
5. La app debe mostrar el evento en el panel **Eventos de Copilot** y actualizar artículo, objeción, contexto o comparativo.

## Nota de seguridad

Para demo se permite CORS abierto (`*`) en API Gateway. Para producción se debe restringir al dominio real de la Client App y agregar autenticación/validación de origen.


## Cambios v0.6A.1

- El botón **Consultar estado ahora** ahora muestra explícitamente cuando el estado consultado en AWS no cambió.
- Cuando llega un evento `context_updated` o `intent_detected` desde AWS/Copilot, la app limpia productos anteriores, actualiza contexto y ejecuta una nueva búsqueda automáticamente.
- Si Copilot cambia la categoría, por ejemplo de Televisores a Computadores, se evitan mezclas visuales de contexto nuevo con resultados anteriores.
