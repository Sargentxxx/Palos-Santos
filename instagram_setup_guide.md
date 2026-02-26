# Guía de Conexión: Instagram Graph API (Oficial)

Ya que tienes el perfil de **Instagram Business** vinculado a tu **Facebook Personal**, estamos listos para usar la API oficial. Este es el camino más robusto y permitido por Meta.

## Paso 1: Configuración en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/).
2. Haz clic en **Mis apps** > **Crear app**.
3. Selecciona el tipo de app **"Otro"** y luego **"Negocios"** (o Empresa).
4. En el panel de la app, busca **Instagram Graph API** y haz clic en "Configurar".

## Paso 2: Permisos Necesarios

Para poder extraer los datos de tu perfil y posts, necesitarás solicitar estos permisos en el "Explorador de la API Graph":

- `instagram_basic`: Para obtener metadatos básicos y fotos.
- `instagram_manage_insights`: Si quieres métricas (likes, impresiones).
- `pages_show_list`: Para ver las páginas de Facebook vinculadas.
- `pages_read_engagement`: Para leer el contenido de la página vinculada.

## Paso 3: Obtener tu Instagram Business ID

Antes de hacer código, necesitamos el ID de la cuenta de Instagram.

1. Abre el [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Selecciona tu App en el menú desplegable.
3. En la barra de búsqueda (GET), escribe:
   `me/accounts?fields=instagram_business_account,name`
4. Esto te devolverá el ID de tu página de Facebook y el `instagram_business_account` ID. **Guarda este último.**

## Paso 4: Flujo de Tokens

La API usa tokens. El que genera el Explorer es "Short-lived" (2 horas). En producción necesitamos un "Long-lived Token" (60 días).

**Cálculo del Long-lived Token:**
`GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}`

---

## Paso 5: Endpoint para Scraping de Posts

Una vez tengas el `INSTAGRAM_BUSINESS_ID` y el `ACCESS_TOKEN`, el endpoint principal para obtener tus fotos es:

`GET https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token={ACCESS_TOKEN}`

---

### ¿Qué sigue?

He preparado un script base en Node.js que implementa esta lógica. ¿Quieres que lo configuremos en una carpeta del proyecto para empezar a recibir los datos?
