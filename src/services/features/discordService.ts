// src/services/features/discordService.ts

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const CDN_BASE = 'https://cdn.discordapp.com';

export interface DiscordUserData {
    id: string;
    username: string;
    avatar: string | null;
    avatar_decoration_data: {
        asset: string;
        sku_id: string;
    } | null;
}

export const discordService = {
    /**
     * Constrói a URL da decoração do avatar do Discord
     */
    getDecorationUrl(assetHash: string): string {
        return `${CDN_BASE}/avatar-decoration-presets/${assetHash}.png?size=240`;
    },

    /**
     * Busca dados do usuário via token (se fornecido manualmente ou via OAuth)
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

        return response.json();
    },

    /**
     * Busca dados de um usuário específico via ID (requer Bot Token)
     * NOTA: Isso só funciona se o Bot tiver acesso ao usuário (estar em um servidor comum)
     */
    async getUserDataById(userId: string, botToken: string): Promise<DiscordUserData> {
        const response = await fetch(`${DISCORD_API_BASE}/users/${userId}`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Falha ao buscar usuário pelo ID');
        }

        return response.json();
    }
};
