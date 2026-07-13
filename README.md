# Alkosto Sales Advisor App — Demo v0.6C

Esta versión ajusta la experiencia inicial y corrige detalles de interacción observados en Genesys.

## Cambios v0.6C

- La sección **Guía para el asesor** inicia en estado vacío/minimalista.
- La sección **Artículo sugerido por Copilot** ya no se muestra automáticamente al cargar ni al buscar productos; solo aparece por acción explícita, artículo relacionado o evento AWS `knowledge_article_suggested`.
- El botón **Ver comparativo** ahora hace scroll a la tabla de comparativo. Si no hay productos, solicita ejecutar una búsqueda primero.
- Mejora la inferencia desde la URL: `screenSize`, `screen_size`, `size`, `advisorSummary`, `advisor_summary`, `transferSummary`, `useCase`, `priority`, `need`.
- Mejora inferencia de uso: deportes/fútbol/Netflix/streaming, trabajo/estudio/gaming/diseño.
- Mantiene soporte para `conversationId` y `stateApiUrl` para escuchar AWS.

## Prueba sugerida

```text
?conversationId=demo-123&stateApiUrl=https%3A%2F%2F6e1ujgfef6.execute-api.us-east-2.amazonaws.com%2Fconversation-state&category=Televisores&budget=2500000&city=Barranquilla&need=televisor%20de%2055%20pulgadas&useCase=deportes%20y%20streaming&origin=AVA
```

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `products.json`
- `articles.json`
- `assets/`


## v0.6C

- Oculta botones de simulación por defecto; se muestran solo con `debug=true` en la URL.
- Agrega auto-scroll y resaltado visual cuando llegan eventos reales de Agent Copilot desde AWS.
- Mantiene el estado inicial más limpio para demo ejecutivo.
