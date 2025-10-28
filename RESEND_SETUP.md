# 📧 Configuración de Resend para IWatchWorks

## 🎯 ¿Qué es Resend?

Resend es el servicio de envío de emails que usa tu aplicación para:
- Formularios de contacto
- Consultas de relojes
- Suscripciones al newsletter
- Emails de bienvenida con código de descuento

## 📝 Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Haz clic en "Sign Up" (Registro)
3. Crea una cuenta con tu email
4. Verifica tu email

## 🔑 Paso 2: Obtener tu API Key

1. Una vez dentro de Resend, ve a **"API Keys"** en el menú lateral
2. Haz clic en **"Create API Key"**
3. Dale un nombre descriptivo: `iwatchworks-production`
4. Selecciona permisos: **"Sending access"**
5. Haz clic en **"Add"**
6. **IMPORTANTE**: Copia la API key que aparece (solo se muestra una vez)
   - Formato: `re_xxxxxxxxxxxxxxxxxxxxx`

## 📨 Paso 3: Verificar tu dominio (RECOMENDADO)

### Opción A: Usar dominio propio (iwatchworks.com) - MEJOR DELIVERABILITY

1. En Resend, ve a **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `iwatchworks.com`
4. Resend te dará varios registros DNS para configurar:

```
Tipo: TXT
Nombre: @
Valor: [valor proporcionado por Resend]

Tipo: CNAME
Nombre: resend._domainkey
Valor: [valor proporcionado por Resend]

Tipo: MX
Nombre: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10
```

5. **Añade estos registros DNS en tu proveedor de dominio** (donde compraste iwatchworks.com)
6. Espera 24-48 horas para que se propague
7. En Resend, verifica que el dominio esté **"Verified"** (verde)

### Opción B: Usar dominio de Resend (inicio rápido)

Si no quieres configurar DNS aún, puedes usar:
- `onboarding@resend.dev` (gratuito pero puede ir a spam)

## ⚙️ Paso 4: Configurar variables de entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Selecciona tu proyecto `relojes-japoneses-premium-landing`
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

### Variables obligatorias:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### Variables opcionales (según tu configuración):

**Si verificaste tu dominio:**
```bash
RESEND_FROM=IWatchWorks <hola@iwatchworks.com>
```

**Si usas el dominio de Resend (temporal):**
```bash
RESEND_FROM=IWatchWorks <onboarding@resend.dev>
```

5. Haz clic en **"Save"**
6. **Redeploy** tu aplicación para que tome las variables

## 🧪 Paso 5: Probar que funciona

### Test 1: Formulario de contacto
1. Ve a tu web: https://iwatchworks.com
2. Scroll hasta el formulario de contacto
3. Llena el formulario y envía
4. Deberías recibir un email en la dirección configurada en `RESEND_FROM`

### Test 2: Newsletter
1. En el footer, suscríbete al newsletter
2. Deberías recibir un email de bienvenida con el código WELCOME5

### Test 3: Consulta de reloj
1. En la sección de relojes destacados
2. Haz clic en "Solicitar información"
3. Llena el formulario
4. Deberías recibir el email de consulta

## 📊 Plan gratuito de Resend

- **100 emails/día** (3,000/mes) - GRATIS
- Perfecto para empezar
- Si necesitas más, planes desde $20/mes

## 🔍 Verificar envíos

1. En Resend Dashboard, ve a **"Logs"**
2. Verás todos los emails enviados:
   - ✅ Verde = Entregado
   - 🔴 Rojo = Falló
   - 🟡 Amarillo = En proceso

## ⚠️ Problemas comunes

### "403 Forbidden" o "API Key inválida"
- Verifica que copiaste bien la API key
- Asegúrate de que está en las variables de entorno de Vercel
- Redeploy la aplicación

### "Domain not verified"
- Si usas tu dominio, verifica que los registros DNS estén configurados
- Espera 24-48 horas para propagación
- Mientras tanto, usa `onboarding@resend.dev`

### Los emails van a spam
- **Solución**: Verifica tu dominio propio en Resend
- Los emails desde dominios verificados tienen mejor reputación
- Añade SPF, DKIM y DMARC records (Resend te los proporciona)

## 🎨 Personalización adicional (opcional)

Para cambiar el email de destino de los formularios:

```bash
# En Vercel Environment Variables
RESEND_FROM=IWatchWorks <tu-email@iwatchworks.com>
```

Todos los formularios enviarán emails a esta dirección.

## 📞 Soporte

- Documentación oficial: https://resend.com/docs
- Discord de Resend: https://resend.com/discord
- Email: support@resend.com

---

## ✅ Checklist final

- [ ] Cuenta de Resend creada
- [ ] API Key generada y copiada
- [ ] API Key configurada en Vercel (`RESEND_API_KEY`)
- [ ] Variable `RESEND_FROM` configurada
- [ ] Dominio verificado (opcional pero recomendado)
- [ ] Aplicación redeployada en Vercel
- [ ] Formularios testeados y funcionando
- [ ] Emails recibidos correctamente

¡Una vez completado este checklist, todos tus formularios estarán enviando emails correctamente! 🎉
