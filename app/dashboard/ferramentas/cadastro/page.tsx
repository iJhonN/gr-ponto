"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CadastroFerramentaPage() {
    const [id, setId] = useState('');
    const [nome, setNome] = useState('');
    const [status, setStatus] = useState('disponivel');
    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const idInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();

        const codigoLimpo = id.trim();
        const nomeLimpo = nome.trim().toUpperCase();

        if (!codigoLimpo || !nomeLimpo) {
            setStatusFeed({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            // 1. Verifica se o ID de 4 dígitos já existe para evitar erro de constraint no Postgres
            const { data: existe, error: errCheck } = await supabase
                .from('ferramentas')
                .select('id')
                .eq('id', codigoLimpo)
                .maybeSingle();

            if (existe) {
                throw new Error(`O código [${codigoLimpo}] já está sendo utilizado por outra ferramenta.`);
            }

            // 2. Insere estritamente as informações de ferramenta definidas na regra de negócio
            const { error: errInsert } = await supabase
                .from('ferramentas')
                .insert([{
                    id: codigoLimpo,
                    nome: nomeLimpo,
                    status: status
                }]);

            if (errInsert) throw errInsert;

            setStatusFeed({
                tipo: 'sucesso',
                texto: `📦 ${nomeLimpo} (CÓD: ${codigoLimpo}) cadastrada com sucesso no inventário!`
            });

            // Reseta o formulário
            setId('');
            setNome('');
            setStatus('disponivel');

            // Devolve o foco para o primeiro input para permitir cadastros em lote rápidos
            idInputRef.current?.focus();

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Falha ao registrar ferramenta.' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* BACKGROUND LINES */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/[0.02] rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                {/* BOTÃO DE VOLTAR */}
                <div className="w-full max-w-md mb-4 text-left">
                    <Link href="/dashboard" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] hover:opacity-70 transition-all">
                        ← Menu Principal
                    </Link>
                </div>

                {/* CARD DE CADASTRO */}
                <div className="w-full max-w-md relative bg-[#09090b]/90 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

                    <div className="text-center mb-8">
                        <span className="text-3xl block mb-2">📥</span>
                        <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">
                            Inclusão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Novos Ativos</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">
                            Almoxarifado Estático • GR Autopeças
                        </p>
                    </div>

                    {statusFeed.texto && (
                        <div className={`mb-6 p-4 rounded-xl border text-[10px] font-black uppercase tracking-wide text-center leading-relaxed ${
                            statusFeed.tipo === 'sucesso'
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.02)]'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            {statusFeed.texto}
                        </div>
                    )}

                    <form onSubmit={handleCadastro} className="space-y-5">

                        <div className="space-y-1.5">
                            <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">
                                Código Identificador (4 Dígitos / Código de Barras)
                            </label>
                            <input
                                ref={idInputRef}
                                type="text"
                                placeholder="Ex: 8063"
                                value={id}
                                onChange={e => setId(e.target.value)}
                                className="w-full bg-black/60 border border-white/[0.06] focus:border-orange-500/50 px-4 py-3.5 rounded-xl outline-none text-orange-400 text-sm font-mono font-black tracking-widest placeholder-slate-800 uppercase"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">
                                Descrição / Nome da Ferramenta
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: TORQUÍMETRO DE ESTALO 1/2"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full bg-black/60 border border-white/[0.06] focus:border-orange-500/50 px-4 py-3.5 rounded-xl outline-none text-white text-xs font-bold uppercase tracking-wide placeholder-slate-800"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">
                                Status Operacional Inicial
                            </label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="w-full bg-black/60 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3.5 rounded-xl outline-none text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                required
                            >
                                <option value="disponivel" className="bg-[#09090b]">● Em Bancada (Disponível)</option>
                                <option value="ocupado" className="bg-[#09090b]">⚙️ Em Uso (Ocupado)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {enviando ? "Salvando Ativo..." : "Cadastrar Ferramenta (Enter)"}
                        </button>
                    </form>
                </div>

            </div>

            {/* LOWER STATS BAR */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Módulo de Inventário Estático v3.2</div>
            </footer>
        </main>
    );
}