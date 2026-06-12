"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface PontoAtrasado {
    id: number;
    funcionario_id: string;
    nome_completo: string;
    data_registro: string;
    hora_formatada: string;
    tipo_batida: string;
    justificado: boolean;
    texto_justificativa?: string;
}

export default function GestaoAtrasosPage() {
    const [pontos, setPontos] = useState<any[]>([]);
    const [justificativas, setJustificativas] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    // Estados de ação do Gerente
    const [pontoSelecionadoId, setPontoSelecionadoId] = useState<number | null>(null);
    const [textoJustificativa, setTextoJustificativa] = useState('');
    const [enviando, setEnviando] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarDados() {
        setCarregando(true);
        try {
            const [resPontos, resJust] = await Promise.all([
                supabase.from('pontos').select('*').order('data_registro', { ascending: false }),
                supabase.from('justificativas_atraso').select('*')
            ]);

            if (resPontos.data) setPontos(resPontos.data);
            if (resJust.data) setJustificativas(resJust.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // FILTRO INTELIGENTE: Identifica os atrasos com base na coluna observacao gravada pelo Totem
    const atrasosComputados = useMemo((): PontoAtrasado[] => {
        return pontos.filter(p => {
            const obs = p.observacao ? p.observacao.toLowerCase().trim() : '';
            return obs === 'atraso';
        }).map(p => {
            const jf = justificativas.find(j => Number(j.ponto_id) === Number(p.id));
            return {
                id: p.id,
                funcionario_id: p.funcionario_id,
                nome_completo: p.nome_completo,
                data_registro: p.data_registro,
                hora_formatada: p.hora_formatada,
                tipo_batida: p.tipo_batida,
                justificado: !!jf,
                texto_justificativa: jf?.texto_justificativa
            };
        });
    }, [pontos, justificativas]);

    const handleSalvarJustificativa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pontoSelecionadoId || !textoJustificativa.trim()) return;

        setEnviando(true);
        const pontoAlvo = atrasosComputados.find(a => a.id === pontoSelecionadoId);

        try {
            const { error } = await supabase
                .from('justificativas_atraso')
                .insert([{
                    ponto_id: pontoSelecionadoId,
                    funcionario_id: pontoAlvo?.funcionario_id,
                    texto_justificativa: textoJustificativa.trim()
                }]);

            if (error) throw error;

            setTextoJustificativa('');
            setPontoSelecionadoId(null);
            carregarDados(); // Recarrega as tabelas no ecrã para atualizar os estados
        } catch (err) {
            console.error(err);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#07080a] text-white p-6 md:p-10 font-sans antialiased">
            <div className="w-full max-w-6xl mx-auto space-y-6">

                <header className="border-b border-white/[0.04] pb-6">
                    <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                    <h1 className="text-2xl font-black uppercase italic tracking-tight">Tratamento de <span className="text-orange-500">Atrasos</span></h1>
                    <p className="text-xs text-slate-500 mt-1">Aplique justificativas oficiais para entradas fora do horário regulamentar</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* TABELA DE ATRASOS ENCONTRADOS */}
                    <div className="lg:col-span-2 bg-[#0e1117] border border-white/[0.04] p-6 rounded-[28px] shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Ocorrências de Atraso Detectadas</h3>

                        {carregando ? (
                            <div className="py-12 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-600">Mapeando Linhas de Ponto...</div>
                        ) : atrasosComputados.length === 0 ? (
                            <p className="text-xs text-slate-600 py-12 text-center font-bold uppercase tracking-wider">Nenhum atraso sem tratamento encontrado.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-white/[0.03] text-slate-500 uppercase tracking-wider text-[9px] font-black">
                                        <th className="pb-3 pl-2">Data</th>
                                        <th className="pb-3">Colaborador</th>
                                        <th className="pb-3 text-center">Horário</th>
                                        <th className="pb-3 text-right pr-2">Ação / Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                    {atrasosComputados.map(atraso => {
                                        const dataF = new Date(atraso.data_registro).toLocaleDateString('pt-BR');
                                        return (
                                            <tr key={atraso.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="py-4 font-mono font-bold text-slate-400 pl-2">{dataF}</td>
                                                <td className="py-4 font-bold text-slate-200">
                                                    {atraso.nome_completo}
                                                    <span className="text-[10px] text-slate-500 font-mono block">ID: {atraso.funcionario_id}</span>
                                                </td>
                                                <td className="py-4 text-center font-mono font-black text-red-400">{atraso.hora_formatada}</td>
                                                <td className="py-4 text-right pr-2">
                                                    {atraso.justificado ? (
                                                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md font-black uppercase tracking-wider">Justificado</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setPontoSelecionadoId(atraso.id)}
                                                            className="text-[10px] bg-orange-500 hover:bg-orange-600 text-black px-3 py-1 rounded-md font-black uppercase tracking-wider transition-all"
                                                        >
                                                            Justificar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* CAIXA DE INSERÇÃO DE JUSTIFICATIVA */}
                    <div className="bg-[#0e1117] border border-white/[0.04] p-6 rounded-[28px] shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Aplicar Justificativa</h3>

                        {pontoSelecionadoId ? (
                            <form onSubmit={handleSalvarJustificativa} className="space-y-4">
                                <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl">
                                    <p className="text-[10px] font-black uppercase text-slate-500">Colaborador Selecionado</p>
                                    <p className="text-xs font-black text-orange-400 mt-1">
                                        {atrasosComputados.find(a => a.id === pontoSelecionadoId)?.nome_completo}
                                    </p>
                                    <p className="text-[11px] font-mono font-bold text-slate-300 mt-0.5">
                                        Batida efetuada às {atrasosComputados.find(a => a.id === pontoSelecionadoId)?.hora_formatada}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Motivo do Atraso</label>
                                    <textarea
                                        placeholder="Ex: Apresentou atestado médico / Problemas mecânicos no veículo / Esqueceu o crachá na entrada..."
                                        value={textoJustificativa}
                                        onChange={e => setTextoJustificativa(e.target.value)}
                                        className="w-full bg-[#07080a] border border-white/[0.05] p-3 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs h-32 resize-none font-medium"
                                        required
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPontoSelecionadoId(null)}
                                        className="w-1/3 bg-white/[0.02] border border-white/[0.05] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="w-2/3 bg-orange-500 hover:bg-orange-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-black transition-all"
                                    >
                                        {enviando ? "A guardar..." : "Gravar Justificativa"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-16 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                Clique no botão "Justificar" ao lado de um ponto para abrir o formulário.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}