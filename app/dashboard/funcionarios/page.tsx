"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
    data_cadastro: string;
}

export default function CentralFuncionariosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [erroRequest, setErroRequest] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarFuncionarios() {
        setCarregando(true);
        setErroRequest(null);
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*')
                .order('nome', { ascending: true });

            if (error) {
                setErroRequest(error.message);
                console.error("Erro Supabase:", error);
                return;
            }

            if (data) {
                setFuncionarios(data as Funcionario[]);
            }
        } catch (err: any) {
            setErroRequest(err?.message || "Falha ao conectar com o banco.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarFuncionarios();
    }, []);

    const filtrados = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        if (!termo) return funcionarios;
        return funcionarios.filter(f => {
            const nomeCompleto = `${f.nome || ''} ${f.sobrenome || ''}`.toLowerCase();
            const idCracha = String(f.id || '').toLowerCase();
            const cargoFunc = String(f.cargo || '').toLowerCase();
            return nomeCompleto.includes(termo) || idCracha.includes(termo) || cargoFunc.includes(termo);
        });
    }, [funcionarios, pesquisa]);

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* ── FUNDO TECNOLÓGICO DO LOGIN ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Grid sutil */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
                {/* Glow inferior central */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(234,88,12,0.05), transparent)' }}
                />
                {/* Glow superior esquerdo */}
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-600/[0.04] rounded-full blur-[150px]" />
            </div>

            {/* CONTEÚDO DA CENTRAL EXPANDIDO */}
            <div className="relative z-10 w-full flex-1 flex flex-col gap-8">

                {/* CABEÇALHO */}
                <header className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/[0.04] pb-6 px-2">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] mb-1.5 block hover:opacity-70 transition-all">
                            ← Voltar ao Terminal
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Equipe</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 font-bold">
                            Gerenciamento de cadastros, crachás ópticos e acessos do cluster
                        </p>
                    </div>

                    {/* BOTÕES COM DESIGN PREMIUM */}
                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={carregarFuncionarios}
                            className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-slate-300 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            🔄 Sincronizar
                        </button>

                        <Link href="/dashboard/funcionarios/crachas" className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-slate-300 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center">
                            💳 Crachás
                        </Link>

                        <Link
                            href="/dashboard/funcionarios/cadastro"
                            className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-black transition-all active:scale-95 text-center flex items-center justify-center overflow-hidden relative group"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            ➕ Cadastrar Colaborador
                        </Link>
                    </div>
                </header>

                {/* MENSAGEM DE ERRO TRATADA */}
                {erroRequest && (
                    <div className="mx-2 flex items-start gap-2.5 bg-red-500/[0.05] border border-red-500/20 p-4 rounded-2xl text-xs text-red-400 font-mono">
                        <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="8" cy="8" r="6" />
                            <path d="M8 5v3M8 11v.5" strokeLinecap="round" />
                        </svg>
                        <span className="uppercase font-black text-[10px] tracking-wide">Falha no Cluster: {erroRequest}</span>
                    </div>
                )}

                {/* BARRA DE PESQUISA ESTILO INPUT DO LOGIN */}
                <div className="w-full max-w-md px-2">
                    <div className="space-y-1.5">
                        <label className="block text-[8px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                            Filtro de Varredura
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500/70 transition-colors">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14 14l-3.5-3.5m0 0A5 5 0 104 4a5 5 0 006.5 6.5z" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Filtrar por nome, cargo ou ID do crachá..."
                                value={pesquisa}
                                onChange={e => setPesquisa(e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 pl-11 pr-4 py-3 rounded-xl outline-none text-white text-xs font-medium transition-all placeholder-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* PAINEL / TABELA ESTILO CARD DE LOGIN */}
                <section className="mx-2 relative rounded-[32px] overflow-hidden bg-[#09090b]/80 border border-white/[0.06] shadow-2xl backdrop-blur-2xl">
                    {/* Linha de acabamento topo */}
                    <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

                    {carregando ? (
                        <div className="text-center py-24 flex flex-col items-center justify-center gap-3">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                                Sincronizando com o cluster...
                            </span>
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Nenhum operador localizado na varredura.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-6 md:p-8">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 w-1/4 pl-2 tracking-[2px]">ID (Crachá)</th>
                                    <th className="pb-3 w-2/4 tracking-[2px]">Colaborador / Operador</th>
                                    <th className="pb-3 w-1/4 tracking-[2px]">Cargo / Função</th>
                                    <th className="pb-3 text-right pr-2 tracking-[2px]">Data Admissão</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.015]">
                                {filtrados.map(f => (
                                    <tr key={f.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="py-4 font-mono font-black text-orange-400 pl-2 tracking-widest text-xs group-hover:text-orange-300 transition-colors">
                                            {f.id}
                                        </td>
                                        <td className="py-4 font-black text-slate-200 uppercase tracking-tight text-xs group-hover:text-white transition-colors">
                                            {f.nome} {f.sobrenome}
                                        </td>
                                        <td className="py-4 text-slate-400 font-bold uppercase text-[10px] tracking-wide">
                                            {f.cargo}
                                        </td>
                                        <td className="py-4 text-right pr-2 font-mono text-slate-500 font-bold text-[11px]">
                                            {f.data_cadastro ? new Date(f.data_cadastro).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* RODAPÉ DO PAINEL */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left px-2">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Módulo de Varredura Operacional v2.5</div>
            </footer>
        </main>
    );
}