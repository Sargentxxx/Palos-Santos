require('dotenv').config();
const axios = require('axios');

async function getInstagramProfileData(targetUsername) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    // Si no tenemos el ID, el script primero buscará tu ID de página y de Instagram vinculado
    console.log("-----------------------------------------");
    console.log(`Buscando datos del perfil: ${targetUsername}...`);
    console.log("-----------------------------------------");

    try {
        // Paso 1: Autodescubrimiento del Business ID
        console.log("Paso 1: Buscando tu ID de cuenta de Instagram empresarial...");
        
        let instagramBusinessAccountId = null;
        const meUrl = `https://graph.facebook.com/v21.0/me/accounts`;
        
        const accountsResponse = await axios.get(meUrl, {
            params: {
                fields: 'instagram_business_account{id,username},name',
                access_token: accessToken
            }
        });

        if (accountsResponse.data && accountsResponse.data.data && accountsResponse.data.data.length > 0) {
            // Buscamos la página que tenga un instagram_business_account vinculado
            for (const page of accountsResponse.data.data) {
                if (page.instagram_business_account) {
                    instagramBusinessAccountId = page.instagram_business_account.id;
                    const igUsername = page.instagram_business_account.username;
                    console.log(`¡Encontrado! Página: ${page.name} -> Instagram vinculado: @${igUsername}`);
                    break;
                }
            }
        }

        if (!instagramBusinessAccountId) {
            console.error("❌ ERROR: No pude encontrar una cuenta de Instagram Profesional vinculada a tus páginas con este Token.");
            console.error("Vuelve a revisar la vinculación en Facebook o los permisos del Token.");
            return;
        }

        console.log("-----------------------------------------");
        console.log(`Paso 2: Extrayendo información de @${targetUsername}...`);

        // Paso 2: La llamada real de Business Discovery usando tu ID extraído
        const discoveryUrl = `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}`;
        
        const response = await axios.get(discoveryUrl, {
            params: {
                fields: `business_discovery.username(${targetUsername}){followers_count,media_count,name,profile_picture_url,website,biography,media{id,caption,media_url,permalink,timestamp,username}}`,
                access_token: accessToken
            }
        });

        // Save to file securely with UTF-8 encoding
        const fs = require('fs');
        fs.writeFileSync('palossantos_data.json', JSON.stringify(response.data.business_discovery, null, 2), 'utf8');
        
        console.log("✅ ¡Éxito! Datos guardados en palossantos_data.json");
        
        return response.data.business_discovery;

    } catch (error) {
        console.error("-----------------------------------------");
        console.error('❌ Error al conectar con Instagram API:');
        if (error.response && error.response.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        console.error("-----------------------------------------");
    }
}

// Permitir pasar el nombre de usuario por la consola (ej. node instagram_connector.js palossantos.sgo)
const target = process.argv[2] || 'instagram';
getInstagramProfileData(target);

module.exports = { getInstagramProfileData };
