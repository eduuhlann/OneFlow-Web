import { supabase } from '../supabase';

/** Bucket público com as mídias da biblioteca. */
export const MEDIA_BUCKET = 'media';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'bmp'];

const PAGE_SIZE = 200;
const MAX_DEPTH = 4;
const MAX_PAGES = 20;

export interface MediaItem {
    /** Caminho completo dentro do bucket (ex: `avatares/joao.png`) */
    path: string;
    /** Pasta imediatamente acima do arquivo (vazio para arquivos na raiz) */
    folder: string;
    name: string;
    /** Nome amigável para exibir (sem o sufixo técnico do chat) */
    label: string;
    /** Extensão inferida do mimetype quando o arquivo não tem uma no nome */
    extension: string;
    url: string;
    size: number | null;
    updatedAt: string | null;
}

const MIME_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
};

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/**
 * Imagem = extensão conhecida **ou** mimetype de imagem.
 *
 * O bucket pode guardar arquivos sem extensão no nome (por exemplo
 * `1753900000000_abc.attach_1720000000000`), e nesses casos só o
 * mimetype revela que é imagem. Checar apenas a extensão esconderia
 * a mídia inteira da galeria.
 */
const isImage = (name: string, mimetype?: string | null) => {
    if (IMAGE_EXTENSIONS.includes(extOf(name))) return true;
    return (mimetype ?? '').toLowerCase().startsWith('image/');
};

/** Lista arquivos e subpastas de um prefixo do bucket. */
const listAt = async (prefix: string, offset: number) => {
    const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(prefix, { limit: PAGE_SIZE, offset });

    if (error) {
        const wrapped: any = new Error(error.message);
        wrapped.status = (error as any).status;
        throw wrapped;
    }
    return data ?? [];
};

const folderOf = (path: string) => {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx);
};

const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/**
 * Rótulo exibido na grade.
 *
 * Arquivos com nome de timestamp e sufixo técnico (padrão do upload de
 * chat: `1753900000000_abc.attach_1720000000000`) viram
 * "1753900000000_abc.jpg" para o usuário, e a busca passa a ignorar
 * esse sufixo.
 */
const toLabel = (name: string, ext: string) => {
    const stem = name.replace(/\.[^.]+$/, '').replace(/\.attach_\d+$/, '');
    return `${stem}.${ext}`;
};

const toItem = (path: string, meta?: { size?: number | null; updated_at?: string | null; mimetype?: string | null }): MediaItem => {
    const name = nameOf(path);
    const ext = IMAGE_EXTENSIONS.includes(extOf(name))
        ? extOf(name)
        : MIME_EXTENSIONS[(meta?.mimetype ?? '').toLowerCase()] ?? 'jpg';
    return {
        path,
        folder: folderOf(path),
        name,
        label: toLabel(name, ext),
        extension: ext,
        url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
        size: meta?.size ?? null,
        updatedAt: meta?.updated_at ?? null,
    };
};

/**
 * Erro de permissão no endpoint de listagem.
 *
 * Num bucket público as imagens abrem pela URL pública normalmente, mas
 * o endpoint `list()` continua exigindo uma policy de SELECT em
 * `storage.objects`. Sem essa policy a API responde 400/403 mesmo com o
 * bucket marcado como público, e a galeria ficaria vazia sem explicação.
 */
export class MediaPermissionError extends Error {
    constructor(message = 'Sem permissão para listar o bucket.') {
        super(message);
        this.name = 'MediaPermissionError';
    }
}

const isPermissionError = (error: { status?: number; message?: string }) => {
    const status = error.status ?? 0;
    if (status === 400 || status === 401 || status === 403) return true;
    return /row-level security|not authorized|permission|new row violates/i.test(
        error.message ?? ''
    );
};

/**
 * Lista todas as imagens do bucket, entrando nas subpastas.
 * Pagina dentro de cada pasta e ignora arquivos ocultos.
 */
export const listMediaLibrary = async (): Promise<MediaItem[]> => {
    const items: MediaItem[] = [];

    const walk = async (prefix: string, depth: number) => {
        const pages: Awaited<ReturnType<typeof listAt>>[] = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            const entries = await listAt(prefix, page * PAGE_SIZE);
            pages.push(entries);
            if (entries.length < PAGE_SIZE) break;
        }

        const subfolders: string[] = [];
        for (const entry of pages.flat()) {
            if (entry.name.startsWith('.')) continue;
            if (entry.id) continue; // placeholder de pasta
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;
            // FileObject tipa apenas `metadata`, mas algumas respostas
            // trazem `mimetype` no nível raiz.
            const mimetype =
                entry.metadata?.mimetype ?? (entry as { mimetype?: string }).mimetype ?? null;
            if (isImage(entry.name, mimetype)) items.push(toItem(path, { ...entry, mimetype }));
            else if (depth < MAX_DEPTH) subfolders.push(path);
        }

        // Subpastas em paralelo: cada nível é uma chamada de rede.
        if (subfolders.length) {
            await Promise.all(subfolders.map((path) => walk(path, depth + 1)));
        }
    };

    try {
        await walk('', 0);
    } catch (err: any) {
        // Bucket sem policy de SELECT: a URL pública funciona, mas o
        // list() é negado. Traduzimos para uma mensagem que o app sabe
        // explicar em vez de mostrar um erro cru da API.
        if (isPermissionError(err)) throw new MediaPermissionError(err.message);
        throw err;
    }

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
