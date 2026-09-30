import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  User,
  Image,
  Shield,
  Check,
  Copy,
  MoreHorizontal,
  Upload,
  X,
  AtSign,
  Mail,
  ChevronRight,
  Images,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '../services/supabase';
import PageTransition from '../components/PageTransition';
import ImageCropModal from '../components/ImageCropModal';
import getCroppedImg from '../utils/imageUtils';
import { profileUrl as buildProfileUrl } from '../lib/site';
import { listMediaLibrary, MediaPermissionError, type MediaItem } from '../services/features/mediaLibraryService';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavSection = 'profile' | 'avatar' | 'banner' | 'library' | 'privacy';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const Discord = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.024.015.046.036.06a19.83 19.83 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.07 13.07 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

const OneFlowLogo = () => (
  <div className="ep-logo">
    <div className="ep-logo-mark">
      <div className="ep-logo-ring" />
      <div className="ep-logo-dot" />
    </div>
    <span className="ep-logo-text">OneFlow</span>
  </div>
);

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Perfil', icon: <User size={21} /> },
  { id: 'avatar', label: 'Avatar', icon: <Camera size={21} /> },
  { id: 'banner', label: 'Banner', icon: <Image size={21} /> },
  { id: 'library', label: 'Biblioteca', icon: <Images size={21} /> },
   { id: 'privacy', label: 'Privacidade', icon: <Shield size={21} /> },
];

/**
 * Subseções da biblioteca, na ordem em que aparecem na tela.
 *
 * A categoria de uma mídia é a pasta em que ela está dentro do bucket
 * `media`: um arquivo em `media/gifs-femininos/x.gif` cai em "Gifs
 * Femininos". As quatro são sempre renderizadas, mesmo vazias, para o
 * usuário ver o que ainda falta preencher. Ao adicionar arquivos no
 * Supabase, use exatamente um destes nomes de pasta.
 */
const LIBRARY_SECTIONS = [
  { folder: 'icones-femininos', label: 'Ícones Femininos' },
  { folder: 'gifs-femininos', label: 'Gifs Femininos' },
  { folder: 'icones-masculinos', label: 'Ícones Masculinos' },
  { folder: 'gifs-masculinos', label: 'Gifs Masculinos' },
];

// ─── Main Component ────────────────────────────────────────────────────────────
const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  // ── State ──
  const [activeSection, setActiveSection] = useState<NavSection>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = user?.user_metadata || {};
  const getBestAvatarUrl = () =>
    profile?.avatar_url || meta.avatar_url || meta.picture || meta.avatar || meta.photoURL || '';

  // Form fields
  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || meta.username || '');
  const [username, setUsername] = useState(profile?.username || meta.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [shortBio, setShortBio] = useState(profile?.short_bio || '');
  const [email] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(getBestAvatarUrl());
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(getBestAvatarUrl());
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '');
  const [previewBannerUrl, setPreviewBannerUrl] = useState(profile?.banner_url || '');
  const [usernameError, setUsernameError] = useState('');

  // Original values for diff
  const [origValues] = useState({
    displayName: profile?.display_name || profile?.username || meta.username || '',
    username: profile?.username || meta.username || '',
    bio: profile?.bio || '',
    shortBio: profile?.short_bio || '',
    avatarUrl: getBestAvatarUrl(),
    bannerUrl: profile?.banner_url || '',
  });

  // Crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // ── Library ──
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaTarget, setMediaTarget] = useState<'avatar' | 'banner'>('avatar');
  const [libraryTab, setLibraryTab] = useState(LIBRARY_SECTIONS[0].folder);
  const [selectedMediaPath, setSelectedMediaPath] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    setMediaError('');
    try {
      const items = await listMediaLibrary();
      setMedia(items);
    } catch (err: any) {
      if (err instanceof MediaPermissionError) {
        setMediaError(
          'O bucket "media" está público, mas falta a permissão de leitura na listagem. Rode a policy do arquivo supabase_media_library.sql no SQL Editor do Supabase.'
        );
      } else {
        setMediaError(err?.message || 'Não foi possível carregar a biblioteca.');
      }
    } finally {
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'library') loadMedia();
  }, [activeSection, loadMedia]);

  /**
   * Monta as abas da biblioteca com as mídias dentro de cada uma. O que
   * não estiver em nenhuma das quatro pastas cai em "Outras" para não
   * sumir da tela.
   */
  const mediaTabs = useMemo(() => {
    const tabs = LIBRARY_SECTIONS.map((s) => ({ ...s, items: [] as MediaItem[] }));
    const extras: MediaItem[] = [];
    for (const item of media) {
      const match = tabs.find((t) => t.folder === item.folder);
      if (match) match.items.push(item);
      else extras.push(item);
    }
    if (extras.length) tabs.push({ folder: 'outras', label: 'Outras', items: extras });
    return tabs;
  }, [media]);

  /**
   * Aba em foco. O fallback cobre a aba "Outras" sumindo quando a
   * busca passa a filtrar tudo o que estava fora das quatro pastas.
   */
  const activeTab = mediaTabs.find((t) => t.folder === libraryTab) ?? mediaTabs[0];

  const applyMedia = (item: MediaItem) => {
    const url = `${item.url}?t=${Date.now()}`;
    if (mediaTarget === 'avatar') {
      setAvatarUrl(url);
      setPreviewAvatarUrl(url);
    } else {
      setBannerUrl(url);
      setPreviewBannerUrl(url);
    }
    setSelectedMediaPath(item.path);
  };

  const mediaInUse = (item: MediaItem) => {
    const base = item.url;
    return previewAvatarUrl.startsWith(base) || previewBannerUrl.startsWith(base);
  };

  // Sync profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.username || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setShortBio(profile.short_bio || '');
      const best = profile.avatar_url || meta.avatar_url || meta.picture || '';
      setAvatarUrl(best);
      setPreviewAvatarUrl(best);
      setBannerUrl(profile.banner_url || '');
      setPreviewBannerUrl(profile.banner_url || '');
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    const changed =
      displayName !== origValues.displayName ||
      username !== origValues.username ||
      bio !== origValues.bio ||
      shortBio !== origValues.shortBio ||
      avatarUrl !== origValues.avatarUrl ||
      bannerUrl !== origValues.bannerUrl;
    setHasChanges(changed);
  }, [displayName, username, bio, shortBio, avatarUrl, bannerUrl]);

  // ── Handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) { setError('Arquivo muito grande. Máximo 20MB.'); return; }
    const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name);
    if (isGif) { handleUploadOriginal(file, type); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType(type);
      setCropAspect(type === 'banner' ? 2048 / 338 : 1);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadOriginal = async (file: File, type: 'avatar' | 'banner') => {
    if (!user) return;
    setUploading(true); setError('');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'gif';
      const filePath = `${user.id}/${type}.${ext}`;
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      if (type === 'avatar') { setAvatarUrl(url); setPreviewAvatarUrl(url); }
      else { setBannerUrl(url); setPreviewBannerUrl(url); }
    } catch (err: any) { setError(err.message || 'Erro ao enviar.'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; if (bannerInputRef.current) bannerInputRef.current.value = ''; }
  };

  const onCropComplete = async (croppedAreaPixels: any) => {
     if (!imageToCrop || !user) return;
     setCropOpen(false); setUploading(true); setError('');
    try {
      const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!blob) throw new Error('Falha ao processar imagem');
      const filePath = `${user.id}/${cropType}.jpg`;
      const bucket = cropType === 'avatar' ? 'avatars' : 'banners';
      const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, blob, { upsert: true });
      if (upErr) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          if (cropType === 'avatar') { setAvatarUrl(url); setPreviewAvatarUrl(url); }
          else { setBannerUrl(url); setPreviewBannerUrl(url); }
        };
        reader.readAsDataURL(blob);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        const url = `${data.publicUrl}?t=${Date.now()}`;
        if (cropType === 'avatar') { setAvatarUrl(url); setPreviewAvatarUrl(url); }
        else { setBannerUrl(url); setPreviewBannerUrl(url); }
      }
    } catch (err: any) { setError(err.message || 'Erro ao processar.'); }
    finally { setUploading(false); setImageToCrop(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (bannerInputRef.current) bannerInputRef.current.value = ''; }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameError(clean.length > 0 && clean.length < 3 ? 'Mínimo de 3 caracteres.' : '');
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true); setError('');
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
      if (cleanUsername !== profile?.username) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('username', cleanUsername).single();
        if (existing && existing.id !== user?.id) { setError('Este nome de usuário já está em uso.'); setIsSaving(false); return; }
      }
       await updateProfile({ display_name: displayName, username: cleanUsername, bio, short_bio: shortBio.trim() || null, avatar_url: avatarUrl || null, banner_url: bannerUrl || null });
      setHasChanges(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) { setError(err.message || 'Erro ao salvar.'); }
    finally { setIsSaving(false); }
  };

  const profileUrl = buildProfileUrl(username);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="ep-root">
        {/* ── Sidebar ── */}
        <aside className="ep-sidebar">
          <div className="ep-sidebar-top">
            <OneFlowLogo />
            <p className="ep-sidebar-heading">Configurações Do Perfil</p>
          </div>

          <nav className="ep-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`ep-nav-item ${activeSection === item.id ? 'ep-nav-item--active' : ''}`}
              >
                <span className="ep-nav-icon">{item.icon}</span>
                <span className="ep-nav-label">{item.label}</span>
                {activeSection === item.id && <ChevronRight size={12} className="ep-nav-chevron" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Area ── */}
        <div className="ep-main">
          {/* Header */}
          <header className="ep-header">
            <div className="ep-header-left">
              <button onClick={() => navigate(-1)} className="ep-back-btn" aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="ep-header-title">Editar Perfil</h1>
              </div>
            </div>
            <div className="ep-header-right">
              <AnimatePresence>
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="ep-save-feedback"
                  >
                    <Check size={13} /> Alterações Salvas
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.button
                whileHover={{ scale: hasChanges ? 1.02 : 1 }}
                whileTap={{ scale: hasChanges ? 0.97 : 1 }}
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`ep-save-btn ${hasChanges ? 'ep-save-btn--active' : 'ep-save-btn--idle'}`}
              >
                {isSaving ? (
                  <div className="ep-spinner ep-spinner--dark" />
                ) : null}
                Salvar Alterações
              </motion.button>
            </div>
          </header>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ep-error-bar"
              >
                <X size={14} /> {error}
                <button onClick={() => setError('')} className="ep-error-close"><X size={12} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Content ── */}
          <div className="ep-content">
            {/* ── Hidden inputs ── */}
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.gif" onChange={(e) => handleFileChange(e, 'avatar')} />
            <input ref={bannerInputRef} type="file" className="hidden" accept="image/*,.gif" onChange={(e) => handleFileChange(e, 'banner')} />

            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="ep-editor"
                >
                  {/* Section header */}
                  <div className="ep-section-header">
                    <h2 className="ep-section-title">Perfil</h2>
                    <p className="ep-section-desc">Aqui você pode editar as informações básicas do seu perfil.</p>
                  </div>

                  {/* ── Avatar ── */}
                  <div className="ep-block">
                    <p className="ep-field-label">Avatar</p>
                    <div className="ep-avatar-row">
                      <div className="ep-avatar-wrap">
                        <div
                          className="ep-avatar-circle"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {previewAvatarUrl ? (
                            <img src={previewAvatarUrl} alt="Avatar" className="ep-avatar-img" referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setPreviewAvatarUrl('')} />
                          ) : (
                            <User size={32} className="ep-avatar-placeholder" />
                          )}
                          {uploading && <div className="ep-avatar-loading"><div className="ep-spinner" /></div>}
                          <div className="ep-avatar-overlay"><Camera size={26} /></div>
                        </div>
                        <button className="ep-avatar-edit-btn" onClick={() => fileInputRef.current?.click()} aria-label="Editar avatar">
                          <Camera size={14} />
                        </button>
                      </div>
                      <div className="ep-avatar-actions">
                        <button className="ep-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                          <Upload size={15} /> Alterar Avatar
                        </button>
                        <div className="ep-avatar-hints">
                          <span>Recomendado: 512×512</span>
                          <span>Formatos: JPG, PNG, WEBP, GIF</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ep-divider" />

                  {/* ── Display Name ── */}
                  <div className="ep-block">
                    <label className="ep-field-label" htmlFor="ep-display-name">Nome De Exibição</label>
                    <p className="ep-field-desc">Este é o nome que as pessoas verão no OneFlow.</p>
                    <div className="ep-input-wrap">
                      <input
                        id="ep-display-name"
                        type="text"
                        value={displayName}
                        maxLength={32}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="ep-input"
                        placeholder="Como você quer ser chamado"
                      />
                      <span className="ep-counter">{displayName.length}/32</span>
                    </div>
                  </div>

                  {/* ── Username ── */}
                  <div className="ep-block">
                    <label className="ep-field-label" htmlFor="ep-username">Nome De Usuário</label>
                    <p className="ep-field-desc">Seu identificador único no OneFlow.</p>
                    <div className="ep-input-wrap ep-input-wrap--prefix">
                      <span className="ep-input-prefix"><AtSign size={14} /></span>
                      <input
                        id="ep-username"
                        type="text"
                        value={username}
                        maxLength={20}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className="ep-input ep-input--with-prefix"
                        placeholder="seu_usuario"
                      />
                      <span className="ep-counter">{username.length}/20</span>
                    </div>
                    {usernameError && <p className="ep-field-error">{usernameError}</p>}
                  </div>

                  {/* ── Bio ── */}
                  <div className="ep-block">
                    <label className="ep-field-label" htmlFor="ep-bio">Sobre Mim</label>
                    <p className="ep-field-desc">Conte um pouco sobre você.</p>
                    <div className="ep-textarea-wrap">
                      <textarea
                        id="ep-bio"
                        value={bio}
                        maxLength={160}
                        rows={6}
                        onChange={(e) => setBio(e.target.value)}
                        className="ep-textarea"
                        placeholder="Escreva algo sobre você..."
                      />
                      <span className="ep-counter ep-counter--textarea">{bio.length}/160</span>
                    </div>
                  </div>

                  {/* ── Bio curta (#3) ── */}
                  <div className="ep-block">
                    <label className="ep-field-label" htmlFor="ep-short-bio">Bio Curta</label>
                    <p className="ep-field-desc">Aparece no card de compartilhamento e no topo do seu perfil público.</p>
                    <div className="ep-textarea-wrap">
                      <input
                        id="ep-short-bio"
                        type="text"
                        value={shortBio}
                        maxLength={60}
                        onChange={(e) => setShortBio(e.target.value)}
                        className="ep-input"
                        placeholder="Ex: Servindo em São Paulo · Buscando profundidade"
                      />
                      <span className="ep-counter">{shortBio.length}/60</span>
                    </div>
                  </div>

                  <div className="ep-divider" />

                  {/* ── Additional Info ── */}
                  <div className="ep-block">
                    <p className="ep-field-label">Informações Adicionais</p>
                    <p className="ep-field-desc">Estas informações são privadas e não serão exibidas publicamente.</p>

                    <div className="ep-additional-grid">
                      <div className="ep-additional-field">
                        <label className="ep-field-label ep-field-label--sm" htmlFor="ep-email">E-mail</label>
                        <p className="ep-field-desc ep-field-desc--xs">Seu e-mail de contato. Não será exibido publicamente.</p>
                        <div className="ep-input-wrap ep-input-wrap--prefix">
                          <span className="ep-input-prefix"><Mail size={14} /></span>
                          <input
                            id="ep-email"
                            type="email"
                            value={email}
                            readOnly
                            className="ep-input ep-input--with-prefix ep-input--readonly"
                            placeholder="seuemail@exemplo.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'avatar' && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="ep-editor"
                >
                  <div className="ep-section-header">
                    <h2 className="ep-section-title">Avatar</h2>
                    <p className="ep-section-desc">Gerencie a foto de perfil exibida no OneFlow.</p>
                  </div>
                  <div className="ep-placeholder-section">
                    <div className="ep-placeholder-avatar">
                      {previewAvatarUrl ? (
                        <img src={previewAvatarUrl} alt="Avatar" className="ep-avatar-img" referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setPreviewAvatarUrl('')} />
                      ) : (
                        <User size={48} className="ep-avatar-placeholder" />
                      )}
                    </div>
                    <div className="ep-placeholder-actions">
                      <button className="ep-btn-primary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={15} /> Enviar Nova Foto
                      </button>
                      <button className="ep-btn-ghost" onClick={() => { setAvatarUrl(''); setPreviewAvatarUrl(''); }}>
                        Remover Avatar
                      </button>
                    </div>
                    <p className="ep-field-desc" style={{ textAlign: 'center', marginTop: '8px' }}>
                      Recomendado: 512×512px · JPG, PNG, WEBP, GIF · Máximo 20MB
                    </p>
                  </div>
                </motion.div>
              )}

              {activeSection === 'banner' && (
                <motion.div
                  key="banner"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="ep-editor"
                >
                  <div className="ep-section-header">
                    <h2 className="ep-section-title">Banner</h2>
                    <p className="ep-section-desc">Personalize a imagem de capa do seu perfil.</p>
                  </div>
                  <div className="ep-banner-preview-area">
                     <div className="ep-banner-preview-box" onClick={() => bannerInputRef.current?.click()}>
                       {previewBannerUrl ? (
                         <img src={previewBannerUrl} alt="Banner" className="ep-banner-img" />
                       ) : (
                         <div className="ep-banner-empty">
                           <><Upload size={24} /><span>Enviar Banner</span></>
                         </div>
                       )}
                       <div className="ep-banner-overlay">
                         <><Camera size={22} /><span>Alterar Banner</span></>
                       </div>
                     </div>
                     <p className="ep-field-desc" style={{ marginTop: '12px' }}>
                       Recomendado: 1500×500px · JPG, PNG, GIF · Máximo 20MB
                     </p>
                  </div>
                </motion.div>
              )}

              {activeSection === 'library' && (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="ep-editor"
                >
                  <div className="ep-section-header">
                    <h2 className="ep-section-title">Biblioteca</h2>
                    <p className="ep-section-desc">Escolha uma mídia da biblioteca para usar no seu perfil.</p>
                  </div>

                  {/* Category tabs */}
                  <div className="ep-lib-tabs" role="tablist">
                    {mediaTabs.map((tab) => (
                      <button
                        key={tab.folder}
                        role="tab"
                        aria-selected={activeTab.folder === tab.folder}
                        onClick={() => setLibraryTab(tab.folder)}
                        className={`ep-lib-tab ${activeTab.folder === tab.folder ? 'ep-lib-tab--active' : ''}`}
                      >
                        {tab.label}
                        <span className="ep-lib-tab-count">{tab.items.length}</span>
                      </button>
                    ))}
                  </div>

                  {/* Target selector */}
                  <div className="ep-block" style={{ paddingTop: 0 }}>
                    <p className="ep-field-label">Aplicar Como</p>
                    <p className="ep-field-desc">Selecione em qual parte do perfil a mídia escolhida será usada.</p>
                    <div className="ep-target-switch">
                      {([
                        { id: 'avatar' as const, label: 'Avatar', icon: <Camera size={15} /> },
                        { id: 'banner' as const, label: 'Banner', icon: <Image size={15} /> },
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setMediaTarget(opt.id)}
                          className={`ep-target-btn ${mediaTarget === opt.id ? 'ep-target-btn--active' : ''}`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Refresh */}
                  <div className="ep-lib-actions">
                    <button className="ep-btn-secondary" onClick={loadMedia} disabled={mediaLoading}>
                      {mediaLoading ? <Loader2 size={15} className="ep-lib-spin" /> : <Images size={15} />}
                      Atualizar
                    </button>
                  </div>

                  {/* States */}
                  {mediaLoading && !media.length && (
                    <div className="ep-lib-state">
                      <Loader2 size={22} className="ep-lib-spin" />
                      <p className="ep-lib-state-title">Carregando mídias...</p>
                    </div>
                  )}

                  {mediaError && (
                    <div className="ep-lib-state ep-lib-state--error">
                      <AlertTriangle size={22} />
                      <p className="ep-lib-state-title">Erro ao carregar a biblioteca</p>
                      <p className="ep-lib-state-desc">{mediaError}</p>
                      <button className="ep-btn-secondary" onClick={loadMedia}>Tentar Novamente</button>
                    </div>
                  )}

                  {!mediaLoading && !mediaError && !activeTab.items.length && (
                    <div className="ep-lib-state">
                      <Images size={26} className="ep-lib-state-icon" />
                      <p className="ep-lib-state-title">{`${activeTab.label} vazio`}</p>
                      <p className="ep-lib-state-desc">
                        {activeTab.folder === 'outras'
                          ? 'Mídias fora das quatro categorias aparecem aqui.'
                          : `Envie imagens para a pasta "${activeTab.folder}" no bucket "media" do Supabase para vê-las aqui.`}
                      </p>
                    </div>
                  )}

                  {/* Grid da aba ativa */}
                  {!!activeTab.items.length && (
                    <div className="ep-lib-grid">
                      {activeTab.items.map((item) => {
                        const isSelected = selectedMediaPath === item.path;
                        const inUse = mediaInUse(item);
                        return (
                          <button
                            key={item.path}
                            onClick={() => applyMedia(item)}
                            className={`ep-lib-item ${isSelected ? 'ep-lib-item--selected' : ''}`}
                            title={item.path}
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              className="ep-lib-item-img"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            {inUse && <span className="ep-lib-item-badge">Em uso</span>}
                            {isSelected && <span className="ep-lib-item-check"><Check size={12} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedMediaPath && (
                    <p className="ep-lib-hint">
                      <Check size={13} />
                      Mídia aplicada como {mediaTarget === 'avatar' ? 'avatar' : 'banner'}. Clique em
                      <strong> Salvar Alterações</strong> para confirmar.
                    </p>
                  )}
                </motion.div>
              )}

              {activeSection === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="ep-editor"
                >
                  <div className="ep-section-header">
                    <h2 className="ep-section-title">Privacidade</h2>
                    <p className="ep-section-desc">Controle quem pode ver seus dados no OneFlow.</p>
                  </div>
                  <div className="ep-privacy-list">
                    {[
                      { label: 'Perfil Público', desc: 'Seu perfil pode ser visto por qualquer pessoa.' },
                      { label: 'Exibir Conexões', desc: 'Outras pessoas podem ver suas redes conectadas.' },
                      { label: 'Exibir Sobre Mim', desc: 'Sua bio aparece no perfil público.' },
                    ].map((item, i) => (
                      <div key={i} className="ep-privacy-item">
                        <div>
                          <p className="ep-privacy-label">{item.label}</p>
                          <p className="ep-field-desc ep-field-desc--xs">{item.desc}</p>
                        </div>
                        <div className="ep-toggle ep-toggle--on" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Preview Panel ── */}
        <aside className="ep-preview-panel">
          <div className="ep-preview-header">
            <p className="ep-preview-label">Pré-visualização</p>
            <p className="ep-preview-desc">Veja como seu perfil ficará para outras pessoas.</p>
          </div>

          <div className="ep-profile-card">
            {/* Banner */}
            <div className="ep-card-banner">
              {previewBannerUrl ? (
                <img src={previewBannerUrl} alt="Banner" className="ep-card-banner-img" />
              ) : (
                <div className="ep-card-banner-empty" />
              )}
              <button className="ep-card-menu" aria-label="Opções"><MoreHorizontal size={14} /></button>
            </div>

            {/* Avatar */}
            <div className="ep-card-avatar-wrap">
              <div className="ep-card-avatar">
                {previewAvatarUrl ? (
                  <img src={previewAvatarUrl} alt="Avatar" className="ep-avatar-img" referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setPreviewAvatarUrl('')} />
                ) : (
                  <User size={28} className="ep-avatar-placeholder" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="ep-card-body">
              <h3 className="ep-card-name">{displayName || username || 'Seu Nome'}</h3>
              <p className="ep-card-username">@{username || 'usuario'}</p>
              {bio && <p className="ep-card-bio">{bio}</p>}

              {/* Profile link */}
              <div className="ep-card-link-block">
                <p className="ep-card-link-label">Link Do Perfil</p>
                <div className="ep-card-link-row">
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ep-card-link-url"
                    title="Abrir meu perfil público"
                  >
                    {profileUrl}
                  </a>
                  <div className="ep-card-link-actions">
                    <button onClick={copyProfileLink} className="ep-card-link-btn" aria-label="Copiar link">
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        image={imageToCrop || ''}
        aspect={cropAspect}
        isBanner={cropType === 'banner'}
        title={cropType === 'banner' ? 'Personalizar Banner' : 'Ajustar Avatar'}
        onCropComplete={onCropComplete}
      />

      {/* Styles */}
      <style>{EP_STYLES}</style>
    </PageTransition>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const EP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  /* ── Root Layout ── */
  .ep-root {
    display: flex;
    min-height: 100vh;
    background: #080808;
    color: #fff;
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Logo ── */
  .ep-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    user-select: none;
    margin-bottom: 34px;
  }
  .ep-logo-mark {
    position: relative;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
  }
  .ep-logo-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.3);
  }
  .ep-logo-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    width: 10px;
    height: 10px;
    background: #fff;
    border-radius: 50%;
  }
  .ep-logo-text {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #fff;
  }

  /* ── Sidebar ── */
  .ep-sidebar {
    width: 288px;
    flex-shrink: 0;
    background: #0d0d0d;
    border-right: 1px solid #1a1a1a;
    padding: 40px 22px 40px 26px;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
  .ep-sidebar-top {
    margin-bottom: 10px;
  }
  .ep-sidebar-heading {
    font-size: 11px;
    font-weight: 600;
    color: #b8b8b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
    padding-left: 12px;
  }

  /* ── Nav ── */
  .ep-nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ep-nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 16px 14px;
    border-radius: 13px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #b8b8b8;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    text-align: left;
    transition: background 0.15s, color 0.15s;
    position: relative;
  }
  .ep-nav-item:hover {
    background: #161616;
    color: #ccc;
  }
  .ep-nav-item--active {
    background: #1e1e1e;
    color: #fff;
  }
  .ep-nav-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .ep-nav-label {
    flex: 1;
  }
  .ep-nav-chevron {
    opacity: 0.4;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  /* ── Main ── */
  .ep-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Header ── */
  .ep-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    border-bottom: 1px solid #161616;
    background: #080808;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .ep-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ep-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #1e1e1e;
    background: #111;
    color: #b8b8b8;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .ep-back-btn:hover {
    background: #181818;
    border-color: #2a2a2a;
    color: #ccc;
  }
  .ep-header-title {
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
    margin: 0;
  }
  .ep-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ep-save-feedback {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #b8b8b8;
  }
  .ep-save-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 10px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, opacity 0.15s, box-shadow 0.15s;
    border: none;
  }
  .ep-save-btn--active {
    background: #fff;
    color: #080808;
    box-shadow: 0 0 20px rgba(255,255,255,0.08);
  }
  .ep-save-btn--active:hover {
    background: #ebebeb;
    box-shadow: 0 0 28px rgba(255,255,255,0.12);
  }
  .ep-save-btn--idle {
    background: #151515;
    color: #b8b8b8;
    border: 1px solid #1e1e1e;
    cursor: default;
  }

  /* ── Error bar ── */
  .ep-error-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 32px;
    background: #1a0d0d;
    border-bottom: 1px solid #2d1414;
    color: #d97070;
    font-size: 12px;
    font-weight: 500;
  }
  .ep-error-close {
    margin-left: auto;
    background: none;
    border: none;
    color: #d97070;
    cursor: pointer;
    display: flex;
    align-items: center;
    opacity: 0.6;
    transition: opacity 0.15s;
  }
  .ep-error-close:hover { opacity: 1; }

  /* ── Content ── */
  .ep-content {
    flex: 1;
    overflow-y: auto;
    padding: 40px 48px;
  }

  /* ── Editor panel ── */
  .ep-editor {
    max-width: 880px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .ep-section-header {
    margin-bottom: 36px;
  }
  .ep-section-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }
  .ep-section-desc {
    font-size: 14px;
    color: #b8b8b8;
    margin: 0;
    font-weight: 400;
  }

  /* ── Block ── */
  .ep-block {
    padding: 32px 0;
  }
  .ep-divider {
    height: 1px;
    background: #161616;
    margin: 0;
  }

  /* ── Labels ── */
  .ep-field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #b8b8b8;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .ep-field-label--sm { font-size: 12px; }
  .ep-field-desc {
    font-size: 13px;
    color: #4a4a4a;
    margin: 0 0 18px;
    font-weight: 400;
    line-height: 1.5;
  }
  .ep-field-desc--xs { font-size: 12px; margin-bottom: 10px; }
  .ep-field-error {
    font-size: 11px;
    color: #c97070;
    margin-top: 6px;
  }

  /* ── Avatar row ── */
  .ep-avatar-row {
    display: flex;
    align-items: center;
    gap: 34px;
  }
  .ep-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .ep-avatar-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: #111;
    border: 3px solid #1e1e1e;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
  }
  .ep-avatar-circle:hover { border-color: #333; }
  .ep-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ep-avatar-placeholder {
    color: #b8b8b8;
  }
  .ep-avatar-loading {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  .ep-avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    opacity: 0;
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
  }
  .ep-avatar-circle:hover .ep-avatar-overlay { opacity: 1; }
  .ep-avatar-edit-btn {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #222;
    border: 2px solid #111;
    color: #b8b8b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .ep-avatar-edit-btn:hover { background: #2a2a2a; color: #ccc; }
  .ep-avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ep-avatar-hints {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ep-avatar-hints span {
    font-size: 12px;
    color: #b8b8b8;
  }

  /* ── Inputs ── */
  .ep-input-wrap {
    position: relative;
  }
  .ep-input-wrap--prefix {
    display: flex;
    align-items: center;
  }
  .ep-input-prefix {
    position: absolute;
    left: 16px;
    color: #b8b8b8;
    display: flex;
    align-items: center;
    pointer-events: none;
    z-index: 1;
  }
  .ep-input {
    width: 100%;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 16px 48px 16px 18px;
    color: #fff;
    font-family: inherit;
    font-size: 16px;
    font-weight: 400;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .ep-input::placeholder { color: #b8b8b8; }
  .ep-input:hover { border-color: #2a2a2a; }
  .ep-input:focus { border-color: #3a3a3a; background: #131313; }
  .ep-input--with-prefix { padding-left: 42px; }
  .ep-input--readonly { color: #b8b8b8; cursor: default; }
  .ep-input--readonly:focus { border-color: #222; background: #111; }
  .ep-counter {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #b8b8b8;
    font-weight: 500;
    pointer-events: none;
  }

  /* ── Textarea ── */
  .ep-textarea-wrap {
    position: relative;
  }
  .ep-textarea {
    width: 100%;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 18px 18px 36px;
    color: #fff;
    font-family: inherit;
    font-size: 16px;
    font-weight: 400;
    outline: none;
    resize: none;
    line-height: 1.6;
    transition: border-color 0.15s, background 0.15s;
    box-sizing: border-box;
  }
  .ep-textarea::placeholder { color: #b8b8b8; }
  .ep-textarea:hover { border-color: #2a2a2a; }
  .ep-textarea:focus { border-color: #3a3a3a; background: #131313; }
  .ep-counter--textarea {
    position: absolute;
    bottom: 10px;
    right: 12px;
    top: auto;
    transform: none;
  }

  /* ── Additional grid ── */
  .ep-additional-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
  }

  /* ── Buttons ── */
  .ep-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 12px;
    background: #fff;
    color: #080808;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }
  .ep-btn-primary:hover { background: #ebebeb; }
  .ep-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 12px;
    background: #141414;
    color: #ccc;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid #222;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .ep-btn-secondary:hover { background: #1a1a1a; border-color: #2a2a2a; color: #fff; }
  .ep-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 12px;
    background: transparent;
    color: #b8b8b8;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid #1a1a1a;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .ep-btn-ghost:hover { color: #999; border-color: #252525; }

  /* ── Spinner ── */
  .ep-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ep-spin 0.6s linear infinite;
    flex-shrink: 0;
  }
  .ep-spinner--dark {
    border-color: rgba(0,0,0,0.2);
    border-top-color: #080808;
  }
  @keyframes ep-spin { to { transform: rotate(360deg); } }

  /* ── Placeholder sections ── */
  .ep-placeholder-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 56px 0;
  }
  .ep-placeholder-avatar {
    width: 184px;
    height: 184px;
    border-radius: 50%;
    background: #111;
    border: 3px solid #222;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ep-placeholder-actions {
    display: flex;
    gap: 12px;
  }

  /* ── Banner section ── */
  .ep-banner-preview-area {}
  .ep-banner-preview-box {
    width: 100%;
    height: clamp(300px, 46vh, 440px);
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    border: 1px solid #1e1e1e;
    background: #0f0f0f;
  }
  .ep-banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ep-banner-empty {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #b8b8b8;
    font-size: 12px;
    font-weight: 500;
  }
  .ep-banner-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    opacity: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    transition: opacity 0.15s;
    backdrop-filter: blur(2px);
  }
  .ep-banner-preview-box:hover .ep-banner-overlay { opacity: 1; }

  /* ── Coming soon ── */
  .ep-coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 56px 0;
    text-align: center;
  }
  .ep-coming-icon { color: #2a2a2a; }
  .ep-coming-title { font-size: 15px; font-weight: 600; color: #b8b8b8; }
  .ep-coming-desc { font-size: 12px; color: #b8b8b8; max-width: 280px; line-height: 1.5; }

  /* ── Connections ── */
  .ep-connections-list { display: flex; flex-direction: column; gap: 4px; }
  .ep-connection-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    background: #0f0f0f;
    border: 1px solid #1a1a1a;
  }
  .ep-connection-icon { color: #b8b8b8; display: flex; align-items: center; flex-shrink: 0; }
  .ep-connection-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
  .ep-connection-platform { font-size: 13px; font-weight: 500; color: #ccc; }
  .ep-connection-handle { font-size: 11px; color: #b8b8b8; }
  .ep-connection-remove {
    background: none;
    border: none;
    color: #b8b8b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .ep-connection-remove:hover { color: #b8b8b8; }

  /* ── Library ── */
  .ep-target-switch {
    display: flex;
    gap: 8px;
  }
  .ep-target-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 10px;
    background: #111;
    border: 1px solid #222;
    color: #b8b8b8;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .ep-target-btn:hover { background: #161616; color: #ccc; }
  .ep-target-btn--active {
    background: #fff;
    border-color: #fff;
    color: #080808;
  }
  .ep-target-btn--active:hover { background: #ebebeb; color: #080808; }

  .ep-lib-actions {
    display: flex;
    align-items: center;
    margin-bottom: 28px;
  }

  .ep-lib-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 64px 24px;
    text-align: center;
    border: 1px dashed #1e1e1e;
    border-radius: 16px;
    background: #0c0c0c;
  }
  .ep-lib-state--error { border-color: #2d1414; background: #120b0b; color: #d97070; }
  .ep-lib-state-icon { color: #2a2a2a; }
  .ep-lib-state-title { font-size: 15px; font-weight: 600; color: #b8b8b8; margin: 0; }
  .ep-lib-state-desc { font-size: 12px; color: #4a4a4a; margin: 0; max-width: 320px; line-height: 1.5; }
  .ep-lib-spin { animation: ep-spin 0.8s linear infinite; }

  .ep-lib-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 22px;
  }
  .ep-lib-tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 10px;
    background: #111;
    border: 1px solid #222;
    color: #b8b8b8;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .ep-lib-tab:hover { background: #161616; color: #ccc; }
  .ep-lib-tab--active {
    background: #fff;
    border-color: #fff;
    color: #080808;
  }
  .ep-lib-tab--active:hover { background: #ebebeb; color: #080808; }
  .ep-lib-tab-count {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 999px;
    background: #2a2a2a;
    color: #cfcfcf;
  }
  .ep-lib-tab--active .ep-lib-tab-count { background: #080808; color: #fff; }
  .ep-lib-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 14px;
  }
  .ep-lib-item {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 13px;
    background: #0f0f0f;
    border: 1px solid #1a1a1a;
    cursor: pointer;
    overflow: hidden;
    font-family: inherit;
    text-align: left;
    transition: border-color 0.15s, background 0.15s, transform 0.15s;
  }
  .ep-lib-item:hover {
    border-color: #2e2e2e;
    background: #131313;
    transform: translateY(-2px);
  }
  .ep-lib-item--selected {
    border-color: #fff;
    background: #141414;
  }
  .ep-lib-item-img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
    background: #0a0a0a;
  }
  .ep-lib-item-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #080808;
    background: #fff;
    border-radius: 4px;
    padding: 2px 5px;
  }
  .ep-lib-item-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    color: #080808;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ep-lib-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 28px;
    font-size: 12px;
    color: #b8b8b8;
  }
  .ep-lib-hint strong { color: #fff; font-weight: 600; }

  /* ── Privacy ── */
  .ep-privacy-list { display: flex; flex-direction: column; gap: 10px; }
  .ep-privacy-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 24px;
    border-radius: 14px;
    background: #0f0f0f;
    border: 1px solid #1a1a1a;
  }
  .ep-privacy-label { font-size: 15px; font-weight: 500; color: #ccc; margin-bottom: 4px; }
  .ep-toggle {
    width: 48px;
    height: 28px;
    border-radius: 14px;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
  }
  .ep-toggle::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
  }
  .ep-toggle--on { background: #2e2e2e; }
  .ep-toggle--on::after { transform: translateX(20px); }

  /* ── Preview Panel ── */
  .ep-preview-panel {
    width: 520px;
    flex-shrink: 0;
    background: #0a0a0a;
    border-left: 1px solid #161616;
    padding: 28px 16px;
    overflow-y: auto;
    height: 100vh;
    position: sticky;
    top: 0;
  }
  .ep-preview-header { margin-bottom: 20px; padding: 0 4px; }
  .ep-preview-label {
    font-size: 11px;
    font-weight: 600;
    color: #b8b8b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  .ep-preview-desc { font-size: 12px; color: #b8b8b8; line-height: 1.5; }

  /* ── Profile Card ── */
  .ep-profile-card {
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-radius: 16px;
    overflow: hidden;
  }
  .ep-card-banner {
    position: relative;
    height: 200px;
    background: #111;
    overflow: hidden;
  }
  .ep-card-banner-img { width: 100%; height: 100%; object-fit: cover; }
  .ep-card-banner-empty { width: 100%; height: 100%; background: linear-gradient(135deg, #111 0%, #0f0f0f 100%); }
  .ep-card-menu {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.06);
    color: #b8b8b8;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  .ep-card-avatar-wrap {
    padding: 0 24px;
    margin-top: -55px;
    position: relative;
    z-index: 1;
  }
  .ep-card-avatar {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: #111;
    border: 5px solid #0d0d0d;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ep-card-body {
    padding: 14px 24px 24px;
  }
  .ep-card-name {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    margin: 0 0 4px;
  }
  .ep-card-username {
    font-size: 14px;
    color: #b8b8b8;
    margin: 0 0 14px;
  }
  .ep-card-bio {
    font-size: 14px;
    color: #b8b8b8;
    line-height: 1.6;
    margin: 0 0 22px;
    word-break: break-word;
  }

  /* ── Card Connections ── */
  .ep-card-connections { margin-bottom: 22px; }
  .ep-card-connections-label {
    font-size: 11px;
    font-weight: 600;
    color: #b8b8b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .ep-card-connection {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #141414;
  }
  .ep-card-connection:last-child { border-bottom: none; }
  .ep-card-conn-icon { color: #b8b8b8; display: flex; align-items: center; flex-shrink: 0; }
  .ep-card-conn-platform { font-size: 13px; font-weight: 500; color: #999; margin-right: 8px; }
  .ep-card-conn-handle { font-size: 12px; color: #b8b8b8; }

  /* ── Card Link ── */
  .ep-card-link-block {
    border-top: 1px solid #161616;
    padding-top: 16px;
    margin-top: 4px;
  }
  .ep-card-link-label {
    font-size: 11px;
    font-weight: 600;
    color: #b8b8b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .ep-card-link-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0f0f0f;
    border: 1px solid #1a1a1a;
    border-radius: 10px;
    padding: 11px 14px;
  }
  .ep-card-link-url {
    flex: 1;
    font-size: 12px;
    color: #b8b8b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    transition: color 0.15s;
  }
  .ep-card-link-url:hover { color: #bbb; }
  .ep-card-link-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .ep-card-link-btn {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: #161616;
    border: 1px solid #1e1e1e;
    color: #b8b8b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    text-decoration: none;
  }
  .ep-card-link-btn:hover { background: #1e1e1e; color: #ccc; }

  /* ── Responsive ── */
  @media (max-width: 1400px) {
    .ep-preview-panel { display: none; }
    .ep-sidebar { width: 76px; padding: 30px 10px; }
    .ep-sidebar-top { display: flex; flex-direction: column; align-items: center; }
    .ep-logo-text { display: none; }
    .ep-sidebar-heading { display: none; }
    .ep-nav-label { display: none; }
    .ep-nav-chevron { display: none; }
    .ep-nav-item { justify-content: center; padding: 14px 10px; }
  }
  @media (max-width: 640px) {
    .ep-sidebar { display: none; }
    .ep-content { padding: 20px 16px; }
    .ep-header { padding: 16px; }
    .ep-header-title { font-size: 15px; }
    .ep-save-btn { padding: 8px 14px; font-size: 12px; }
    .ep-lib-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  }
`;

export default EditProfile;
