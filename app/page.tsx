"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro('');
    setCarregando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMensagemErro(
            error.message.includes('Invalid login credentials')
                ? 'E-mail ou senha incorretos.'
                : error.message
        );
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setMensagemErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
      <main className="relative min-h-screen bg-[#030303] flex items-center justify-center p-6 font-sans overflow-hidden antialiased">

        {/* ── FUNDO ── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Grid sutil */}
          <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
          />
          {/* Glow central */}
          <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(234,88,12,0.07), transparent)' }}
          />
          {/* Glow superior esquerdo */}
          <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-orange-600/[0.06] rounded-full blur-[140px]" />
          {/* Glow inferior direito */}
          <div className="absolute -bottom-60 -right-60 w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-[120px]" />
        </div>

        {/* ── CARD ── */}
        <div className="relative w-full max-w-sm z-10">

          {/* Brilho atrás do card */}
          <div className="absolute -inset-px rounded-[44px] bg-gradient-to-b from-orange-500/10 to-transparent blur-sm" />

          <div className="relative w-full bg-[#09090b]/90 border border-white/[0.06] rounded-[40px] shadow-2xl backdrop-blur-2xl overflow-hidden">

            {/* Linha de acabamento topo */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

            <div className="p-10">

              {/* ── LOGO / MARCA ── */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative mb-5">
                  {/* Glow atrás do logo */}
                  <div className="absolute inset-0 bg-orange-500/30 rounded-[22px] blur-xl scale-110" />
                  <div className="relative w-14 h-14 bg-gradient-to-b from-orange-400 to-orange-600 rounded-[20px] flex items-center justify-center shadow-xl border border-orange-400/30">
                    <span className="text-xl font-black italic text-black tracking-tighter select-none">GR</span>
                  </div>
                </div>

                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none mb-1.5">
                  GR{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  Cluster
                </span>
                </h1>
                <p className="text-[9px] text-slate-600 uppercase tracking-[5px] font-bold">
                  Acesso Restrito
                </p>
              </div>

              {/* ── ERRO ── */}
              {mensagemErro && (
                  <div className="mb-6 flex items-start gap-2.5 bg-red-500/[0.06] border border-red-500/20 p-3.5 rounded-2xl">
                    <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3M8 11v.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide leading-relaxed">
                      {mensagemErro}
                    </p>
                  </div>
              )}

              {/* ── FORMULÁRIO ── */}
              <form onSubmit={handleLogin} className="space-y-4">

                {/* E-mail */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500/70 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="12" height="9" rx="2" />
                        <path d="M2 6l6 4 6-4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                        type="email"
                        placeholder="nome@empresa.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 pl-10 pr-4 py-3.5 rounded-2xl outline-none text-white text-sm font-medium transition-all placeholder-slate-700 disabled:opacity-40"
                        required
                        disabled={carregando}
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                    Chave de Acesso
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500/70 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="7" width="10" height="7" rx="2" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                        type={mostrarSenha ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 pl-10 pr-11 py-3.5 rounded-2xl outline-none text-white text-sm transition-all placeholder-slate-700 disabled:opacity-40"
                        required
                        disabled={carregando}
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarSenha(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                        tabIndex={-1}
                    >
                      {mostrarSenha ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
                            <circle cx="8" cy="8" r="1.5" />
                            <path d="M3 3l10 10" strokeLinecap="round" />
                          </svg>
                      ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
                            <circle cx="8" cy="8" r="1.5" />
                          </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão */}
                <div className="pt-2">
                  <button
                      type="submit"
                      disabled={carregando}
                      className="relative w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden group"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    {/* Brilho no hover */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2">
                      {carregando ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                            Verificando...
                          </>
                      ) : (
                          <>
                            Entrar no Cluster
                            <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 5h6M5 2l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                      )}
                    </div>
                  </button>
                </div>

              </form>

            </div>

            {/* ── RODAPÉ DO CARD ── */}
            <div className="border-t border-white/[0.04] px-10 py-4 flex items-center justify-center">
              <p className="text-[8px] uppercase tracking-[3px] text-slate-700 font-bold">
                Sistema Interno · Acesso Restrito
              </p>
            </div>

          </div>
        </div>
      </main>
  );
}