"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

interface RegistroUnificado {
    id: number;
    funcionario_id: string;
    nome: string;
    data: string;
    minutos: number;
    tipo: 'pausa' | 'extra_diurna' | 'extra_noturna';
    observacao: string;
}

export default function RelatorioDetalhadoPausasEExtrasPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pausas, setPausas] = useState<any[]>([]);
    const [horasExtras, setHorasExtras] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    // Estados dos Filtros
    const [pesquisaTexto, setPesquisaTexto] = useState('');
    const [filtroFuncionario, setFiltroFuncionario] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('30'); // em dias

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarDados() {
        setCarregando(true);
        try {
            // Busca dados de funcionários, pausas e horas extras em paralelo
            const [resFunc, resPausas, resExtras] = await Promise.all([
                supabase.from('funcionarios').select('id, nome, sobrenome, cargo').order('nome'),
                supabase.from('pausas').select('*'),
                supabase.from('horas_extras').select('*')
            ]);

            if (resFunc.data) setFuncionarios(resFunc.data);
            if (resPausas.data) setPausas(resPausas.data);
            if (resExtras.data) setHorasExtras(resExtras.data);
        } catch (err) {
            console.error("Erro ao carregar relatório unificado:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // 1. UNIFICA E FILTRA OS DADOS EM TEMPO REAL
    const dadosFiltrados = useMemo((): RegistroUnificado[] => {
        const listaUnificada: RegistroUnificado[] = [];

        // Injeta os dados originários da tabela de pausas
        pausas.forEach(p => {
            listaUnificada.push({
                id: p.id,
                funcionario_id: p.funcionario_id,
                nome: p.nome || 'Colaborador',
                data: p.data,
                minutos: Number(p.minutos_ajuste || 0),
                tipo: 'pausa',
                observacao: p.observacao || ''
            });
        });

        // Injeta os dados originários da tabela de horas extras
        horasExtras.forEach(e => {
            if (e.minutos_diurnos > 0) {
                listaUnificada.push({
                    id: e.id,
                    funcionario_id: e.funcionario_id,
                    nome: e.nome_completo || 'Colaborador',
                    data: `${e.data_referencia}T12:00:00.000Z`, // data_referencia é DATE, normaliza string
                    minutos: Number(e.minutos_diurnos),
                    tipo: 'extra_diurna',
                    observacao: e.observacao || ''
                });
            }
            if (e.minutos_noturnos > 0) {
                listaUnificada.push({
                    id: e.id,
                    funcionario_id: e.funcionario_id,
                    nome: e.nome_completo || 'Colaborador',
                    data: `${e.data_referencia}T19:00:00.000Z`, // Simula horário noturno para ordenação
                    minutos: Number(e.minutos_noturnos),
                    tipo: 'extra_noturna',
                    observacao: e.observacao || ''
                });
            }
        });

        // Aplica a malha de filtros na lista unificada
        return listaUnificada.filter(item => {
            // Filtro por Funcionário
            if (filtroFuncionario !== 'todos' && item.funcionario_id !== filtroFuncionario) return false;

            // Filtro por Tipo de Evento
            if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;

            // Filtro por Período de Dias
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - parseInt(filtroPeriodo));
            if (new Date(item.data) < dataLimite) return false;

            // Pesquisa por Texto Global
            const termo = pesquisaTexto.toLowerCase().trim();
            if (termo) {
                const compl = item.nome.toLowerCase();
                const obs = item.observacao.toLowerCase();
                const idFunc = item.funcionario_id.toLowerCase();
                return compl.includes(termo) || obs.includes(termo) || idFunc.includes(termo);
            }

            return true;
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()); // Mais recentes primeiro
    }, [pausas, horasExtras, filtroFuncionario, filtroTipo, filtroPeriodo, pesquisaTexto]);

    // 2. CARD INDICADORES COM RECALCULO DINÂMICO
    const metrificacao = useMemo(() => {
        let minutosPausas = 0;
        let minutosExtrasDiurnas = 0;
        let minutosExtrasNoturnas = 0;

        dadosFiltrados.forEach(d => {
            if (d.tipo === 'pausa') minutosPausas += d.minutos;
            else if (d.tipo === 'extra_diurna') minutosExtrasDiurnas += d.minutos;
            else if (d.tipo === 'extra_noturna') minutosExtrasNoturnas += d.minutos;
        });

        return {
            minutosPausas,
            minutosExtrasDiurnas,
            minutosExtrasNoturnas,
            registrosExibidos: dadosFiltrados.length
        };
    }, [dadosFiltrados]);

    return (
        <main className="min-h-screen bg-[#07080a] text-white p-6 md:p-10 font-sans antialiased print:bg-white print:text-black print:p-0">
            <div className="w-full max-w-7xl mx-auto space-y-8">

                {/* CABEÇALHO */}
                <header className="border-b border-white/[0.04] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                        <h1 className="text-2xl font-black uppercase italic tracking-tight">
                            Auditoria de <span className="text-orange-500">Pausas & Horas Extras</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Histórico completo de lançamentos, observações de atraso e tempos computados</p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        🖨️ Imprimir Relatório
                    </button>
                </header>

                {/* CARDS INDICADORES */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Total Pausas</p>
                        <h3 className="text-xl font-black text-amber-400 mt-1">{metrificacao.minutosPausas} <span className="text-xs font-bold text-slate-400">min</span></h3>
                    </div>
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Extra Diurna</p>
                        <h3 className="text-xl font-black text-emerald-400 mt-1">{metrificacao.minutosExtrasDiurnas} <span className="text-xs text-slate-400 font-bold">min</span></h3>
                    </div>
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Extra Noturna (Pós-18h)</p>
                        <h3 className="text-xl font-black text-indigo-400 mt-1">{metrificacao.minutosExtrasNoturnas} <span className="text-xs text-slate-400 font-bold">min</span></h3>
                    </div>
                    <div className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Lançamentos Filtrados</p>
                        <h3 className="text-xl font-black text-white mt-1">{metrificacao.registrosExibidos} <span className="text-xs text-slate-500 font-bold">linhas</span></h3>
                    </div>
                </section>

                {/* BARRA DE FILTROS AVANÇADOS */}
                <section className="bg-[#0e1117] border border-white/[0.04] p-5 rounded-[24px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Pesquisa Global</label>
                        <input
                            type="text"
                            placeholder="Buscar por observação, nome..."
                            value={pesquisaTexto}
                            onChange={e => setPesquisaTexto(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Filtrar Colaborador</label>
                        <select
                            value={filtroFuncionario}
                            onChange={e => setFiltroFuncionario(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs cursor-pointer"
                        >
                            <option value="todos">Todos os Funcionários</option>
                            {funcionarios.map(f => (
                                <option key={f.id} value={f.id}>{f.nome} {f.sobrenome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Tipo do Registro</label>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs cursor-pointer"
                        >
                            <option value="todos">Todos os Lançamentos</option>
                            <option value="pausa">Apenas Pausas</option>
                            <option value="extra_diurna">Apenas Horas Extras Diurnas</option>
                            <option value="extra_noturna">Apenas Horas Extras Noturnas</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Janela de Tempo</label>
                        <select
                            value={filtroPeriodo}
                            onChange={e => setFiltroPeriodo(e.target.value)}
                            className="w-full bg-[#07080a] border border-white/[0.05] p-2.5 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs cursor-pointer"
                        >
                            <option value="7">Últimos 7 dias</option>
                            <option value="15">Últimos 15 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Último Ano inteiro</option>
                        </select>
                    </div>

                </section>

                {/* TABELA PRINCIPAL DE DADOS */}
                <section className="bg-[#0e1117] border border-white/[0.04] rounded-[28px] p-6 shadow-xl print:bg-white print:border-none print:p-0">

                    {carregando ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] uppercase font-black tracking-widest">Montando Relatório Detalhado...</span>
                        </div>
                    ) : dadosFiltrados.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum registro encontrado para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse print:text-black">
                                <thead>
                                <tr className="border-b border-white/[0.03] text-slate-500 uppercase tracking-wider text-[9px] font-black print:border-black print:text-black">
                                    <th className="pb-3 pl-3 w-32">Data / Hora</th>
                                    <th className="pb-3 w-48">Colaborador</th>
                                    <th className="pb-3 w-36 text-center">Identificador</th>
                                    <th className="pb-3 w-24 text-center">Tempo</th>
                                    <th className="pb-3 pl-4">Observação / Justificativa do Gerente</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02] print:divide-black/10">
                                {dadosFiltrados.map((item, idx) => {
                                    const dObj = new Date(item.data);
                                    const dataForm = dObj.toLocaleDateString('pt-BR');
                                    // Se for hora extra manual salvou como DATE puro sem hora, oculta a string de hora vazia
                                    const horaForm = item.data.includes('T12:') || item.data.includes('T19:')
                                        ? ''
                                        : dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors print:hover:bg-transparent">
                                            <td className="py-3.5 pl-3 font-mono text-slate-400 font-bold print:text-black">
                                                {dataForm} {horaForm && <span className="text-[10px] font-medium text-slate-600 block sm:inline sm:ml-1 print:text-black/60">{horaForm}</span>}
                                            </td>
                                            <td className="py-3.5 font-bold text-slate-200 print:text-black">
                                                <span className="block leading-tight">{item.nome}</span>
                                                <span className="text-[10px] text-slate-500 font-mono font-medium block print:text-black/50">ID: {item.funcionario_id}</span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wide border ${
                                                    item.tipo === 'pausa'
                                                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 print:text-black print:border-black'
                                                        : item.tipo === 'extra_diurna'
                                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 print:text-black print:border-black'
                                                            : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400 print:text-black print:border-black'
                                                }`}>
                                                    {item.tipo === 'pausa' ? 'Pausa' : item.tipo === 'extra_diurna' ? 'Extra Diurna' : 'Extra Noturna'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center font-mono font-black text-orange-500 print:text-black">
                                                +{item.minutos} min
                                            </td>
                                            <td className="py-3.5 pl-4 text-slate-300 font-medium whitespace-pre-wrap max-w-md print:text-black">
                                                {item.observacao}
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