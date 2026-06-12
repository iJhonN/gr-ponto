"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Movimentacao {
    id: string;
    ferramenta_id: string;
    funcionario_id: string;
    data_retirada: string;
    data_devolucao: string | null;
    status_movimentacao: string;
    ferramentas: { nome: string } | null;
    funcionarios: { nome: string; sobrenome: string } | null;
}

export default function HistoricoFerramentasPage() {
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroMovimentacao, setFiltroMovimentacao] = useState('todos'); // todos, aberto, devolvido

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarHistorico() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('ferramenta_movimentacoes')
                .select('*, ferramentas(nome), funcionarios(nome, sobrenome)')
                .order('data_retirada', { ascending: false });

            if (error) throw error;
            if (data) setMovimentacoes(data as unknown as Movimentacao[]);
        } catch (err) {
            console.error("Erro ao carregar histórico de movimentações:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarHistorico();
    }, []);

    // Filtros rápidos executados em memória no seu Mac Air
    const movimentacoesFiltradas = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        return movimentacoes.filter(m => {
            const nomeFerramenta = m.ferramentas?.nome.toLowerCase() || '';
            const nomeFuncionario = m.funcionarios ? `${m.funcionarios.nome} ${m.funcionarios.sobrenome}`.toLowerCase() : '';

            const batePesquisa =
                nomeFerramenta.includes(termo) ||
                m.ferramenta_id.includes(termo) ||
                m.funcionario_id.includes(termo) ||
                nomeFuncionario.includes(termo);

            const bateStatus = filtroMovimentacao === 'todos' || m.status_movimentacao === filtroMovimentacao;

            return batePesquisa && bateStatus;
        });
    }, [movimentacoes, pesquisa, filtroMovimentacao]);

    // Contadores analíticos para o topo do histórico
    const relatorioRapido = useMemo(() => {
        const pendentes = movimentacoes.filter(m => m.status_movimentacao === 'aberto').length;
        const concluídas = movimentacoes.filter(m => m.status_movimentacao === 'devolvido').length;
        return { pendentes, concluídas, total: movimentacoes.length };
    }, [movimentacoes]);

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID BACKGROUND */}
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
                            Histórico e <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Auditoria de Cautelas</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">
                            Rastreabilidade completa de retiradas, devoluções e posse de ferramentas em tempo real
                        </p>
                    </div>

                    {/* CONTROLADORES DE BUSCA */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar ferramenta, colaborador ou IDs..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-orange-500/40 px-4 py-2.5 rounded-xl text-white text-xs font-bold outline-none w-full sm:w-72 uppercase transition-all"
                        />

                        <div className="flex items-center bg-black border border-white/[0.06] p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setFiltroMovimentacao('todos')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroMovimentacao === 'todos' ? 'bg-orange-600 text-black' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Tudo
                            </button>
                            <button
                                onClick={() => setFiltroMovimentacao('aberto')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroMovimentacao === 'aberto' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Pendente (Em Uso)
                            </button>
                            <button
                                onClick={() => setFiltroMovimentacao('devolvido')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroMovimentacao === 'devolvido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Entregue
                            </button>
                        </div>
                    </div>
                </header>

                {/* PLACAR ANALÍTICO DE CAUTELAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Fluxo Total de Operações</p>
                        <p className="text-2xl font-mono font-black mt-1 text-slate-300">{relatorioRapido.total}</p>
                    </div>
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-500">Ferramentas fora do almoxarifado</p>
                        <p className="text-2xl font-mono font-black mt-1 text-amber-400">{relatorioRapido.pendentes}</p>
                    </div>
                    <div className="bg-[#09090b]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Devoluções Concluídas</p>
                        <p className="text-2xl font-mono font-black mt-1 text-emerald-400">{relatorioRapido.concluídas}</p>
                    </div>
                </div>

                {/* LISTAGEM DOS REGISTROS */}
                <div className="relative bg-[#09090b]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 min-h-[400px]">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

                    {carregando ? (
                        <div className="text-center py-32 text-[9px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                            Buscando log de transações...
                        </div>
                    ) : movimentacoesFiltradas.length === 0 ? (
                        <div className="py-32 text-center">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Nenhum registro de movimentação encontrado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 pl-4">Ferramenta</th>
                                    <th className="pb-3">Responsável</th>
                                    <th className="pb-3 text-center">Data Retirada</th>
                                    <th className="pb-3 text-center">Data Devolução</th>
                                    <th className="pb-3 text-right pr-4">Situação</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.01]">
                                {movimentacoesFiltradas.map(m => (
                                    <tr key={m.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="py-4 pl-4">
                                            <p className="font-black text-slate-200 uppercase tracking-tight text-xs leading-none">
                                                {m.ferramentas?.nome || 'Ferramenta Desconhecida'}
                                            </p>
                                            <span className="text-[9px] font-mono font-black text-orange-500 tracking-wider mt-1 block">
                                                    ID: {m.ferramenta_id}
                                                </span>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-300 uppercase text-[11px] tracking-wide leading-none">
                                                {m.funcionarios ? `${m.funcionarios.nome} ${m.funcionarios.sobrenome}` : 'N/A'}
                                            </p>
                                            <span className="text-[8px] font-mono text-slate-600 mt-1 block">
                                                    Registro: {m.funcionario_id}
                                                </span>
                                        </td>
                                        <td className="py-4 text-center font-mono text-[10px] text-slate-400">
                                            {new Date(m.data_retirada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 text-center font-mono text-[10px]">
                                            {m.data_devolucao ? (
                                                <span className="text-slate-400">
                                                        {new Date(m.data_devolucao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                            ) : (
                                                <span className="text-amber-500 font-sans text-[8px] font-black uppercase tracking-widest animate-pulse bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                                        Em Uso
                                                    </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                                    m.status_movimentacao === 'aberto'
                                                        ? 'bg-amber-500/5 text-amber-400 border border-amber-500/10'
                                                        : 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                                                }`}>
                                                    {m.status_movimentacao === 'aberto' ? 'Pendente' : 'Concluído'}
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
                <div className="font-mono text-slate-800">Módulo Histórico Geral v3.2</div>
            </footer>
        </main>
    );
}