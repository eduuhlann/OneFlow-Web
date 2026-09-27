import React, { useState } from 'react';
import { AlertCircle, Shield, Trash2, Globe, UserCheck } from 'lucide-react';
import { IconBrandDiscord } from '@tabler/icons-react';
import { supabase } from '../../services/supabase';
import { translateAuthError } from '../../services/authErrors';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { isMissingFunctionError } from '../../lib/supabaseErrors';

const SecurityView: React.FC = () => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsSaving(true);
        setError('');
        try {
            const { error: rpcError } = await supabase.rpc('delete_account');

            if (rpcError) {
                if (isMissingFunctionError(rpcError)) {
                    // Migration ainda não aplicada: não apaga nada,
                    // apenas encerra a sessão com segurança.
                    setNeedsMigration(true);
                    setShowDeleteConfirm(false);
                    return;
                }
                throw rpcError;
            }

            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err: any) {
            setError(translateAuthError(err?.message || 'Não foi possível excluir a conta.'));
        } finally {
            setIsSaving(false);
        }
    };

    const provider = user?.app_metadata.provider;

    return (
        <div className="space-y-12">
            <div>
                <span className="text-[10px] font-bold tracking-[0.5em] text-white/ uppercase block mb-2">Privacidade & Acesso</span>
                <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Segurança</h2>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3 text-sm font-bold">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="space-y-6">
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/ border border-white/5">
                            {provider === 'discord' ? <IconBrandDiscord size={40} /> : <UserCheck size={40} />}
                        </div>
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-white/ uppercase block mb-1">Método de Acesso</span>
                            <h4 className="text-2xl font-black italic tracking-tighter uppercase">
                                {provider || 'OAuth'} Ativo
                            </h4>
                        </div>
                    </div>

                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                        <p className="text-white/ text-xs font-medium leading-relaxed">
                            Sua conta está vinculada ao seu perfil do <span className="text-white font-bold capitalize">{provider}</span>. 
                            O gerenciamento de senha e segurança de dois fatores é feito diretamente através da sua conta {provider}.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-white/ uppercase">
                            <Globe size={10} /> Conectado via provedor externo
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/ group-hover:text-white transition-colors">
                        <Shield size={24} />
                    </div>
                    <div>
                        <span className="text-[8px] font-bold tracking-[0.3em] text-white/ uppercase block mb-1">Proteção OneFlow</span>
                        <h5 className="font-black italic tracking-tighter text-white/">Sua conta é protegida por criptografia de ponta a ponta.</h5>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] font-bold text-red-500 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all group"
                    >
                        <Trash2 size={20} className="text-red-500/40 group-hover:text-red-500 transition-colors" />
                        Excluir Minha Conta
                    </button>
                    <p className="mt-4 text-center text-[9px] font-bold tracking-[0.2em] text-white/ uppercase px-12 leading-relaxed">
                        AVISO: ESTA AÇÃO É IRREVERSÍVEL E TODOS OS SEUS DADOS SERÃO PERDIDOS.
                    </p>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Excluir sua conta"
                message={
                    <>
                        Isso remove permanentemente perfil, grupos, conversas e registros de leitura do OneFlow.
                        <br />
                        <span className="font-black text-red-400/80">Esta ação não pode ser desfeita.</span>
                        {needsMigration && (
                            <span className="mt-3 block text-amber-200/80">
                                A função de exclusão ainda não está ativa no banco. Rode a migration <code>supabase_migration_v2_social.sql</code> no Supabase para habilitar.
                            </span>
                        )}
                    </>
                }
                confirmLabel="Excluir definitivamente"
                requiredText="EXCLUIR"
                inputLabel="Digite EXCLUIR para confirmar"
                inputPlaceholder="EXCLUIR"
                danger
                onConfirm={handleDeleteAccount}
                onCancel={() => { setShowDeleteConfirm(false); setError(''); }}
            />
        </div>
    );
};

export default SecurityView;
