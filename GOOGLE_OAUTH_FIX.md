# 🔧 Solución de problemas con Google OAuth

## Problema

El inicio de sesión con Google no funciona correctamente en producción (iwatchworks.com).

## Causa

Los URIs de redireccionamiento en Google Cloud Console no están configurados correctamente para tu dominio en producción.

## Solución paso a paso

### 1. Accede a Google Cloud Console

Ve a: [https://console.cloud.google.com/](https://console.cloud.google.com/)

### 2. Selecciona tu proyecto

Si ya tienes un proyecto configurado, selecciónalo. Si no:
- Haz clic en **Select a project** → **New Project**
- Nombre: `IWatchWorks`
- Haz clic en **Create**

### 3. Habilita la API de Google+

1. Ve a **APIs & Services** → **Library**
2. Busca: `Google+ API`
3. Haz clic en **Enable**

### 4. Configura la pantalla de consentimiento OAuth

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External** (para usuarios públicos)
3. Haz clic en **Create**

**Completa la información:**
- **App name**: `IWatchWorks`
- **User support email**: tu email
- **App logo**: (opcional) sube el logo de tu marca
- **App domain** → **Authorized domains**: `iwatchworks.com`
- **Developer contact information**: tu email
4. Haz clic en **Save and Continue**
5. En **Scopes**, haz clic en **Add or Remove Scopes**:
   - Marca: `userinfo.email`
   - Marca: `userinfo.profile`
   - Marca: `openid`
6. Haz clic en **Save and Continue**
7. En **Test users** (opcional, solo si estás en modo testing)
8. Haz clic en **Save and Continue**

### 5. Crea las credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **+ Create Credentials** → **OAuth client ID**
3. Selecciona **Application type**: `Web application`
4. **Name**: `IWatchWorks Web Client`

**Configura los URIs autorizados:**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://iwatchworks.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://iwatchworks.com/api/auth/callback/google
```

5. Haz clic en **Create**
6. **IMPORTANTE**: Copia el **Client ID** y **Client Secret** que aparecen

### 6. Actualiza las variables de entorno en Vercel

1. Ve a tu proyecto en Vercel: [https://vercel.com/](https://vercel.com/)
2. Selecciona el proyecto `iwatchworks`
3. Ve a **Settings** → **Environment Variables**

**Actualiza o agrega estas variables:**

| Variable | Valor | Environments |
|----------|-------|--------------|
| `GOOGLE_CLIENT_ID` | Tu Client ID de Google | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | Tu Client Secret de Google | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://iwatchworks.com` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://iwatchworks.com` | Production |

4. Haz clic en **Save** en cada variable

### 7. Redeploy en Vercel

1. Ve a **Deployments** en tu proyecto de Vercel
2. Encuentra el último deployment
3. Haz clic en los **tres puntos** (⋮)
4. Selecciona **Redeploy**
5. Marca la opción **Use existing Build Cache** (desmarcada)
6. Haz clic en **Redeploy**

### 8. Prueba el login

1. Una vez que el deployment esté completo, ve a: `https://iwatchworks.com/iniciar-sesion`
2. Haz clic en **Continuar con Google**
3. Deberías ver la pantalla de selección de cuenta de Google
4. Selecciona tu cuenta
5. Acepta los permisos
6. Deberías ser redirigido a: `https://iwatchworks.com/mi-cuenta`

## Verificación adicional

### Comprobar que los redirects están configurados correctamente:

```bash
# Verifica la configuración en tu código
# El archivo src/lib/auth.ts debe tener:
redirectURI: `${getBaseURL()}/api/auth/callback/google`
```

### En caso de que siga sin funcionar:

1. **Revisa los logs de Vercel:**
   - Ve a tu proyecto → **Deployments** → Click en el deployment activo → **Functions**
   - Revisa si hay errores relacionados con Google OAuth

2. **Verifica las cookies:**
   - Abre DevTools (F12) → **Application** → **Cookies**
   - Deberías ver cookies como `iwatches_session`

3. **Revisa la consola del navegador:**
   - Abre DevTools (F12) → **Console**
   - Busca errores relacionados con OAuth

## Errores comunes

### Error: "redirect_uri_mismatch"
**Solución**: Los URIs en Google Console no coinciden exactamente. Verifica:
- Que no haya espacios
- Que use `https://` (no `http://`) en producción
- Que termine en `/api/auth/callback/google` (sin barra final)

### Error: "invalid_client"
**Solución**: 
- El Client ID o Secret están mal copiados
- Verifica que no tengan espacios al inicio o final
- Revisa que las variables en Vercel estén guardadas correctamente

### El usuario se queda en la pantalla de Google
**Solución**:
- Verifica que `NEXTAUTH_URL` y `NEXT_PUBLIC_SITE_URL` tengan el dominio correcto
- Asegúrate de haber hecho redeploy después de cambiar las variables

### Error: "Access blocked: This app's request is invalid"
**Solución**:
- Verifica que hayas completado la pantalla de consentimiento OAuth
- Asegúrate de que el dominio `iwatchworks.com` esté en **Authorized domains**

## Contacto de soporte

Si después de seguir estos pasos sigue sin funcionar:

1. **Google Cloud Support**: [https://support.google.com/cloud](https://support.google.com/cloud)
2. **Better Auth Docs**: [https://www.better-auth.com/docs](https://www.better-auth.com/docs)
3. **Vercel Support**: [https://vercel.com/support](https://vercel.com/support)

---

✅ **Después de seguir estos pasos**, el inicio de sesión con Google debería funcionar perfectamente en `iwatchworks.com`.
