# 🚀 Guía de Despliegue en Vercel con Dominio Personalizado

## ✅ Cambios Realizados para Producción

### 1. **Error de Resend Corregido**
- Movida la inicialización de Resend dentro de las funciones de las rutas API
- Ahora solo se ejecuta en tiempo de ejecución cuando `RESEND_API_KEY` está disponible
- El build en Vercel ya no fallará por falta de API keys durante la compilación

### 2. **Sistema de Autenticación Mejorado**
- Detección automática del dominio en producción
- Soporte completo para dominios personalizados
- Sesiones extendidas a 30 días para mejor persistencia
- Cookies seguras automáticas en producción
- Sincronización de sesión entre pestañas

### 3. **Página Mi Cuenta Mejorada**
- Diseño completamente renovado y moderno
- Sistema de referidos visual con progreso animado
- Badge de miembro premium
- Mejor experiencia de compartir enlaces
- Estados de carga mejorados
- Indicadores visuales claros de progreso

---

## 📋 Configuración de Variables de Entorno en Vercel

### Paso 1: Acceder a la Configuración del Proyecto
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **iwatches**
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables de Entorno
Copia y pega las siguientes variables (usa tus valores reales de `.env`):

#### **🔐 Base de Datos (Turso)**
```
TURSO_CONNECTION_URL=libsql://db-4ba70643-0d78-45b7-8b0e-0692f8660ba6-orchids.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1NTY0NTEsImlkIjoiZGJkNDJmNjgtNDRlNC00YzU2LWJiMjQtMzczZjc4OTY2N2MxIiwicmlkIjoiNWQ1ODBlNzYtY2QxZi00NTgxLWJmOWQtOGY5YTg1YmVjOTQyIn0.fpNz9c_Lhqr2Q88VJ_u2O-BHo3qgrdA1byaW97jtNqJum8k47LAz-eaAw9iOPp7Z0Qvwyy4PAITPAb1Hr0DmBA
```

#### **🔑 Autenticación (Better Auth)**
```
BETTER_AUTH_SECRET=1rEO+T7yOKGiwpFzuoFhtrp1Kp9cDp1MSAajKisexrs=
```

#### **🌐 URLs del Sitio (IMPORTANTE)**
```
NEXT_PUBLIC_SITE_URL=https://tu-dominio-personalizado.com
NEXTAUTH_URL=https://tu-dominio-personalizado.com
```
⚠️ **REEMPLAZA** `tu-dominio-personalizado.com` con tu dominio real

#### **📧 Google OAuth**
```
GOOGLE_CLIENT_ID=318461944795-70kj7ttkm1a3igue0od28opro9nfqtlg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

#### **📨 Resend Email (Opcional)**
```
RESEND_API_KEY=re_QwZqiBC4_MEVgz1Pfz1nqN5Z3pzNVpnsk
RESEND_FROM=IWatches <onboarding@resend.dev>
```
*Si no tienes Resend configurado, puedes omitir estas variables. Los emails simplemente no se enviarán pero la app funcionará.*

### Paso 3: Seleccionar Ambientes
Para cada variable, selecciona los ambientes donde aplicar:
- ✅ **Production** (obligatorio)
- ✅ **Preview** (recomendado)
- ⬜ **Development** (opcional, ya usas `.env` local)

---

## 🔧 Configuración de Google OAuth para Producción

### Paso 1: Actualizar Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Selecciona tu **OAuth 2.0 Client ID**

### Paso 2: Agregar URIs de Redireccionamiento
En la sección **Authorized redirect URIs**, agrega:

```
https://tu-dominio-personalizado.com/api/auth/callback/google
```

⚠️ **IMPORTANTE**: 
- Reemplaza `tu-dominio-personalizado.com` con tu dominio real
- NO incluyas `www.` a menos que tu dominio use `www`
- Asegúrate de que sea **HTTPS** (no HTTP)
- Guarda los cambios

### Paso 3: Verificar Dominios Autorizados
En **Authorized JavaScript origins**, agrega:
```
https://tu-dominio-personalizado.com
```

---

## 🌍 Configuración de Dominio Personalizado en Vercel

### Opción 1: Si Compraste el Dominio en Vercel
1. Ve a tu proyecto en Vercel
2. **Settings** → **Domains**
3. Click en **Add Domain**
4. Escribe tu dominio (ej: `iwatches.com`)
5. Click **Add** - Vercel lo configurará automáticamente

### Opción 2: Si Tienes el Dominio en Otro Proveedor
1. Ve a **Settings** → **Domains** en Vercel
2. Agrega tu dominio personalizado
3. Vercel te dará instrucciones de DNS

#### Configuración DNS Típica:
**Para dominio raíz (iwatches.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Para www (www.iwatches.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Espera a que la verificación DNS se complete (puede tardar hasta 48 horas, pero usualmente es instantáneo)

---

## ✅ Checklist Final de Despliegue

### Antes de Desplegar:
- [ ] Todas las variables de entorno agregadas en Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` y `NEXTAUTH_URL` actualizadas con tu dominio real
- [ ] Google OAuth configurado con la URI de redirección correcta
- [ ] Dominio personalizado agregado y verificado en Vercel

### Después del Despliegue:
- [ ] Visitar tu sitio: `https://tu-dominio.com`
- [ ] Probar registro de nuevo usuario
- [ ] Probar inicio de sesión con email/contraseña
- [ ] Probar inicio de sesión con Google
- [ ] Verificar que la sesión persiste al recargar
- [ ] Probar cerrar sesión
- [ ] Verificar página "Mi cuenta" con sistema de referidos
- [ ] Probar descargar catálogo
- [ ] Probar compartir enlace de referido

---

## 🐛 Solución de Problemas Comunes

### Error: "Missing API key" en Resend
**Solución**: Agrega `RESEND_API_KEY` a las variables de entorno en Vercel, o déjalo vacío (los emails no se enviarán pero la app funcionará).

### Error: Google OAuth no funciona
**Solución**: 
1. Verifica que agregaste el URI de redirección correcto en Google Cloud Console
2. Asegúrate de usar HTTPS en producción
3. Verifica que `NEXT_PUBLIC_SITE_URL` coincida con tu dominio

### La sesión no persiste / Se cierra al recargar
**Solución**: 
1. Asegúrate de que `NEXT_PUBLIC_SITE_URL` está configurado correctamente
2. Las cookies requieren que el dominio sea consistente
3. Limpia las cookies del navegador y vuelve a iniciar sesión

### El sistema de referidos no funciona
**Solución**: 
1. Verifica la conexión a la base de datos Turso
2. Revisa los logs en Vercel para errores de base de datos
3. Asegúrate de que las variables `TURSO_CONNECTION_URL` y `TURSO_AUTH_TOKEN` son correctas

### Error 500 en producción
**Solución**:
1. Ve a Vercel Dashboard → Tu Proyecto → **Functions** → **Logs**
2. Revisa los logs de error
3. Usualmente es por variables de entorno faltantes o incorrectas

---

## 📞 Contacto y Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables de entorno estén correctas
3. Asegúrate de que tu dominio esté correctamente configurado

---

## 🎉 ¡Listo!

Una vez completados todos los pasos:
- ✅ Tu sitio estará en vivo en tu dominio personalizado
- ✅ El sistema de autenticación funcionará perfectamente
- ✅ Los usuarios podrán registrarse, iniciar sesión y usar el sistema de referidos
- ✅ La página "Mi cuenta" estará totalmente funcional
- ✅ Todo el sistema estará optimizado para producción

**¡Disfruta tu nuevo sitio en producción! 🚀**
