# 📦 Guía de Gestión de Productos - IWatchworks

## 🎯 Resumen Rápido

Esta guía explica cómo gestionar el catálogo de productos de IWatchworks: actualizar precios, imágenes, textos y stock, así como añadir nuevos modelos.

---

## 📍 Ubicación de Datos

### Base de Datos (Turso)
Los productos se almacenan en la tabla `products` con la siguiente estructura:

```sql
products (
  id: integer PRIMARY KEY
  slug: text UNIQUE
  name: text
  brand: text
  series: text
  reference: text
  description: text
  price: real
  stock: integer
  images: text (JSON array)
  category: text
  isNew: integer (0 o 1)
  isExclusive: integer (0 o 1)
  createdAt: text
)
```

---

## 🖼️ Gestión de Imágenes

### 1. Ubicación de Archivos
```
/public/images/products/
```

### 2. Nomenclatura
Nombra las imágenes usando la **referencia del producto**:
```
SSK001K1.webp
SPB149J1.webp
SSC911P1.webp
```

### 3. Formatos Recomendados
- **WebP** (preferido) - Mejor compresión y calidad
- **AVIF** (alternativa) - Aún mejor compresión
- **JPG/PNG** - Compatibilidad universal

### 4. Especificaciones
- **Resolución mínima:** 800×800 px
- **Resolución óptima:** 1200×1200 px
- **Ratio:** 1:1 (cuadrado)
- **Peso máximo:** 500 KB por imagen
- **Calidad:** 85-90%

### 5. Añadir Imágenes a la BD

**Opción A: Una sola imagen**
```json
["/images/products/SSK001K1.webp"]
```

**Opción B: Múltiples imágenes (galería)**
```json
[
  "/images/products/SSK001K1.webp",
  "/images/products/SSK001K1-2.webp",
  "/images/products/SSK001K1-3.webp"
]
```

### 6. Placeholder Automático
Si un producto NO tiene imagen configurada, se mostrará automáticamente:
```
/images/products/placeholder-watch.webp
```

---

## 💰 Actualizar Precios, Stock y Textos

### Método 1: API de Administración (Recomendado)

**Endpoint:** `PATCH /api/products/[id]`

**Headers:**
```http
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "price": 425.00,
  "stock": 5,
  "description": "Nueva descripción del producto",
  "isNew": true
}
```

### Método 2: Acceso Directo a Base de Datos

Usa el **Database Studio** (pestaña superior derecha) para ejecutar SQL:

```sql
-- Actualizar precio y stock
UPDATE products 
SET price = 425.00, stock = 5 
WHERE reference = 'SSK001K1';

-- Actualizar descripción
UPDATE products 
SET description = 'Negro clásico con bisel 24 h y aguja GMT: robusto, legible y listo para viajar.' 
WHERE reference = 'SSK001K1';

-- Actualizar imágenes
UPDATE products 
SET images = '["/images/products/SSK001K1.webp"]' 
WHERE reference = 'SSK001K1';

-- Marcar como nuevo/exclusivo
UPDATE products 
SET isNew = 1, isExclusive = 0 
WHERE reference = 'SSK001K1';
```

---

## ➕ Añadir Nuevos Modelos

### Paso 1: Preparar Imagen
1. Renombra la imagen con la **referencia** del reloj (ej: `SPB485J1.webp`)
2. Sube el archivo a: `/public/images/products/`

### Paso 2: Insertar en Base de Datos

**Opción A: Via API**

`POST /api/products/add-single`

```json
{
  "slug": "prospex-diver-gmt-spb485j1",
  "name": "Prospex Diver GMT",
  "brand": "Seiko",
  "series": "Prospex SPB",
  "reference": "SPB485J1",
  "description": "Nueva referencia con estética limpia y enfoque funcional.",
  "price": 990.00,
  "stock": 3,
  "images": ["/images/products/SPB485J1.webp"],
  "category": "Diver GMT",
  "isNew": true,
  "isExclusive": false
}
```

**Opción B: Via Database Studio (SQL)**

```sql
INSERT INTO products (
  slug, name, brand, series, reference, description, 
  price, stock, images, category, isNew, isExclusive, createdAt
) VALUES (
  'prospex-diver-gmt-spb485j1',
  'Prospex Diver GMT',
  'Seiko',
  'Prospex SPB',
  'SPB485J1',
  'Nueva referencia con estética limpia y enfoque funcional.',
  990.00,
  3,
  '["/images/products/SPB485J1.webp"]',
  'Diver GMT',
  1,
  0,
  datetime('now')
);
```

### Paso 3: Generar Slug Correcto

El slug debe ser **único** y seguir este patrón:
```
{serie}-{nombre-descriptivo}-{referencia-lowercase}

Ejemplos:
5-sports-gmt-black-ssk001k1
prospex-speedtimer-blue-ssc927p1
prospex-diver-gmt-pepsi-spb143j1
```

---

## 🏷️ Badges y Estados Especiales

### Nuevo (isNew)
```sql
UPDATE products SET isNew = 1 WHERE reference = 'SSK001K1';
```
Muestra badge dorado "Nuevo" con icono de estrella.

### Exclusivo (isExclusive)
```sql
UPDATE products SET isExclusive = 1 WHERE reference = 'SPB381J1';
```
Muestra badge negro "Exclusivo" con icono de premio.

### Stock Bajo (Automático)
- **Stock = 1:** Badge rojo "Última unidad"
- **Stock = 2:** Badge rojo "Quedan 2"
- **Stock = 0:** Badge negro "Sin stock" + botón deshabilitado

### En Stock (Automático)
- **Stock 1-5:** Badge blanco "En stock • 24-48h"
- **Stock > 5:** Badge verde "Disponible • Envío inmediato"

---

## 🔧 Actualización Masiva

### Actualizar Serie Completa

```sql
-- Actualizar todos los precios de una serie
UPDATE products 
SET price = price * 1.10 
WHERE series = 'Seiko 5 Sports GMT';

-- Actualizar stock para múltiples referencias
UPDATE products 
SET stock = 10 
WHERE reference IN ('SSK001K1', 'SSK003K1', 'SSK005K1');

-- Marcar serie como nueva
UPDATE products 
SET isNew = 1 
WHERE series = 'Prospex SSC';
```

---

## 📊 Consultas Útiles

### Ver Todos los Productos
```sql
SELECT id, reference, name, price, stock, isNew, isExclusive 
FROM products 
ORDER BY series, reference;
```

### Productos con Stock Bajo
```sql
SELECT reference, name, stock 
FROM products 
WHERE stock <= 2 AND stock > 0
ORDER BY stock ASC;
```

### Productos Sin Imagen
```sql
SELECT reference, name 
FROM products 
WHERE images IS NULL OR images = '[]';
```

### Productos por Serie
```sql
SELECT reference, name, price, stock 
FROM products 
WHERE series = 'Seiko 5 Sports GMT'
ORDER BY price ASC;
```

---

## 🎨 Ejemplos Completos

### Ejemplo 1: Añadir Seiko 5 Sports GMT SSK043K1

**1. Subir imagen:**
```
/public/images/products/SSK043K1.webp
```

**2. Ejecutar SQL:**
```sql
INSERT INTO products (
  slug, name, brand, series, reference, description, 
  price, stock, images, category, isNew, isExclusive, createdAt
) VALUES (
  '5-sports-gmt-multicolor-ssk043k1',
  '5 Sports GMT Multicolor',
  'Seiko',
  'Seiko 5 Sports GMT',
  'SSK043K1',
  'Bisel multicolor que destaca sin perder el ADN Seiko 5.',
  425.00,
  8,
  '["/images/products/SSK043K1.webp"]',
  'GMT',
  1,
  0,
  datetime('now')
);
```

### Ejemplo 2: Actualizar Precio y Añadir Segunda Imagen

```sql
-- Actualizar precio
UPDATE products 
SET price = 450.00 
WHERE reference = 'SSK043K1';

-- Añadir segunda imagen
UPDATE products 
SET images = '["/images/products/SSK043K1.webp", "/images/products/SSK043K1-wrist.webp"]' 
WHERE reference = 'SSK043K1';
```

---

## 🚀 Acceso Rápido

### Database Studio
1. Ve a la pestaña **"Database"** (superior derecha)
2. Ejecuta consultas SQL directamente
3. Los cambios son **inmediatos**

### Archivos Importantes
```
📁 /public/images/products/          → Imágenes de productos
📁 /src/db/schema.ts                  → Schema de la base de datos
📁 /src/app/api/products/             → APIs de productos
📁 /src/components/products/          → Componentes de productos
📁 /src/app/productos/                → Páginas de catálogo
```

---

## ⚠️ Advertencias Importantes

1. **Siempre usa el mismo formato de imagen** (preferiblemente WebP)
2. **El slug debe ser único** - usa el patrón establecido
3. **Las imágenes deben estar en formato JSON array** en la BD
4. **El precio se almacena en EUR** sin símbolo
5. **Los cambios en la BD son inmediatos** - ten cuidado con UPDATE sin WHERE
6. **Haz backup antes de actualizaciones masivas**

---

## 📞 Soporte

Si necesitas ayuda con la gestión de productos:
1. Revisa los ejemplos arriba
2. Consulta el Database Studio para ver la estructura actual
3. Verifica que las imágenes estén en la ruta correcta
4. Comprueba que el formato JSON de imágenes sea válido

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0
