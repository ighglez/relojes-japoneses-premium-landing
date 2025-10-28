# 📧 Configuración de Resend para IWatchWorks

## Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com/signup](https://resend.com/signup)
2. Regístrate con tu email
3. Verifica tu cuenta

## Paso 2: Obtener tu API Key

1. Una vez dentro del dashboard, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre descriptivo: `IWatchWorks Production`
4. Copia la clave generada (solo se muestra una vez)

## Paso 3: Configurar dominio (Recomendado para producción)

### Opción A: Usar dominio personalizado (iwatchworks.com)

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio: `iwatchworks.com`
4. Resend te dará 3 registros DNS que debes agregar en tu proveedor de dominio:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **MX Record** (opcional pero recomendado)

5. Agrega estos registros en tu proveedor de dominio (GoDaddy, Namecheap, etc.)
6. Espera 24-48 horas para que se propaguen los DNS
7. Una vez verificado, podrás enviar desde: `noreply@iwatchworks.com` o `contacto@iwatchworks.com`

### Opción B: Usar subdominio (más rápido)

1. Crea un subdominio: `mail.iwatchworks.com`
2. Sigue el mismo proceso de verificación DNS
3. Podrás enviar desde: `noreply@mail.iwatchworks.com`

### Opción C: Usar dominio de Resend (desarrollo/pruebas)

Para empezar rápido sin configurar DNS:
- Usa: `onboarding@resend.dev`
- **Limitación**: Solo puedes enviar a emails que agregues manualmente en Resend
- **No recomendado** para producción

## Paso 4: Configurar variables de entorno

### En tu archivo `.env` local:

```bash
RESEND_API_KEY=re_tu_clave_api_aqui
RESEND_FROM=IWatchWorks <noreply@iwatchworks.com>
```

### En Vercel (Producción):

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Variable**: `RESEND_API_KEY`
   - **Value**: tu API key de Resend
   - **Environment**: Production, Preview, Development

4. Agrega:
   - **Variable**: `RESEND_FROM`
   - **Value**: `IWatchWorks <noreply@iwatchworks.com>`
   - **Environment**: Production, Preview, Development

5. Haz un **Redeploy** para que tome las nuevas variables

## Paso 5: Probar el envío de emails

### Desde tu entorno local:

```bash
# Inicia el servidor
npm run dev

# Prueba el formulario de contacto en:
http://localhost:3000/#contacto

# O descarga el catálogo y deja tu email
http://localhost:3000/#catalogo
```

### Verificar en Resend Dashboard:

1. Ve a **Logs** en Resend
2. Verás todos los emails enviados con su estado:
   - ✅ **Delivered**: Email entregado correctamente
   - ⏳ **Queued**: En cola
   - ❌ **Failed**: Error (revisa los logs)

## Endpoints que usan Resend en tu app:

1. **`/api/contact`** - Formulario de contacto
2. **`/api/inquiry`** - Solicitudes de información de relojes
3. **`/api/newsletter`** - Suscripción al newsletter (después de descargar catálogo)

## Límites de Resend

### Plan Gratuito:
- **100 emails/día**
- **3,000 emails/mes**
- 1 dominio verificado
- Soporte por email

### Plan Pro ($20/mes):
- **50,000 emails/mes**
- Dominios ilimitados
- Soporte prioritario
- Sin límite diario

## Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste la clave completa
- Asegúrate de que empiece con `re_`
- Revisa que no tenga espacios al inicio o final

### Error: "Sender not verified"
- Si usas dominio personalizado, verifica que los DNS estén configurados
- Usa `onboarding@resend.dev` temporalmente para pruebas

### Emails no llegan:
1. Revisa la carpeta de SPAM
2. Verifica los logs en Resend Dashboard
3. Si usas Gmail, puede tardar unos minutos

### Error 429 (Too Many Requests):
- Llegaste al límite de 100 emails/día del plan gratuito
- Espera hasta mañana o actualiza a plan Pro

## Mejores prácticas

1. **Usa dominio verificado en producción**: Mayor deliverability
2. **Monitorea los logs**: Revisa Resend Dashboard regularmente
3. **Email de remitente profesional**: `noreply@iwatchworks.com` en vez de `test@...`
4. **Configura SPF/DKIM**: Mejora la reputación del dominio
5. **Templates HTML**: Considera crear plantillas HTML para emails más profesionales

## ¿Necesitas ayuda?

- **Documentación oficial**: [https://resend.com/docs](https://resend.com/docs)
- **Soporte de Resend**: [https://resend.com/support](https://resend.com/support)
- **Guía de verificación de dominio**: [https://resend.com/docs/send-with-domains](https://resend.com/docs/send-with-domains)

---

✅ **Una vez configurado correctamente**, todos los formularios de tu web enviarán emails automáticamente sin intervención manual.
