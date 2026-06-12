"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Ferramenta {
    id: string;
    nome: string;
    status: string;
}

export default function ListaFerramentasPage() {
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos'); // todos, disponivel, ocupado

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarInventario() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('ferramentas')
                .select('id, nome, status')
                .order('nome');

            if (error) throw error;
            if (data) setFerramentas(data as Ferramenta[]);
        } catch (err) {
            console.error("Erro ao carregar inventário de ferramentas:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarInventario();
    }, []);

    // Lógica O(1) e processamento em memória memoizado para filtros rápidos no MacBook Air
    const ferramentasFiltradas = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        return ferramentas.filter(f => {
            const batePesquisa = f.nome.toLowerCase().includes(termo) || f.id.includes(termo);
            const bateStatus = filtroStatus === 'todos' || f.status === filtroStatus;
            return batePesquisa && bateStatus;
        });
    }, [ferramentas, pesquisa, filtroStatus]);

    // Métricas do topo da página
    const metricas = useMemo(() => {
        const total = ferramentas.length;
        const disponiveis = ferramentas.filter(f => f.status === 'disponivel').length;
        const ocupadas = ferramentas.filter(f => f.status === 'ocupado').length;
        return { total, disponiveis, ocupadas };
    }, [ferramentas]);

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* RENDER PLANO DE FUNDO */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.012]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* CABEÇALHO */}
                <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/[0.04] pb-6 px-2">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] mb-1.5 block hover:opacity-70 transition-all">
                            ← Menu Principal
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Inventário Geral de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Ativos & Ferramental</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">
                            Listagem estática de ferramentas e monitorização de disponibilidade da oficina
                        </p>
                    </div>

                    {/* BARRA DE PESQUISA E FILTROS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou ID de 4 dígitos..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-orange-500/40 px-4 py-2.5 rounded-xl text-white text-xs font-bold outline-none w-full sm:w-72 uppercase transition-all"
                        />

                        <div className="flex items-center bg-black border border-white/[0.06] p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setFiltroStatus('todos')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroStatus === 'todos' ? 'bg-orange-600 text-black' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFiltroStatus('disponivel')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroStatus === 'disponivel' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Em Bancada
                            </button>
                            <button
                                onClick={() => setFiltroStatus('ocupado')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroStatus === 'ocupado' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Em Uso
                            </button>
                        </div>
                    </div>
                </header>

                {/* METRICAS DO TOPO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Total Catalogado</p>
                        <p className="text-2xl font-mono font-black mt-1 text-slate-200">{metricas.total}</p>
                    </div>
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Disponível em Bancada</p>
                        <p className="text-2xl font-mono font-black mt-1 text-emerald-400">{metricas.disponiveis}</p>
                    </div>
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-500">Retirado / Em Uso</p>
                        <p className="text-2xl font-mono font-black mt-1 text-amber-400">{metricas.ocupadas}</p>
                    </div>
                </div>

                {/* GRID DE COMPONENTES */}
                <div className="relative bg-[#09090b]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 min-h-[400px]">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

                    {carregando ? (
                        <div className="text-center py-32 text-[9px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                            Consultando registros no cluster...
                        </div>
                    ) : ferramentasFiltradas.length === 0 ? (
                        <div className="py-32 text-center">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Nenhuma ferramenta encontrada com os filtros atuais.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 pl-4 w-32">Código de Barras</th>
                                    <th className="pb-3">Descrição da Ferramenta</th>
                                    <th className="pb-3 text-right pr-4 w-40">Status Operacional</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.01]">
                                {ferramentasFiltradas.map(f => (
                                    <tr key={f.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="py-3.5 pl-4 font-mono font-black text-sm text-orange-500/90 tracking-widest">
                                            {f.id}
                                        </td>
                                        <td className="py-3.5 font-black text-slate-200 uppercase tracking-tight text-xs">
                                            {f.nome}
                                        </td>
                                        <td className="py-3.5 text-right pr-4">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block text-center min-w-[100px] ${
                                                    f.status === 'disponivel'
                                                        ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                                                        : 'bg-amber-500/5 text-amber-400 border border-amber-500/10'
                                                }`}>
                                                    {f.status === 'disponivel' ? '● Em Bancada' : '⚙️ Em Uso'}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* RODAPÉ */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Módulo Inventário Dinâmico v3.2</div>
            </footer>
        </main>
    );
}