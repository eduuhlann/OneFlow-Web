const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Allow requests from the OneFlow web app (localhost dev + production)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4173', 'https://oneflowweb.vercel.app', '*'],
  methods: ['POST', 'GET']
}));

app.use(express.json());

const DISCORD_API = 'https://discord.com/api/v9';
const CDN = 'https://cdn.discordapp.com';

// Helper: build the PNG/GIF URL for a decoration asset hash
function buildDecorationUrl(asset) {
  if (!asset) return null;
  // Animated assets start with "a_"
  const ext = asset.startsWith('a_') ? 'gif' : 'png';
  return `${CDN}/avatar-decoration-presets/${asset}.${ext}?size=240&passthrough=true`;
}

// -------------------------------------------------------------------------
//  POST /decorations
//  Body: { token: "<discord_user_token>" }
//  Returns the list of all owned avatar decorations for that user
// -------------------------------------------------------------------------
app.post('/decorations', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token obrigatório.' });
  }

  const headers = {
    'Authorization': token,          // user token (selfbot)
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Super-Properties': Buffer.from(JSON.stringify({
      os: 'Windows',
      browser: 'Chrome',
      release_channel: 'stable',
      client_version: '1.0.9163',
    })).toString('base64'),
  };

  const decorations = [];
  const errors = [];

  // ── 1. Decoração atualmente equipada (/users/@me) ──────────────────────
  try {
    const meRes = await fetch(`${DISCORD_API}/users/@me`, { headers });
    if (meRes.ok) {
      const me = await meRes.json();
      if (me.avatar_decoration_data?.asset) {
        decorations.push({
          id: me.avatar_decoration_data.asset,
          sku_id: me.avatar_decoration_data.sku_id || null,
          url: buildDecorationUrl(me.avatar_decoration_data.asset),
          name: 'Equipada agora',
          equipped: true,
        });
      }
    } else {
      errors.push(`/users/@me: ${meRes.status} ${meRes.statusText}`);
    }
  } catch (e) {
    errors.push(`/users/@me: ${e.message}`);
  }

  // ── 2. Entitlements (itens comprados/Nitro) ────────────────────────────
  try {
    const entRes = await fetch(
      `${DISCORD_API}/users/@me/entitlements?exclude_ended=true&with_sku=true&with_application=false&limit=100`,
      { headers }
    );

    if (entRes.ok) {
      const entitlements = await entRes.json();
      for (const ent of entitlements) {
        const skuId = ent.sku_id;
        const skuData = ent.sku;
        if (!skuData) continue;

        // Decoration SKUs têm "AVATAR_DECORATION" na slug ou no tipo
        const slug = (skuData.slug || '').toLowerCase();
        const skuType = (skuData.type || '').toString();

        if (slug.includes('avatar') || slug.includes('decoration') || slug.includes('collectible')) {
          // Tenta montar a URL a partir dos assets do SKU
          const assets = skuData.dependent_sku_ids || [];
          const name = skuData.name?.['pt-BR'] || skuData.name?.['en-US'] || skuData.name || `Decoração ${skuId}`;

          // Verifica se há hash de asset embutido no own_items da listagem
          if (ent.decoration_hash) {
            decorations.push({
              id: ent.decoration_hash,
              sku_id: skuId,
              url: buildDecorationUrl(ent.decoration_hash),
              name,
              equipped: false,
            });
          } else {
            // Fallback: usa o skuId como referência para buscar depois
            decorations.push({
              id: skuId,
              sku_id: skuId,
              url: null,
              name,
              equipped: false,
            });
          }
        }
      }
    } else {
      errors.push(`/entitlements: ${entRes.status} ${entRes.statusText}`);
    }
  } catch (e) {
    errors.push(`/entitlements: ${e.message}`);
  }

  // ── 3. Collectibles (endpoint interno do Discord) ──────────────────────
  try {
    const colRes = await fetch(`${DISCORD_API}/users/@me/collectibles`, { headers });
    if (colRes.ok) {
      const col = await colRes.json();
      // Formato pode variar; iterar sobre arrays
      const items = Array.isArray(col) ? col : (col.items || col.decorations || []);
      for (const item of items) {
        const asset = item.asset || item.hash || item.id;
        if (!asset) continue;
        const alreadyAdded = decorations.find(d => d.id === asset);
        if (alreadyAdded) continue;
        decorations.push({
          id: asset,
          sku_id: item.sku_id || null,
          url: buildDecorationUrl(asset),
          name: item.name || item.label || `Decoração ${asset.slice(0, 8)}`,
          equipped: false,
        });
      }
    } else {
      errors.push(`/collectibles: ${colRes.status} ${colRes.statusText}`);
    }
  } catch (e) {
    // endpoint pode não existir — ok
    errors.push(`/collectibles: ${e.message}`);
  }

  // ── 4. Profile full (avatar_decorations array às vezes presente) ───────
  try {
    const profRes = await fetch(
      `${DISCORD_API}/users/@me/profile?with_mutual_guilds=false&with_mutual_friends_count=false`,
      { headers }
    );
    if (profRes.ok) {
      const prof = await profRes.json();
      const premiumDecorations = prof.user_profile?.avatar_decorations || [];
      for (const dec of premiumDecorations) {
        const asset = dec.asset || dec.hash;
        if (!asset) continue;
        const alreadyAdded = decorations.find(d => d.id === asset);
        if (alreadyAdded) continue;
        decorations.push({
          id: asset,
          sku_id: dec.sku_id || null,
          url: buildDecorationUrl(asset),
          name: dec.label || dec.name || `Decoração ${asset.slice(0, 8)}`,
          equipped: false,
        });
      }
    } else {
      errors.push(`/profile: ${profRes.status} ${profRes.statusText}`);
    }
  } catch (e) {
    errors.push(`/profile: ${e.message}`);
  }

  // Remove items sem URL válida
  const validDecorations = decorations.filter(d => d.url);

  return res.json({
    decorations: validDecorations,
    total: validDecorations.length,
    debug_errors: errors.length > 0 ? errors : undefined,
  });
});

// Health check
app.get('/ping', (req, res) => res.json({ status: 'ok', port: PORT }));

app.listen(PORT, () => {
  console.log(`\n🎨 Discord Decoration Selfbot rodando em http://localhost:${PORT}`);
  console.log(`   POST /decorations  → busca decorações do usuário`);
  console.log(`   GET  /ping         → health check\n`);
});
