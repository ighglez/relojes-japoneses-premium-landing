# 🚀 GUÍA COMPLETA DE DEPLOYMENT - IWatchWorks

**Última actualización:** 30 de Octubre, 2025  
**Estado:** ✅ TODO FUNCIONANDO - Base de datos configurada, APIs testeadas, Autenticación operativa

---

## 📋 TABLA DE CONTENIDOS

1. [Estado Actual del Proyecto](#estado-actual)
2. [Variables de Entorno](#variables-de-entorno)
3. [Configuración de Google OAuth](#google-oauth)
4. [Base de Datos Turso](#base-de-datos)
5. [Deployment en Vercel](#deployment-vercel)
6. [Testing y Verificación](#testing)
7. [Troubleshooting](#troubleshooting)

---

## ✅ ESTADO ACTUAL DEL PROYECTO {#estado-actual}

### **COMPLETADO:**
- ✅ Base de datos Turso configurada y operativa
- ✅ 9 tablas creadas correctamente (downloads, referrals, reviews, leads, user, session, account, verification, newsletter_subscribers)
- ✅ 5 reseñas reales seedeadas en la base de datos
- ✅ API `/api/reviews` funcionando (GET y POST)
- ✅ API `/api/auth` configurada con better-auth
- ✅ Registro de usuarios funcionando
- ✅ Login funcionando
- ✅ Páginas de autenticación actualizadas con diseño consistente
- ✅ Google OAuth configurado (requiere actualizar redirect URIs en producción)

### **FUNCIONALIDADES OPERATIVAS:**
- 🔐 Autenticación con email/password
- 🌐 Google OAuth (requiere configuración de redirect URIs)
- 💬 Sistema de reseñas con aprobación
- 📧 Captura de leads y newsletter
- 👥 Sistema de referidos
- 📥 Tracking de descargas de catálogo

---

## 🔑 VARIABLES DE ENTORNO {#variables-de-entorno}

### **YA CONFIGURADAS (no cambiar):**

```env
# Base de datos Turso
TURSO_CONNECTION_URL=libsql://databas-iwatchworks-vercel-icfg-kk8wt3tkisix88w5lzyrp4yt.aws-us-east-1.turso.io
TURSO_DATABASE_URL=libsql://databas-iwatchworks-vercel-icfg-kk8wt3tkisix88w5lzyrp4yt.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE3NDk2NzAsImlkIjoiYzJlODE1ZDEtMTJiYS00MjE3LTk0ZTUtYWJiYmQwOWQzNjUzIiwicmlkIjoiOTY2ZTQ3ZWMtNDU2NS00MjFiLWFkMjgtNjI1MGY0YmJiMGZlIn0.9kMiD9pTAKJB9-kGCJLxNY4KhALy9SIV7A2idKnAMywaQObpHD3T4EM4l5NOxYTX6vp8o4FYzCr6M8B9G7pnAA

# Better Auth
BETTER_AUTH_SECRET=1rEO+T7yOKGiwpFzuoFhtrp1Kp9cDp1MSAajKisexrs=

# Google OAuth
GOOGLE_CLIENT_ID=318461944795-70kj7ttkm1a3igue0od28opro9nfqtlg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Seed secret
SEED_SECRET=iwatchworks_seed_2025
```

### **CONFIGURAR EN VERCEL (según tu dominio):**

```env
# URLs de la aplicación
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app

# Resend (opcional, para envío de emails)
RESEND_API_KEY=tu_resend_api_key
RESEND_FROM=IWatchWorks <tu@dominio.com>
```

---

## 🔐 CONFIGURACIÓN DE GOOGLE OAUTH {#google-oauth}

### **PASO 1: Acceder a Google Cloud Console**
1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto o crea uno nuevo
3. Busca "APIs & Services" → "Credentials"

### **PASO 2: Configurar OAuth 2.0 Client ID**

**Para desarrollo local:**
```
URIs de redireccionamiento autorizados:
http://localhost:3000/api/auth/callback/google
```

**Para producción (Vercel):**
```
URIs de redireccionamiento autorizados:
https://tu-dominio.vercel.app/api/auth/callback/google
https://tu-dominio-custom.com/api/auth/callback/google  (si tienes dominio personalizado)
```

### **PASO 3: Agregar dominios autorizados**

En "Authorized JavaScript origins", agrega:
```
http://localhost:3000  (desarrollo)
https://tu-dominio.vercel.app  (producción)
https://tu-dominio-custom.com  (dominio personalizado)
```

### **IMPORTANTE:**
- ⚠️ Cada vez que cambies de dominio (ej: de Vercel a dominio custom), DEBES actualizar los redirect URIs en Google Console
- ⚠️ Los cambios en Google Console pueden tardar 5-10 minutos en aplicarse
- ⚠️ Si Google OAuth no funciona, verifica que los redirect URIs coincidan EXACTAMENTE con tu dominio

---

## 💾 BASE DE DATOS TURSO {#base-de-datos}

### **ESTADO ACTUAL:**
✅ Base de datos completamente configurada y operativa

### **TABLAS CREADAS:**

1. **downloads** - Tracking de descargas de catálogo
   - Columnas: id, ts, ref_code, ip_hash, ua_snippet

2. **referrals** - Sistema de referidos
   - Columnas: id, user_id, ref_code, total_count, created_at

3. **reviews** - Reseñas de clientes
   - Columnas: id, name, city, text, approved, created_at
   - ✅ 5 reseñas reales ya seedeadas

4. **leads** - Captura de leads
   - Columnas: id, email, name, model, message, source, ts

5. **user** - Usuarios registrados
   - Columnas: id, email, email_verified, name, image, created_at, updated_at

6. **session** - Sesiones de usuario
   - Columnas: id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id

7. **account** - Cuentas de autenticación (OAuth, etc.)
   - Columnas: id, account_id, provider_id, user_id, access_token, refresh_token, etc.

8. **verification** - Verificaciones de email
   - Columnas: id, identifier, value, expires_at, created_at, updated_at

9. **newsletter_subscribers** - Suscriptores del newsletter
   - Columnas: id, email, source, created_at

### **ACCESO A LA BASE DE DATOS:**
```bash
# Dashboard de Turso
https://turso.tech/

# Conexión desde código (ya configurado)
URL: libsql://databas-iwatchworks-vercel-icfg-kk8wt3tkisix88w5lzyrp4yt.aws-us-east-1.turso.io
```

### **NO REQUIERE MIGRACIÓN:**
Las tablas ya están creadas. No es necesario ejecutar `npm run db:push` o migraciones.

---

## 🚀 DEPLOYMENT EN VERCEL {#deployment-vercel}

### **MÉTODO 1: Deployment automático desde GitHub**

1. **Conectar repositorio a Vercel:**
   ```
   - Ve a https://vercel.com/
   - Click en "Add New" → "Project"
   - Importa tu repositorio de GitHub
   ```

2. **Configurar variables de entorno en Vercel:**
   ```
   - Ve a Project Settings → Environment Variables
   - Copia TODAS las variables de .env
   - Asegúrate de actualizar:
     * NEXTAUTH_URL=https://tu-proyecto.vercel.app
     * NEXT_PUBLIC_SITE_URL=https://tu-proyecto.vercel.app
   ```

3. **Deploy:**
   ```
   - Vercel detectará automáticamente Next.js
   - Click en "Deploy"
   - Espera a que termine el build
   ```

### **MÉTODO 2: Deployment manual**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### **DESPUÉS DEL PRIMER DEPLOY:**

1. **Obtén tu URL de Vercel** (ej: `iwatchworks.vercel.app`)

2. **Actualiza las variables de entorno en Vercel:**
   ```env
   NEXTAUTH_URL=https://iwatchworks.vercel.app
   NEXT_PUBLIC_SITE_URL=https://iwatchworks.vercel.app
   ```

3. **Actualiza Google OAuth:**
   - Ve a Google Cloud Console
   - Agrega el redirect URI: `https://iwatchworks.vercel.app/api/auth/callback/google`

4. **Redeploy** (opcional, para aplicar cambios):
   ```bash
   vercel --prod
   ```

---

## 🧪 TESTING Y VERIFICACIÓN {#testing}

### **1. VERIFICAR RESEÑAS:**

```bash
# Desde tu navegador o Postman
GET https://tu-dominio.vercel.app/api/reviews

# Respuesta esperada:
{
  "reviews": [
    {
      "id": 1,
      "name": "Mateo Gracia",
      "city": "Logroño, España",
      "text": "Todo el proceso fue impecable...",
      "approved": true,
      "createdAt": "2024-11-15T10:30:00.000Z"
    },
    // ... 4 reseñas más
  ],
  "count": 5
}
```

### **2. VERIFICAR REGISTRO:**

```bash
# Desde tu navegador
https://tu-dominio.vercel.app/registrarse

# Pasos:
1. Ingresa nombre, email, contraseña
2. Click en "Crear cuenta"
3. Deberías ver "¡Cuenta creada exitosamente!"
4. Serás redirigido a /mi-cuenta
```

### **3. VERIFICAR LOGIN:**

```bash
# Desde tu navegador
https://tu-dominio.vercel.app/iniciar-sesion

# Pasos:
1. Ingresa email y contraseña del usuario registrado
2. Click en "Iniciar sesión"
3. Deberías ver "¡Bienvenido de nuevo!"
4. Serás redirigido a /mi-cuenta
```

### **4. VERIFICAR GOOGLE OAUTH:**

```bash
# Desde tu navegador
https://tu-dominio.vercel.app/registrarse

# Pasos:
1. Click en "Continuar con Google"
2. Selecciona tu cuenta de Google
3. Deberías ser redirigido a /mi-cuenta
```

**Si Google OAuth falla:**
- Verifica que el redirect URI esté configurado en Google Console
- Verifica que `NEXTAUTH_URL` en Vercel coincida con tu dominio
- Espera 5-10 minutos después de cambiar configuración en Google

### **5. VERIFICAR RESEÑAS EN LA WEB:**

```bash
# Desde tu navegador
https://tu-dominio.vercel.app/#resenas

# Deberías ver:
- Carrusel con 5 reseñas reales
- Botón "Dejar una reseña"
- Al hacer click, se abre un modal para enviar nueva reseña
```

---

## 🔧 TROUBLESHOOTING {#troubleshooting}

### **PROBLEMA: "No se pudieron cargar las reseñas"**

**Solución:**
```bash
# Verifica que la API funcione
curl https://tu-dominio.vercel.app/api/reviews

# Si devuelve error, revisa:
1. Variables TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel
2. Que la base de datos esté accesible
```

### **PROBLEMA: "Error al crear la cuenta"**

**Posibles causas:**
1. Email ya registrado → Intenta con otro email
2. Contraseña muy corta → Usa mínimo 8 caracteres
3. Error de base de datos → Verifica variables de entorno

### **PROBLEMA: Google OAuth no funciona**

**Solución paso a paso:**
```
1. Ve a Google Cloud Console
2. Verifica que el redirect URI sea EXACTAMENTE:
   https://tu-dominio.vercel.app/api/auth/callback/google
3. Verifica que NEXTAUTH_URL en Vercel sea:
   https://tu-dominio.vercel.app
4. Espera 5-10 minutos
5. Limpia cache del navegador
6. Intenta de nuevo
```

### **PROBLEMA: Build falla en Vercel**

**Solución:**
```bash
# Revisa los logs en Vercel
# Busca errores de TypeScript o dependencias

# Verifica que package.json tenga:
"scripts": {
  "build": "next build"
}

# Verifica que todas las dependencias estén instaladas
```

### **PROBLEMA: Sesión no persiste**

**Solución:**
```env
# Verifica que estas variables estén en Vercel:
BETTER_AUTH_SECRET=1rEO+T7yOKGiwpFzuoFhtrp1Kp9cDp1MSAajKisexrs=
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

---

## ✅ CHECKLIST FINAL DE DEPLOYMENT

Antes de considerar el deployment completo, verifica:

- [ ] Todas las variables de entorno configuradas en Vercel
- [ ] `NEXTAUTH_URL` apunta a tu dominio de producción
- [ ] Google OAuth redirect URIs actualizados en Google Console
- [ ] Build de Vercel completo sin errores
- [ ] `/api/reviews` devuelve 5 reseñas
- [ ] Puedes registrar un nuevo usuario
- [ ] Puedes iniciar sesión con email/password
- [ ] Google OAuth funciona (opcional, si quieres usarlo)
- [ ] Las reseñas se muestran en la página principal
- [ ] Puedes enviar una nueva reseña

---

## 📞 CONTACTO Y SOPORTE

Si necesitas ayuda adicional:
- Revisa los logs en Vercel: https://vercel.com/dashboard
- Revisa la base de datos en Turso: https://turso.tech/
- Todos los endpoints están documentados en el código

---

## 🎉 RESUMEN EJECUTIVO

**TODO ESTÁ CONFIGURADO Y FUNCIONANDO:**
- ✅ Base de datos Turso operativa con todas las tablas
- ✅ 5 reseñas reales seedeadas
- ✅ Autenticación con email/password funcional
- ✅ Google OAuth configurado (solo falta actualizar redirect URIs)
- ✅ APIs testeadas y operativas
- ✅ UI actualizada con diseño consistente

**SOLO NECESITAS:**
1. Hacer deploy en Vercel
2. Configurar variables de entorno con tu dominio
3. Actualizar redirect URIs de Google OAuth
4. ¡Listo! 🚀

**TIEMPO ESTIMADO DE DEPLOYMENT:** 15-20 minutos

---

**Documento creado:** 30 de Octubre, 2025  
**Versión:** 1.0  
**Estado:** Producción Ready ✅
