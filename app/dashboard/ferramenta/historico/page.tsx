"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Movimentacao {
    _id: string;
    ferramentaId: string;
    funcionarioId: string;
    nomeFerramenta: string;
    acao: 'retirada' | 'devolucao';
    data: string;
}

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
}

export default function HistoricoFerramentas() {
    const [historico, setHistorico] = useState<Movimentacao[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [filtroAtivo, setFiltroAtivo] = useState<'uso' | 'devolvido'>('uso');

    useEffect(() => {
        const carregarDados = async () => {
            setCarregando(true);

            // Puxa a URL configurada no Environment da Vercel
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!baseUrl) {
                console.error("ERRO: NEXT_PUBLIC_API_URL não configurada no painel da Vercel.");
                setCarregando(false);
                return;
            }

            try {
                const [resMov, resFunc] = await Promise.all([
                    fetch(`${baseUrl}/ferramentas/movimentacao`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' })
                ]);

                if (resMov.ok && resFunc.ok) {
                    setHistorico(await resMov.json());
                    setFuncionarios(await resFunc.json());
                }
            } catch (error) {
                console.error("Erro ao conectar à VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, []);

    const getNomeFuncionario = (id: string) => {
        const f = funcionarios.find(func => String(func.id) === String(id));
        return f ? `${f.nome} ${f.sobrenome}` : `Matrícula: ${id}`;
    };

    const ferramentasEmUso = () => {
        const mapaEstado: Record<string, Movimentacao> = {};
        const ordenado = [...historico].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        ordenado.forEach(log => {
            if (log.acao === 'retirada') {
                mapaEstado[log.ferramentaId] = log;
            } else if (log.acao === 'devolucao') {
                delete mapaEstado[log.ferramentaId];
            }
        });

        return Object.values(mapaEstado).reverse();
    };

    const ferramentasDevolvidas = historico.filter(log => log.acao === 'devolucao');

    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
                <div>
                    <Link href="/dashboard/ferramenta" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Voltar</Link>
                    <h1 className="text-4xl font-black uppercase italic leading-none">Rastreio de <span className="text-orange-500">Ativos</span></h1>
                </div>

                <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5 shadow-2xl">
                    <button
                        onClick={() => setFiltroAtivo('uso')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroAtivo === 'uso' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Em Uso Agora
                    </button>
                    <button
                        onClick={() => setFiltroAtivo('devolvido')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroAtivo === 'devolvido' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Histórico de Devoluções
                    </button>
                </div>
            </header>

            <section className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${filtroAtivo === 'uso' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <h2 className="text-xs font-black uppercase tracking-[4px] text-slate-400">
                        {filtroAtivo === 'uso' ? 'Itens Pendentes de Devolução' : 'Registros de Entrada no Estoque'}
                    </h2>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[45px] overflow-hidden backdrop-blur-xl shadow-2xl">
                    <table className="w-full text-left border-collapse text-white">
                        <thead>
                        <tr className="bg-white/5 uppercase text-slate-500 text-[10px] font-black tracking-widest">
                            <th className="p-6">Ferramenta</th>
                            <th className="p-6">Responsável</th>
                            <th className="p-6">Data/Hora</th>
                            <th className="p-6 text-right">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {carregando ? (
                            <tr><td colSpan={4} className="p-20 text-center font-black uppercase text-slate-700 animate-pulse">Sincronizando VPS...</td></tr>
                        ) : (filtroAtivo === 'uso' ? ferramentasEmUso() : ferramentasDevolvidas).length > 0 ? (
                            (filtroAtivo === 'uso' ? ferramentasEmUso() : ferramentasDevolvidas).map((log, index) => (
                                <tr key={log._id || index} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                        <p className="font-black uppercase italic text-sm leading-none mb-1 text-white">{log.nomeFerramenta}</p>
                                        <p className="text-[9px] text-orange-500 font-mono font-bold tracking-widest">UID: {log.ferramentaId}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-black uppercase text-slate-200 leading-none mb-1">{getNomeFuncionario(log.funcionarioId)}</p>
                                        <p className="text-[9px] text-slate-500 font-mono font-bold">MAT: {log.funcionarioId}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-black text-white">{new Date(log.data).toLocaleDateString('pt-BR')}</p>
                                        <p className="text-[10px] text-slate-500 font-black italic">{new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="p-6 text-right">
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                filtroAtivo === 'uso'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-900/10'
                                                    : 'bg-green-500/10 text-green-500 border-green-500/20'
                                            }`}>
                                                {filtroAtivo === 'uso' ? '● Em Uso' : '✓ No Estoque'}
                                            </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="p-20 text-center text-slate-600 font-black uppercase italic text-xs tracking-[5px]">Nenhum registro encontrado</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}