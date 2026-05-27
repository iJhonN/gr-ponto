"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

interface RegistroPonto {
    id: string;
    funcionarioId: string;
    data: string; // Formato ISO ou string contendo a data
    acao: 'entrada' | 'saida';
}

function ConteudoRelatorio() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<RegistroPonto[]>([]);
    const [carregando, setCarregando] = useState(true);

    // Estados para filtro de mês/ano (Padrão: Mês atual)
    const dataAtual = new Date();
    const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth() + 1);
    const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const carregarDados = async () => {
            if (!baseUrl) return;
            setCarregando(true);
            try {
                // Puxa funcionários e todo o histórico de pontos simultaneamente
                const [resFunc, resPontos] = await Promise.all([
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/pontos`, { cache: 'no-store' }) // Batendo na rota correta da sua VPS
                ]);

                if (resFunc.ok) setFuncionarios(await resFunc.json());
                if (resPontos.ok) setPontos(await resPontos.json());
            } catch (error) {
                console.error("Erro ao carregar dados do relatório:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, [baseUrl]);

    // Função auxiliar para gerar todos os dias do mês selecionado
    const obterDiasDoMes = () => {
        const qtdDias = new Date(anoSelecionado, mesSelecionado, 0).getDate();
        return Array.from({ length: qtdDias }, (_, i) => i + 1);
    };

    // Função para processar os bipes e organizar por dia para um funcionário específico
    const obterJornadaDiaria = (funcionarioId: string, dia: number) => {
        // Filtra os pontos daquele funcionário, no ano, mês e dia específicos
        const pontosDoDia = pontos.filter(p => {
            const dataPonto = new Date(p.data);
            return (
                String(p.funcionarioId) === String(funcionarioId) &&
                dataPonto.getDate() === dia &&
                (dataPonto.getMonth() + 1) === mesSelecionado &&
                dataPonto.getFullYear() === anoSelecionado
            );
        });

        // Ordena por horário para pegar a sequência correta de batidas
        pontosDoDia.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        const entrada = pontosDoDia.find(p => p.acao === 'entrada');
        const saida = pontosDoDia.find(p => p.acao === 'saida');

        return {
            entrada: entrada ? new Date(entrada.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---',
            saida: saida ? new Date(saida.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'
        };
    };

    const diasDoMes = obterDiasDoMes();

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans print:bg-white print:text-black print:p-0">

            {/* PAINEL DE CONTROLE - OCULTO NA IMPRESSÃO */}
            <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/40 p-6 rounded-[30px] border border-white/5 print:hidden">
                <div>
                    <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Dashboard</Link>
                    <h1 className="text-3xl font-black uppercase italic text-white leading-none">Fechamento <span className="text-orange-500">Mensal</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Filtro de Mês */}
                    <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(Number(e.target.value))}
                        className="bg-black border border-white/10 px-4 py-2 rounded-xl font-bold text-white outline-none focus:border-orange-500 text-sm"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Mês {String(m).padStart(2, '0')}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => window.print()}
                        className="bg-orange-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-900/20"
                    >
                        🖨️ Imprimir Relatório
                    </button>
                </div>
            </header>

            {/* SEÇÃO DOS ESPELHOS DE PONTO */}
            <section className="max-w-5xl mx-auto flex flex-col gap-12 print:gap-8">
                {carregando ? (
                    <div className="text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px] print:hidden">Processando Cartões de Ponto...</div>
                ) : (
                    funcionarios.map((func) => (
                        <div
                            key={func.id}
                            className="bg-slate-900/20 border border-white/5 rounded-[35px] p-8 bg-white text-black border-slate-200 shadow-none print:border-black print:p-4 print:break-inside-avoid print:bg-white"
                        >
                            {/* Cabeçalho do Funcionário no Documento */}
                            <div className="flex justify-between items-start border-b-2 border-orange-500 pb-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic leading-none text-black">
                                        {func.nome} {func.sobrenome}
                                    </h2>
                                    <p className="text-orange-600 text-[10px] font-black uppercase tracking-[3px] mt-1 italic">{func.cargo}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 print:text-slate-600">
                                        Período: {String(mesSelecionado).padStart(2, '0')}/{anoSelecionado}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">GR Autopeças</p>
                                </div>
                            </div>

                            {/* Tabela de Dias / Batidas */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 print:text-slate-700 uppercase font-black text-[10px] tracking-wider">
                                        <th className="py-2 px-3 w-24">Data</th>
                                        <th className="py-2 px-3">Entrada 1</th>
                                        <th className="py-2 px-3">Saída 1</th>
                                        <th className="py-2 px-3 text-right">Assinatura / Justificativa</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {diasDoMes.map((dia) => {
                                        const jornada = obterJornadaDiaria(func.id, dia);
                                        // Pula linhas vazias na impressão para economizar papel se quiser, ou deixa fixo:
                                        return (
                                            <tr key={dia} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-300">
                                                <td className="py-2 px-3 font-mono font-bold text-slate-500 print:text-black">
                                                    {String(dia).padStart(2, '0')}/{String(mesSelecionado).padStart(2, '0')}
                                                </td>
                                                <td className={`py-2 px-3 font-mono font-bold ${jornada.entrada !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.entrada}
                                                </td>
                                                <td className={`py-2 px-3 font-mono font-bold ${jornada.saida !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.saida}
                                                </td>
                                                <td className="py-2 px-3 border-l border-dashed border-slate-200 w-1/3 print:border-slate-400"></td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Campo de Assinatura do Funcionário */}
                            <div className="mt-8 pt-8 border-t border-dashed border-slate-200 flex justify-end print:mt-6 print:pt-4 print:border-slate-400">
                                <div className="w-64 text-center">
                                    <div className="border-b border-black w-full h-5 mb-2"></div>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 print:text-black">Assinatura do Colaborador</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* CSS de Impressão Global */}
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 12mm; }
                    header { display: none !important; }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { background: white !important; padding: 0 !important; }
                }
            `}</style>
        </main>
    );
}

export default function RelatorioPage() {
    return (
        <Suspense fallback={null}>
            <ConteudoRelatorio />
        </Suspense>
    );
}