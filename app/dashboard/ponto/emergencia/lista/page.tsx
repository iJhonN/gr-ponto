"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface SaidaEmergencia {
    id: string;
    funcionario_id: string;
    justificativa: string;
    horario_saida: string;
    horario_retorno: string | null;
    funcionarios: {
        nome: string;
        sobrenome: string;
        cargo: string;
    } | null;
}

export default function ListaSaidasEmergenciaPage() {
    const [saidas, setSaidas] = useState<SaidaEmergencia[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'rua', 'retornado'

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarSaidas() {
        setCarregando(true);
        try {
            // Puxa as saídas trazendo junto os dados do funcionário de forma relacional
            const { data, error } = await supabase
                .from('saidas_emergencia')
                .select(`
                    id,
                    funcionario_id,
                    justificativa,
                    horario_saida,
                    horario_retorno,
                    funcionarios (
                        nome,
                        sobrenome,
                        cargo
                    )
                `)
                .order('horario_saida', { ascending: false });

            if (error) throw error;
            if (data) setSaidas(data as unknown as SaidaEmergencia[]);
        } catch (error) {
            console.error("Erro ao carregar lista de saídas:", error);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarSaidas();
    }, []);

    // Filtros inteligentes em tempo real
    const dadosFiltrados = useMemo(() => {
        return saidas.filter(s => {
            // 1. Filtro por Status (Na rua vs Retornado)
            if (filtroStatus === 'rua' && s.horario_retorno !== null) return false;
            if (filtroStatus === 'retornado' && s.horario_retorno === null) return false;

            // 2. Pesquisa por texto global
            const termo = pesquisa.toLowerCase().trim();
            if (termo) {
                const nomeCompleto = `${s.funcionarios?.nome || ''} ${s.funcionarios?.sobrenome || ''}`.toLowerCase();
                const just = (s.justificativa || '').toLowerCase();
                const idFunc = (s.funcionario_id || '').toLowerCase();
                return nomeCompleto.includes(termo) || just.includes(termo) || idFunc.includes(termo);
            }

            return true;
        });
    }, [saidas, filtroStatus, pesquisa]);

    // Métricas rápidas baseadas nos dados ativos
    const metricas = useMemo(() => {
        let naRua = 0;
        let encerradas = 0;
        saidas.forEach(s => {
            if (s.horario_retorno === null) naRua++;
            else encerradas++;
        });
        return { naRua, encerradas, total: saidas.length };
    }, [saidas]);

    // Função auxiliar para calcular a duração da ausência
    const calcularDuracao = (saida: string, retorno: string | null) => {
        if (!retorno) return '---';
        const inicio = new Date(saida).getTime();
        const fim = new Date(retorno).getTime();
        const diferencaMinutos = Math.floor((fim - inicio) / (1000 * 60));

        if (diferencaMinutos < 60) return `${diferencaMinutos} min`;
        const horas = Math.floor(diferencaMinutos / 60);
        const mins = diferencaMinutos % 60;
        return `${horas}h ${mins.toString().padStart(2, '0')}m`;
    };

    return (
        <main className="min-h-screen bg-[#07080a] text-white p-6 md:p-10 font-sans antialiased print:bg-white print:text-black print:p-0">
            <div className="w-full max-w-7xl mx-auto space-y-8">

                {/* CABEÇALHO */}
                <header className="border-b border-white/[0.04] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                        <h1 className="text-2xl font-black uppercase italic tracking-tight">
                            Auditoria de <span className="text-orange-500">Saídas Emergenciais</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Histórico completo de afastamentos temporários e justificativas de saída</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={carregarSaidas} className="bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            🔄 Sincronizar
                        </button>
                        <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            🖨️ Imprimir
                        </button>
                    </div>
                </header>

                {/* CARDS INDICADORES */}
                <section className="grid grid-cols-3 gap-4 print:hidden">
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Ausentes Agora (Na rua)</p>
                        <h3 className={`text-xl font-black mt-1 ${metricas.naRua > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                            {metricas.naRua} <span className="text-xs font-bold text-slate-500">colaboradores</span>
                        </h3>
                    </div>
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Retornos Confirmados</p>
                        <h3 className="text-xl font-black text-emerald-400 mt-1">{metricas.encerradas} <span className="text-xs text-slate-500 font-bold">histórico</span></h3>
                    </div>
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Total de Ocorrências</p>
                        <h3 className="text-xl font-black text-white mt-1">{metricas.total} <span className="text-xs text-slate-500 font-bold">registros</span></h3>
                    </div>
                </section>

                {/* BARRA DE FILTROS */}
                <section className="bg-[#0e1117] border border-white/[0.04] p-4 rounded-[24px] flex flex-col sm:flex-row gap-4 print:hidden">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Busca Global</label>
                        <input
                            type="text"
                            placeholder="Buscar por colaborador, justificativa ou ID..."
                            value={pesquisa}
                            onChange={e => setPesquisa(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs font-medium"
                        />
                    </div>
                    <div className="w-full sm:w-48 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Filtrar Situação</label>
                        <select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs cursor-pointer font-bold"
                        >
                            <option value="todos">Todos os Registros</option>
                            <option value="rua">Apenas os que estão na rua</option>
                            <option value="retornado">Apenas os já retornados</option>
                        </select>
                    </div>
                </section>

                {/* TABELA PRINCIPAL */}
                <section className="bg-[#0e1117] border border-white/[0.04] rounded-[28px] p-6 shadow-xl print:bg-white print:border-none print:p-0">
                    {carregando ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] uppercase font-black tracking-widest">Buscando Relatório...</span>
                        </div>
                    ) : dadosFiltrados.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum afastamento emergencial localizado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse print:text-black">
                                <thead>
                                <tr className="border-b border-white/[0.03] text-slate-500 uppercase tracking-wider text-[9px] font-black print:border-black print:text-black">
                                    <th className="pb-3 pl-2 w-36">Data / Saída</th>
                                    <th className="pb-3 w-44">Colaborador</th>
                                    <th className="pb-3 w-32 text-center">Horário Retorno</th>
                                    <th className="pb-3 w-24 text-center">Duração</th>
                                    <th className="pb-3 pl-4">Justificativa da Emergência</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02] print:divide-black/10">
                                {dadosFiltrados.map((item) => {
                                    const dSaida = new Date(item.horario_saida);
                                    const dRetorno = item.horario_retorno ? new Date(item.horario_retorno) : null;

                                    return (
                                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors print:hover:bg-transparent">
                                            <td className="py-4 pl-2 font-mono text-slate-400 font-bold print:text-black">
                                                {dSaida.toLocaleDateString('pt-BR')}
                                                <span className="text-[10px] font-black text-orange-500 block print:text-black/60">
                                                        {dSaida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                            </td>
                                            <td className="py-4 font-bold text-slate-200 print:text-black">
                                                    <span className="block leading-tight">
                                                        {item.funcionarios ? `${item.funcionarios.nome} ${item.funcionarios.sobrenome}` : 'Ex-colaborador'}
                                                    </span>
                                                <span className="text-[10px] text-slate-500 font-mono font-medium block print:text-black/50">
                                                        ID: {item.funcionario_id}
                                                    </span>
                                            </td>
                                            <td className="py-4 text-center font-mono font-bold">
                                                {dRetorno ? (
                                                    <span className="text-emerald-400 print:text-black">
                                                            {dRetorno.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                ) : (
                                                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-black uppercase tracking-wider animate-pulse print:border-black print:text-black print:bg-transparent">
                                                            Na Rua
                                                        </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-center font-mono font-black text-slate-300 print:text-black">
                                                {calcularDuracao(item.horario_saida, item.horario_retorno)}
                                            </td>
                                            <td className="py-4 pl-4 text-slate-300 font-medium whitespace-pre-wrap max-w-sm print:text-black">
                                                {item.justificativa}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}