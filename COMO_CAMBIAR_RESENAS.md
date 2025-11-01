# 📝 Cómo Cambiar las Reseñas de Prueba por Reales

## Ubicación del Archivo

Las reseñas están almacenadas en tu **base de datos Turso**, pero puedes administrarlas de 2 formas:

---

## ✅ OPCIÓN 1: Usar el Database Studio (MÁS FÁCIL)

1. En tu navegador, haz clic en la pestaña **"Database Studio"** (arriba a la derecha, al lado de "Analytics")
2. Busca la tabla llamada **`reviews`**
3. Aquí puedes:
   - ✏️ **Editar** reseñas existentes haciendo clic en cualquier fila
   - ❌ **Eliminar** reseñas que no quieras (clic en el ícono de basura)
   - ➕ **Agregar** nuevas reseñas (clic en "Add Row")

### Campos de cada reseña:
- **name**: Nombre del cliente (ej: "María López")
- **city**: Ciudad del cliente (ej: "Madrid, España")
- **text**: El texto completo de la reseña
- **approved**: Debe estar en `true` para que se muestre
- **createdAt**: Fecha de la reseña (formato: `2025-01-15T10:30:00.000Z`)

---

## ✅ OPCIÓN 2: Modificar el Código del Seeder

Si prefieres editar las reseñas directamente en el código:

### Archivo: `src/db/seeds/reviews-seed.ts`

```typescript
export const reviewsData = [
  {
    name: "Mateo Gracia",
    city: "Logroño, España",
    text: "Todo el proceso fue impecable...",
    approved: true,
    createdAt: "2024-11-15T10:30:00.000Z"
  },
  // ... más reseñas
];
```

**Después de editar:**
```bash
# En terminal (si tienes acceso):
npm run db:seed-reviews
```

O llama al endpoint de seed:
```bash
GET /api/reviews/seed?secret=iwatchworks_seed_2025
```

---

## 📋 Reseñas Actuales en la Base de Datos

Actualmente tienes **7 reseñas**:

1. **Mateo Gracia** - Logroño, España
2. **Alberto Pérez** - Valladolid, España  
3. **Oscar Soto** - Valencia, España
4. **Carlos González** - Cádiz, España
5. **Pablo Velasco** - León, España
6. **Test User** - Madrid (⚠️ ELIMINAR ESTA)
7. **Cliente Test** - Barcelona (⚠️ ELIMINAR ESTA)

---

## 🎯 Recomendación

**USA EL DATABASE STUDIO** - Es la forma más simple:

1. Ve a la pestaña "Database Studio"
2. Abre la tabla `reviews`
3. Elimina las 2 reseñas de prueba (#6 y #7)
4. Edita las 5 reseñas reales si necesitas cambiar algún texto
5. Agrega nuevas reseñas reales de clientes

**Las reseñas NO tienen imágenes** - solo se muestra un círculo con la inicial del nombre del cliente.

---

## ✨ Resultado Final

Las reseñas aparecerán automáticamente en:
- 🏠 **Página principal** (sección "Lo que dicen nuestros clientes")
- 🔄 **Carrusel** con navegación y puntos indicadores
- ⭐ **5 estrellas** doradas en cada reseña
- ✅ **Badge "Verificada"** en cada reseña

**No necesitas reiniciar nada** - los cambios aparecen inmediatamente al recargar la página.
