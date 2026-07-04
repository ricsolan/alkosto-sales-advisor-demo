# Alkosto Sales Advisor App · Demo v0.5

Versión embebible para Genesys Cloud Agent Workspace.

## Cambios v0.5

- Mantiene lectura externa de `products.json` y `articles.json`.
- Sugiere automáticamente un artículo de conocimiento cuando llega contexto por URL/AVA/Copilot.
- Mejora el ranking de productos con señales de presupuesto, tamaño, ciudad, uso, marca y prioridad.
- Agrega chips de coincidencia en cada producto: dentro del presupuesto, tamaño exacto, disponible en ciudad, uso compatible, etc.
- Mejora el panel de `Siguiente mejor acción` según etapa: perfilamiento, producto seleccionado u objeción.
- Mejora el manejo de objeciones con diferencias para Televisores y Computadores.
- Agrega panel `Fuente de datos` para explicar que el demo usa catálogo y artículos estructurados.
- Deja lista la arquitectura para Demo v0.6 con n8n actualizando los JSON.

## Archivos requeridos

Subir todos estos archivos a la raíz del repositorio GitHub Pages:

```text
/index.html
/styles.css
/app.js
/products.json
/articles.json
/assets/
```

## Pruebas rápidas

TV:

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/?category=Televisores&budget=3000000&city=Barranquilla&useCase=deportes%20y%20streaming&priority=precio%20y%20calidad&need=televisor%20de%2055%20pulgadas&origin=AVA
```

Computadores:

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/?category=Computadores&budget=3000000&city=Barranquilla&useCase=trabajo%20y%20estudio&priority=precio%20y%20calidad&need=portatil%20para%20trabajo%20remoto&origin=AVA
```

## Nota

Los datos son demo estructurados, no inventario real. Para producción, reemplazar por API oficial, catálogo interno o ingesta gobernada con n8n.
