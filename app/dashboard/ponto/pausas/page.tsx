"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

interface LancamentoGeral {
    id: number;
    funcionario_id: string;
    nome: string;
    data: string;
    valor_exibicao: string;
    tipo: string;
    observacao: string;
}

export default function GestaoLancamentosManuaisPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [historicoRecente, setHistoricoRecente] = useState<LancamentoGeral[]>([]);

    // Estados do Formulário
    const [funcionarioId, setFuncionarioId] = useState('');
    const [minutosAjuste, setMinutosAjuste] = useState('');
    const [tipoLancamento, setTipoLancamento] = useState('pausa'); // 'pausa', 'extra_diurna', 'extra_noturna'
    const [observacao, setObservacao] = useState('');

    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarDados() {
        try {
            // Busca dados das duas tabelas para montar um histórico unificado recente na tela
            const [resFunc, resPausas, resExtras] = await Promise.all([
                supabase.from('funcionarios').select('id, nome, sobrenome, cargo').order('nome'),
                supabase.from('pausas').select('*').order('criado_em', { ascending: false }).limit(10),
                supabase.from('horas_extras').select('*').order('criado_em', { ascending: false }).limit(10)
            ]);

            if (resFunc.data) {
                setFuncionarios(resFunc.data);
                if (resFunc.data.length > 0 && !funcionarioId) {
                    setFuncionarioId(resFunc.data[0].id);
                }
            }

            // Unifica os históricos para exibição visual do gerente
            const listaUnificada: LancamentoGeral[] = [];

            if (resPausas.data) {
                resPausas.data.forEach((p: any) => {
                    listaUnificada.push({
                        id: p.id,
                        funcionario_id: p.funcionario_id,
                        nome: p.nome,
                        data: p.data,
                        valor_exibicao: `+${p.minutos_ajuste} min (Pausa)`,
                        tipo: 'Pausa',
                        observacao: p.observacao
                    });
                });
            }

            if (resExtras.data) {
                resExtras.data.forEach((e: any) => {
                    const min = e.minutos_diurnos > 0 ? e.minutos_diurnos : e.minutos_noturnos;
                    const sufixo = e.minutos_diurnos > 0 ? 'Extra Diurna' : 'Extra Noturna';
                    listaUnificada.push({
                        id: e.id,
                        funcionario_id: e.funcionario_id,
                        nome: e.nome_completo,
                        data: `${e.data_referencia}T12:00:00Z`, // Normaliza string de data
                        valor_exibicao: `+${min} min (${sufixo})`,
                        tipo: sufixo,
                        observacao: e.observacao
                    });
                });
            }

            // Ordena o feed do histórico unificado por inserção mais recente
            listaUnificada.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            setHistoricoRecente(listaUnificada.slice(0, 20));

        } catch (err) {
            console.error("Erro ao sincronizar dados de lançamentos:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    const handleProcessarLancamento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!funcionarioId || !minutosAjuste || !observacao.trim()) {
            setStatusFeed({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        const funcSelecionado = funcionarios.find(f => f.id === funcionarioId);
        const nomeCompleto = funcSelecionado ? `${funcSelecionado.nome} ${funcSelecionado.sobrenome}` : 'Colaborador';
        const minutosInt = parseInt(minutosAjuste);
        const dataHojeCompleta = new Date().toISOString();
        const dataHojeApenasChave = dataHojeCompleta.split('T')[0]; // Formato 'YYYY-MM-DD'

        try {
            if (tipoLancamento === 'pausa') {
                // Inserção direcionada para a tabela de PAUSAS
                const { error } = await supabase
                    .from('pausas')
                    .insert([{
                        funcionario_id: funcionarioId,
                        nome: nomeCompleto,
                        data: dataHojeCompleta,
                        minutos_ajuste: minutosInt,
                        tipo: 'pausa',
                        observacao: observacao.trim(),
                        origem: 'admin'
                    }]);
                if (error) throw error;
            } else {
                // Inserção direcionada para a tabela de HORAS_EXTRAS
                const { error } = await supabase
                    .from('horas_extras')
                    .insert([{
                        funcionario_id: funcionarioId,
                        nome_completo: nomeCompleto,
                        data_referencia: dataHojeApenasChave,
                        minutos_diurnos: tipoLancamento === 'extra_diurna' ? minutosInt : 0,
                        minutos_noturnos: tipoLancamento === 'extra_noturna' ? minutosInt : 0,
                        observacao: observacao.trim(),
                        origem: 'admin'
                    }]);
                if (error) throw error;
            }

            setStatusFeed({ tipo: 'sucesso', texto: `Lançamento de ${minutosAjuste} min efetuado com sucesso para ${nomeCompleto}!` });

            setMinutosAjuste('');
            setObservacao('');
            carregarDados();

        } catch (err) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: 'Falha ao salvar o lançamento no Supabase.' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#07080a] text-white p-6 md:p-10 font-sans antialiased">
            <div className="w-full max-w-6xl mx-auto">

                <header className="border-b border-white/[0.04] pb-6 mb-10">
                    <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                    <h1 className="text-2xl font-black uppercase italic tracking-tight">
                        Lançamento de <span className="text-orange-500">Pausas e Extras</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Insira pausas ou horas extras diurnas/noturnas diretamente na folha</p>
                </header>

                {statusFeed.texto && (
                    <div className={`mb-6 p-4 rounded-2xl text-xs font-black uppercase tracking-wide border ${
                        statusFeed.tipo === 'sucesso'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/5 border-red-500/20 text-red-400'
                    }`}>
                        {statusFeed.tipo === 'sucesso' ? '✅' : '⚠️'} {statusFeed.texto}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* FORMULÁRIO */}
                    <form onSubmit={handleProcessarLancamento} className="bg-[#0e1117] border border-white/[0.04] p-6 rounded-[28px] shadow-xl space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Novo Ajuste Manual</h3>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Selecionar Colaborador</label>
                            <select
                                value={funcionarioId}
                                onChange={e => setFuncionarioId(e.target.value)}
                                className="w-full bg-[#07080a] border border-white/[0.05] p-3 rounded-xl outline-none focus:border-orange-500/50 text-white text-sm cursor-pointer"
                            >
                                {funcionarios.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome} {f.sobrenome} ({f.cargo})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Tempo (Em Minutos)</label>
                                <input
                                    type="number"
                                    placeholder="Ex: 15"
                                    value={minutosAjuste}
                                    onChange={e => setMinutosAjuste(e.target.value)}
                                    className="w-full bg-[#07080a] border border-white/[0.05] p-3 rounded-xl outline-none focus:border-orange-500/50 text-white text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Identificador</label>
                                <select
                                    value={tipoLancamento}
                                    onChange={e => setTipoLancamento(e.target.value)}
                                    className="w-full bg-[#07080a] border border-white/[0.05] p-3 rounded-xl outline-none focus:border-orange-500/50 text-white text-sm cursor-pointer"
                                >
                                    <option value="pausa">Pausa Regulamentar</option>
                                    <option value="extra_diurna">Hora Extra Diurna</option>
                                    <option value="extra_noturna">Hora Extra Noturna (Pós-18h)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Justificativa / Observação</label>
                            <textarea
                                placeholder="Descreva o motivo do lançamento..."
                                value={observacao}
                                onChange={e => setObservacao(e.target.value)}
                                className="w-full bg-[#07080a] border border-white/[0.05] p-3 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs h-24 resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-black hover:opacity-95 active:scale-[0.98] disabled:opacity-40 transition-all shadow-md pt-4"
                        >
                            {enviando ? "Gravando..." : "Confirmar Registro"}
                        </button>
                    </form>

                    {/* HISTÓRICO RECENTE */}
                    <div className="lg:col-span-2 bg-[#0e1117] border border-white/[0.04] p-6 rounded-[28px] shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Últimos Lançamentos Efetuados</h3>

                        {carregando ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] uppercase font-black tracking-widest">Buscando Histórico...</span>
                            </div>
                        ) : historicoRecente.length === 0 ? (
                            <p className="text-xs text-slate-600 py-12 text-center font-bold uppercase tracking-wider">Nenhum ajuste manual foi lançado recentemente.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-white/[0.03] text-slate-500 uppercase tracking-wider text-[9px] font-black">
                                        <th className="pb-3 pl-2">Data</th>
                                        <th className="pb-3">Colaborador</th>
                                        <th className="pb-3 text-center">Tipo</th>
                                        <th className="pb-3 text-center">Tempo</th>
                                        <th className="pb-3 text-right pr-2">Justificativa</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                    {historicoRecente.map((item, idx) => {
                                        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
                                        return (
                                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="py-3 font-mono font-bold text-slate-400 pl-2">{dataFormatada}</td>
                                                <td className="py-3 font-bold text-slate-200">{item.nome} <span className="text-[10px] text-slate-600 font-mono">({item.funcionario_id})</span></td>
                                                <td className="py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wide border ${
                                                        item.tipo === 'Pausa'
                                                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                                                            : item.tipo.includes('Diurna')
                                                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                                                : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'
                                                    }`}>
                                                        {item.tipo}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center font-mono font-black text-orange-400">{item.valor_exibicao.split(' ')[0]}</td>
                                                <td className="py-3 text-right pr-2 max-w-xs truncate text-slate-400 font-medium" title={item.observacao}>
                                                    {item.observacao}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}