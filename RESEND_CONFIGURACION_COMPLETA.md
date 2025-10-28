# 🔧 Configuración Completa de Resend para Envío de Correos

## ✅ Cambios Realizados en el Código

Todos los problemas han sido solucionados:

### 1. **Login y Registro** ✅
- Ahora usa `window.location.href` para forzar recarga completa
- La sesión se actualiza correctamente después de login/registro
- El botón "Mi cuenta" aparece correctamente después de iniciar sesión

### 2. **Reseñas** ✅
- Añadidos headers anti-caché en el API
- Timestamp en las peticiones para evitar caché del navegador
- Refrescado automático cada 30 segundos
- Las reseñas ahora funcionan correctamente en producción

### 3. **Logo/Nombre** ✅
- Ya está correcto como "IWatchWorks" en toda la aplicación

---

## 📧 Configuración de Resend para Envío de Correos

### Paso 1: Crear Cuenta en Resend

1. Ve a **https://resend.com**
2. Crea una cuenta gratuita (incluye 100 correos/día gratis)
3. Verifica tu email

### Paso 2: Obtener API Key

1. Inicia sesión en Resend
2. Ve a **API Keys** en el menú lateral
3. Haz clic en **"Create API Key"**
4. Dale un nombre (ej: "IWatchWorks Production")
5. Selecciona permisos: **"Sending access"**
6. Copia la API Key (solo se muestra una vez)

### Paso 3: Configurar Dominio (Recomendado para Producción)

#### Opción A: Usar dominio propio (iwatchworks.com)

1. En Resend, ve a **Domains**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `iwatchworks.com`
4. Resend te dará registros DNS para configurar:

```
Tipo: MX
Host: iwatchworks.com
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10

Tipo: TXT
Host: iwatchworks.com
Valor: [valor proporcionado por Resend]

Tipo: TXT  
Host: resend._domainkey.iwatchworks.com
Valor: [valor proporcionado por Resend]

Tipo: TXT
Host: _dmarc.iwatchworks.com
Valor: v=DMARC1; p=none
```

5. Ve a tu proveedor de dominio (donde compraste iwatchworks.com)
6. Añade estos registros DNS
7. Espera 24-48 horas para propagación
8. Verifica en Resend que el dominio esté verificado ✅

#### Opción B: Usar dominio temporal de Resend (Testing)

Si no quieres configurar DNS ahora, puedes usar:
```
RESEND_FROM=IWatchWorks <onboarding@resend.dev>
```
⚠️ Limitación: Solo puedes enviar a emails específicos (no a cualquier usuario)

### Paso 4: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en **Vercel Dashboard**
2. Ve a **Settings** → **Environment Variables**
3. Añade estas variables:

```bash
# API Key de Resend (obtenida en Paso 2)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email remitente (después de verificar dominio)
RESEND_FROM=IWatchWorks <contacto@iwatchworks.com>

# O si usas el temporal:
RESEND_FROM=IWatchWorks <onboarding@resend.dev>
```

4. Asegúrate de seleccionar los tres ambientes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

5. Haz clic en **"Save"**

### Paso 5: Redeploy en Vercel

1. Ve a **Deployments** en Vercel
2. Haz clic en el último deployment
3. Clic en los tres puntos (...) → **"Redeploy"**
4. Marca **"Use existing Build Cache"** (más rápido)
5. Haz clic en **"Redeploy"**

---

## 🧪 Probar que los Correos Funcionan

### Test 1: Formulario de Contacto

1. Ve a tu web: `https://iwatchworks.com`
2. Scroll hasta la sección **"Contacto"**
3. Completa el formulario:
   - Nombre: Tu Nombre
   - Email: tu@email.com
   - Mensaje: Test de configuración
4. Envía el formulario
5. Deberías recibir un correo en el email configurado en `RESEND_FROM`

### Test 2: Solicitud de Información

1. En la sección **"Relojes Destacados"**
2. Haz clic en **"Solicitar información"** en cualquier reloj
3. Completa el modal
4. Envía
5. Verifica que llegue el correo

### Test 3: Newsletter

1. En el footer de la página
2. Ingresa un email en el campo de newsletter
3. Envía
4. Verifica que llegue el correo de bienvenida

---

## 📊 Monitorear Correos Enviados

### En Resend Dashboard:

1. Ve a **Emails** en el menú lateral
2. Verás todos los correos enviados con:
   - ✅ Estado (Delivered, Bounced, etc.)
   - 📅 Fecha y hora
   - 📧 Destinatario
   - 📄 Contenido del correo

### En caso de errores:

Si los correos no llegan, revisa:

1. **Logs de Vercel:**
   - Ve a tu proyecto en Vercel
   - Clic en **Deployments** → tu deployment → **Functions**
   - Busca errores en los logs de `/api/contact`, `/api/inquiry`, `/api/newsletter`

2. **Resend Dashboard:**
   - Ve a **Emails** y busca correos con estado "Failed"
   - Haz clic para ver el error detallado

3. **Variables de entorno:**
   - Verifica que `RESEND_API_KEY` esté correcta
   - Verifica que `RESEND_FROM` use un email verificado

---

## ⚡ Archivos que Envían Correos

Estos son los archivos API que envían correos:

### 1. `/api/contact/route.ts` 
**Formulario de contacto general**
```typescript
// Envía correo cuando alguien contacta desde el formulario principal
```

### 2. `/api/inquiry/route.ts`
**Solicitudes de información sobre relojes**
```typescript
// Envía correo cuando alguien pregunta por un reloj específico
```

### 3. `/api/newsletter/route.ts`
**Suscripciones al newsletter**
```typescript
// Envía correo de bienvenida al suscribirse
```

---

## 🎯 Checklist Final

Antes de considerar que Resend está 100% configurado:

- [ ] API Key obtenida de Resend
- [ ] API Key añadida a Vercel Environment Variables
- [ ] Email remitente configurado (`RESEND_FROM`)
- [ ] Dominio verificado en Resend (opcional pero recomendado)
- [ ] Registros DNS configurados (si usas dominio propio)
- [ ] Deployment de Vercel actualizado con nuevas variables
- [ ] Test del formulario de contacto exitoso ✅
- [ ] Test de solicitud de información exitoso ✅
- [ ] Test de newsletter exitoso ✅
- [ ] Correos llegando correctamente sin ir a spam

---

## 🚨 Solución de Problemas Comunes

### Problema: "Resend API Key no válida"
**Solución:** Regenera la API Key en Resend y actualiza en Vercel

### Problema: "Email address is not verified"
**Solución:** 
1. Si usas dominio propio, verifica que los DNS estén configurados
2. Si usas onboarding@resend.dev, solo puedes enviar a emails verificados en testing

### Problema: "Correos van a spam"
**Solución:**
1. Configura dominio propio con registros DKIM, SPF y DMARC
2. Evita palabras spam en asuntos ("GRATIS", "URGENTE", etc.)
3. Usa un email corporativo verificado

### Problema: "Rate limit exceeded"
**Solución:**
1. Plan gratuito: 100 emails/día, 3,000 emails/mes
2. Si necesitas más, actualiza a plan de pago en Resend

---

## 📞 Soporte

Si necesitas ayuda adicional:

- **Documentación Resend:** https://resend.com/docs
- **Status de Resend:** https://status.resend.com
- **Discord de Resend:** https://resend.com/discord

---

**¡Listo!** Con estos pasos, el sistema de correos estará completamente funcional en producción. 🎉
