# Alkosto Sales Advisor App · Demo v0.4

Esta versión separa la experiencia visual de los datos demo.

## Archivos incluidos

- `index.html`: estructura de la Client App.
- `styles.css`: estilos visuales.
- `app.js`: lógica de la app, lectura de JSON, filtros, recomendación, artículos, objeciones y selección de producto.
- `products.json`: catálogo demo enriquecido de televisores y computadores.
- `articles.json`: artículos demo para Knowledge/Copilot.

## Cómo publicar

Sube todos los archivos a la raíz del repositorio GitHub Pages:

```text
/
├── index.html
├── styles.css
├── app.js
├── products.json
└── articles.json
```

## Pruebas rápidas

### Sin contexto

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/
```

### Televisores

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/?category=Televisores&budget=3000000&city=Barranquilla&useCase=deportes%20y%20streaming&priority=precio%20y%20calidad&need=televisor%20de%2055%20pulgadas&origin=AVA
```

### Computadores

```text
https://TU_USUARIO.github.io/alkosto-sales-advisor-demo/?category=Computadores&budget=3000000&city=Barranquilla&useCase=trabajo%20y%20estudio&priority=precio%20y%20calidad&need=portatil%20para%20trabajo%20remoto&origin=AVA
```

## Nota

Los datos de producto, precio e inventario son demo estructurado. En producción deben reemplazarse por APIs oficiales, fuente de catálogo gobernada o ingesta controlada.
