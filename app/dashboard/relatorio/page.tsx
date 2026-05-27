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
    data: string;
    acao: 'entrada' | 'saida';
}

function ConteudoRelatorio() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<RegistroPonto[]>([]);
    const [carregando, setCarregando] = useState(true);

    const dataAtual = new Date();
    const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth() + 1);
    const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const carregarDados = async () => {
            if (!baseUrl) return;
            setCarregando(true);
            try {
                const [resFunc, resPontos] = await Promise.all([
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/ponto`, { cache: 'no-store' })
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

    const obterDiasDoMes = () => {
        const qtdDias = new Date(anoSelecionado, mesSelecionado, 0).getDate();
        return Array.from({ length: qtdDias }, (_, i) => i + 1);
    };

    const obterJornadaDiaria = (funcionarioId: string, dia: number) => {
        const pontosDoDia = pontos.filter(p => {
            const dataPonto = new Date(p.data);
            return (
                String(p.funcionarioId) === String(funcionarioId) &&
                dataPonto.getDate() === dia &&
                (dataPonto.getMonth() + 1) === mesSelecionado &&
                dataPonto.getFullYear() === anoSelecionado
            );
        });

        pontosDoDia.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        const formatarHora = (ponto?: RegistroPonto) => {
            if (!ponto) return '---';
            return new Date(ponto.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        };

        return {
            entrada: formatarHora(pontosDoDia[0]),
            saidaAlmoço: formatarHora(pontosDoDia[1]),
            voltaAlmoço: formatarHora(pontosDoDia[2]),
            saidaFinal: formatarHora(pontosDoDia[3]),
        };
    };

    const diasDoMes = obterDiasDoMes();

    return (
        <main className="min-h-screen bg-black text-white p-4 font-sans print:bg-white print:text-black print:p-0">

            {/* PAINEL DE CONTROLE WEB */}
            <header className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-[20px] border border-white/5 print:hidden">
                <div>
                    <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                    <h1 className="text-2xl font-black uppercase italic text-white leading-none">Fechamento <span className="text-orange-500">Mensal</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(Number(e.target.value))}
                        className="bg-black border border-white/10 px-3 py-1.5 rounded-xl font-bold text-white outline-none focus:border-orange-500 text-sm"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Mês {String(m).padStart(2, '0')}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => window.print()}
                        className="bg-orange-600 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all shadow-md shadow-orange-900/20"
                    >
                        🖨️ Imprimir Folhas
                    </button>
                </div>
            </header>

            {/* RELATÓRIOS INDIVIDUAIS */}
            <section className="max-w-5xl mx-auto flex flex-col gap-8 print:gap-0">
                {carregando ? (
                    <div className="text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px] print:hidden">Sincronizando Banco de Dados...</div>
                ) : (
                    funcionarios.map((func) => (
                        <div
                            key={func.id}
                            className="bg-white text-black p-6 mb-8 border border-slate-200 rounded-[30px] print:border-none print:p-0 print:m-0 print:break-inside-avoid print:page-break-after-always bg-white"
                        >
                            {/* CABEÇALHO INTEGRADO */}
                            <div className="grid grid-cols-2 border-b-2 border-black pb-2 mb-3 text-xs">
                                <div className="pr-4 border-r border-slate-200 print:border-slate-300">
                                    <h2 className="text-base font-black uppercase tracking-tight text-black leading-none mb-0.5">GR AUTOPECAS LTDA</h2>
                                    <p className="text-[10px] font-bold text-slate-700 font-mono mb-0.5">CNPJ: 51.415.349/0001-25</p>
                                    <p className="text-[9px] text-slate-500 leading-tight">
                                        Rua Coronel Vicente Ramos, Nº1552 — Olho D'água dos Cazuzinhas <br />
                                        Arapiraca - AL
                                    </p>
                                </div>

                                <div className="pl-4 flex flex-col justify-between text-right">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Colaborador</p>
                                        <h3 className="text-base font-black uppercase italic text-black leading-tight">{func.nome} {func.sobrenome}</h3>
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide leading-none mt-0.5">{func.cargo} • ID: {func.id}</p>
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-800 mt-1">
                                        Competência: {String(mesSelecionado).padStart(2, '0')}/{anoSelecionado}
                                    </p>
                                </div>
                            </div>

                            {/* TABELA DE BATIDAS COMPACTA */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                    <tr className="border-b border-slate-300 text-slate-800 uppercase font-black text-[9px] tracking-wider bg-slate-100 print:bg-slate-100">
                                        <th className="py-1 px-1.5 w-12">Data</th>
                                        <th className="py-1 px-1.5 w-14 text-center">Entrada</th>
                                        <th className="py-1 px-1.5 w-14 text-center">Saída Alm</th>
                                        <th className="py-1 px-1.5 w-14 text-center">Volta Alm</th>
                                        <th className="py-1 px-1.5 w-14 text-center">Saída Fim</th>
                                        <th className="py-1 px-2 text-right">Assinatura / Justificativa Ocorrência</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {diasDoMes.map((dia) => {
                                        const jornada = obterJornadaDiaria(func.id, dia);
                                        return (
                                            <tr key={dia} className="border-b border-slate-100 hover:bg-slate-50 print:border-slate-200">
                                                <td className="py-0.5 px-1.5 font-mono font-black text-black">
                                                    {String(dia).padStart(2, '0')}/{String(mesSelecionado).padStart(2, '0')}
                                                </td>
                                                <td className={`py-0.5 px-1.5 font-mono text-center font-bold w-14 ${jornada.entrada !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.entrada}
                                                </td>
                                                <td className={`py-0.5 px-1.5 font-mono text-center font-bold w-14 ${jornada.saidaAlmoço !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.saidaAlmoço}
                                                </td>
                                                <td className={`py-0.5 px-1.5 font-mono text-center font-bold w-14 ${jornada.voltaAlmoço !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.voltaAlmoço}
                                                </td>
                                                <td className={`py-0.5 px-1.5 font-mono text-center font-bold w-14 ${jornada.saidaFinal !== '---' ? 'text-black' : 'text-slate-300 print:text-slate-400'}`}>
                                                    {jornada.saidaFinal}
                                                </td>
                                                <td className="py-0.5 px-2 border-l border-dashed border-slate-200 print:border-slate-300"></td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                    end</table>
                            </div>

                            {/* ASSINATURAS DO RODAPÉ (AJUSTADO: Mais margem superior e melhor recuo para escrita) */}
                            <div className="mt-16 pt-4 border-t border-slate-300 flex justify-between items-center gap-12 print:mt-12">
                                <div className="w-60 text-center">
                                    <div className="border-b border-black w-full h-6 mb-1"></div>
                                    <p className="text-[8px] font-black uppercase tracking-wider text-black">Responsável GR Autopeças</p>
                                </div>
                                <div className="w-60 text-center">
                                    <div className="border-b border-black w-full h-6 mb-1"></div>
                                    <p className="text-[8px] font-black uppercase tracking-wider text-black">Assinatura do Colaborador</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* ESTILOS DE IMPRESSÃO */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 8mm 10mm 8mm 10mm;
                    }
                    header { display: none !important; }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { background: white !important; padding: 0 !important; }

                    .print\:page-break-after-always {
                        page-break-after: always !important;
                        break-after: always !important;
                    }
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