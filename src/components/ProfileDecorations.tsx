import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export interface Decoration {
  id: string;
  url: string;
  name: string;
}

interface ProfileDecorationsProps {
  decorations: Decoration[];
  onSelectDecoration: (url: string) => void;
  error?: string;
  loading?: boolean;
}

const ProfileDecorations: React.FC<ProfileDecorationsProps> = ({ 
    decorations, 
    onSelectDecoration,
    error,
    loading 
}) => {
  if (loading) {
      return (
          <div className="flex items-center justify-center p-6 text-white/50 bg-[#111214] rounded-xl border border-white/5 animate-pulse">
              <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-[#5865f2] rounded-full animate-spin" />
                  <span className="text-sm font-medium">Buscando do Discord...</span>
              </div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 mt-4">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-500">Erro na Integração</h4>
                  <p className="text-xs text-red-400/80 leading-relaxed">{error}</p>
              </div>
          </div>
      );
  }

  if (!decorations || decorations.length === 0) {
      return null;
  }

  return (
    <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-[#5865f2]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acervo de Molduras do Discord</h3>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {decorations.map((decoration) => (
          <button 
              key={decoration.id} 
              className="group flex flex-col items-center gap-3 p-3 rounded-xl bg-[#111214] border border-white/5 hover:border-[#5865f2]/50 hover:bg-[#5865f2]/5 transition-all text-left"
              onClick={() => onSelectDecoration(decoration.url)}
          >
              {decoration.url ? (
                  <img 
                    src={decoration.url} 
                    alt={decoration.name}
                    className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
              ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-[10px] text-center px-2">Sem Imagem</div>
              )}
              <span className="text-[11px] font-bold text-white/60 group-hover:text-white truncate w-full text-center">
                  {decoration.name}
              </span>
          </button>
          ))}
      </div>
    </div>
  );
};

export default ProfileDecorations;
