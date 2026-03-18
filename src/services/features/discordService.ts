// src/services/features/discordService.ts

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const CDN_BASE = 'https://cdn.discordapp.com';

export interface DiscordUserData {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    banner: string | null;
    banner_color: string | null;
    accent_color: number | null;
    avatar_decoration_data: {
        asset: string;
        sku_id: string;
    } | null;
    profile_effect_data: {
        id: string;
    } | null;
}

export const discordService = {
    /**
     * Converte o accent_color do Discord (decimal) para Hexadecimal
     */
    intToHex(intColor: number | null): string | null {
        if (intColor === null || intColor === undefined) return null;
        return `#${intColor.toString(16).padStart(6, '0')}`;
    },

    /**
     * Constrói a URL do avatar do Discord (suporta GIF)
     */
    getAvatarUrl(userId: string, hash: string): string {
        const ext = hash.startsWith('a_') ? 'gif' : 'png';
        return `${CDN_BASE}/avatars/${userId}/${hash}.${ext}?size=512`;
    },

    /**
     * Constrói a URL do banner do Discord (suporta GIF)
     */
    getBannerUrl(userId: string, hash: string): string {
        const ext = hash.startsWith('a_') ? 'gif' : 'png';
        return `${CDN_BASE}/banners/${userId}/${hash}.${ext}?size=1024`;
    },

    /**
     * Constrói a URL da decoração do avatar do Discord
     */
    getDecorationUrl(assetHash: string): string {
        return `${CDN_BASE}/avatar-decoration-presets/${assetHash}.png?size=240`;
    },

    /**
     * Busca dados do usuário via token OAuth2
     */
    async getUserData(accessToken: string): Promise<DiscordUserData> {
        const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Falha ao buscar dados do Discord');
        }

        const data = await response.json();
        
        // Injetar a cor em hex no objeto data
        if (data.accent_color) {
            data.banner_color = this.intToHex(data.accent_color);
        }
        
        return data;
    }
};
