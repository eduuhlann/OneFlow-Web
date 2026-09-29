import { supabase } from '../supabase';

/** Bucket público com as mídias da biblioteca. */
export const MEDIA_BUCKET = 'media';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'bmp'];

const PAGE_SIZE = 200;
const MAX_DEPTH = 4;

export interface MediaItem {
    /** Caminho completo dentro do bucket (ex: `avatares/joao.png`) */
    path: string;
    /** Pasta imediatamente acima do arquivo (vazio para arquivos na raiz) */
    folder: string;
    name: string;
    url: string;
    size: number | null;
    updatedAt: string | null;
}

const isImage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return IMAGE_EXTENSIONS.includes(ext);
};

/** Lista arquivos e subpastas de um prefixo do bucket. */
const listAt = async (prefix: string) => {
    const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(prefix, { limit: PAGE_SIZE });

    if (error) throw new Error(error.message);
    return data ?? [];
};

const folderOf = (path: string) => {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx);
};

const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);

const toItem = (path: string, meta?: { size?: number | null; updated_at?: string | null }): MediaItem => ({
    path,
    folder: folderOf(path),
    name: nameOf(path),
    url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
    size: meta?.size ?? null,
    updatedAt: meta?.updated_at ?? null,
});

/**
 * Lista todas as imagens do bucket, entrando nas subpastas.
 * Arquivos de sistema do Supabase (`.DS_Store` e afins) são ignorados.
 */
export const listMediaLibrary = async (): Promise<MediaItem[]> => {
    const items: MediaItem[] = [];

    const walk = async (prefix: string, depth: number) => {
        const entries = await listAt(prefix);
        for (const entry of entries) {
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.name.startsWith('.')) continue;
            if (entry.id) continue; // placeholder de pasta
            if (isImage(entry.name)) {
                items.push(toItem(path, entry));
            } else if (depth < MAX_DEPTH) {
                await walk(path, depth + 1);
            }
        }
    };

    await walk('', 0);

    return items.sort((a, b) => {
        if (a.folder !== b.folder) return a.folder.localeCompare(b.folder);
        return a.name.localeCompare(b.name);
    });
};

/** URL pública de um caminho dentro do bucket. */
export const mediaPublicUrl = (path: string) =>
    supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

export const mediaLibraryService = {
    MEDIA_BUCKET,
    listMediaLibrary,
    mediaPublicUrl,
};
