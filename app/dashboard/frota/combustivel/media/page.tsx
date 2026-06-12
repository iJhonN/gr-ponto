"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface AbastecimentoRow {
    id: string;
    veiculo_id: string;
    litragem: number;
    km_abastecimento: number;
    valor_total: number;
    data_hora: string;
    veiculos: { fabricante: string; modelo: string; placa: string | null; tem_placa: boolean } | null;
}

interface MetricaVeiculo {
    veiculoId: string;
    nome: string;
    placa: string;
    totalAbastecimentos: number;
    totalGasto: number;
    totalLitros: number;
    kmInicial: number;
    kmFinal: number;
    kmRodadosTotal: number;
    mediaGeralKmL: number | string;
    historicoMedias: { data: string; kmL: number; kmRodados: number; litros: number }[];
}

export default function MediaConsumoPage() {
    const [abastecimentos, setAbastecimentos] = useState<AbastecimentoRow[]>([]);
    const [carregando, setCarregando] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarDados() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('abastecimentos')
                .select(`
                    id, veiculo_id, litragem, km_abastecimento, valor_total, data_hora,
                    veiculos(fabricante, modelo, placa, tem_placa)
                `)
                .order('data_hora', { ascending: true }); // Ordenação cronológica obrigatória para a matemática bater certinho

            if (error) throw error;
            if (data) setAbastecimentos(data as unknown as AbastecimentoRow[]);
        } catch (err) {
            console.error("Erro ao processar barramento de consumo:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // ALGORITMO DE PROCESSAMENTO DE CONSUMO REAL POR JANELAS OPERACIONAIS
    const relatorioConsumo = useMemo(() => {
        const veiculosMap: { [key: string]: AbastecimentoRow[] } = {};

        // 1. Agrupa os cupons fiscais por veículo
        abastecimentos.forEach(abs => {
            if (!veiculosMap[abs.veiculo_id]) {
                veiculosMap[abs.veiculo_id] = [];
            }
            veiculosMap[abs.veiculo_id].push(abs);
        });

        const resultado: MetricaVeiculo[] = [];

        // 2. Passa calculando as diferenças de KM de abastecimentos consecutivos
        Object.keys(veiculosMap).forEach(veiculoId => {
            const lista = veiculosMap[veiculoId];
            const infoVeiculo = lista[0].veiculos;
            const nomeStr = infoVeiculo ? `${infoVeiculo.fabricante} ${infoVeiculo.modelo}` : 'N/A';
            const placaStr = infoVeiculo?.tem_placa && infoVeiculo.placa ? infoVeiculo.placa : '⚙️ MAQUINÁRIO';

            let totalGasto = 0;
            let totalLitros = 0;
            const historicoMedias: MetricaVeiculo['historicoMedias'] = [];

            for (let i = 0; i < lista.length; i++) {
                totalGasto += Number(lista[i].valor_total);
                totalLitros += Number(lista[i].litragem);

                if (i > 0) {
                    const atual = lista[i];
                    const anterior = lista[i - 1];

                    const kmRodadosNaJanela = atual.km_abastecimento - anterior.km_abastecimento;
                    const consumoParcial = kmRodadosNaJanela / Number(atual.litragem);

                    if (kmRodadosNaJanela > 0 && atual.litragem > 0) {
                        historicoMedias.push({
                            data: new Date(atual.data_hora).toLocaleDateString('pt-BR'),
                            kmRodados: kmRodadosNaJanela,
                            litros: Number(atual.litragem),
                            kmL: Number(consumoParcial.toFixed(2))
                        });
                    }
                }
            }

            const kmInicial = lista[0].km_abastecimento;
            const kmFinal = lista[lista.length - 1].km_abastecimento;
            const kmRodadosTotal = kmFinal - kmInicial;

            // Média global: Só calcula se houver variação de rodagem real (mínimo 2 registros)
            let mediaGeralKmL: number | string = "Aguardando próximo abastecimento";
            if (historicoMedias.length > 0 && kmRodadosTotal > 0) {
                const somaKmJanelas = historicoMedias.reduce((acc, c) => acc + c.kmRodados, 0);
                const somaLitrosJanelas = historicoMedias.reduce((acc, c) => acc + c.litros, 0);
                mediaGeralKmL = Number((somaKmJanelas / somaLitrosJanelas).toFixed(2));
            }

            resultado.push({
                veiculoId,
                nome: nomeStr,
                placa: placaStr,
                totalAbastecimentos: lista.length,
                totalGasto,
                totalLitros,
                kmInicial,
                kmFinal,
                kmRodadosTotal,
                mediaGeralKmL,
                historicoMedias: historicoMedias.reverse() // Exibe a última média calculada primeiro
            });
        });

        return resultado;
    }, [abastecimentos]);

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`, backgroundSize: '45px 45px' }} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* CABEÇALHO */}
                <header className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/[0.05] pb-6 px-2">
                    <div>
                        <Link href="/dashboard/frota/combustivel" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-1.5 block hover:opacity-80 transition-all">
                            ← Hub de Combustível
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                            Eficiência de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Consumo Médio</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold">
                            Análise de rendimento real (KM por Litro) e auditoria de frotas
                        </p>
                    </div>
                </header>

                {/* PAINEL DE CARDS DE DESEMPENHO */}
                {carregando ? (
                    <div className="text-center py-36 text-[10px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                        Rodando matrizes de telemetria...
                    </div>
                ) : relatorioConsumo.length === 0 ? (
                    <div className="py-32 text-center bg-[#1a1f29]/40 rounded-[32px] border border-white/[0.03] mx-2">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lance mais abastecimentos para iniciar o cálculo dinâmico de eficiência.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                        {relatorioConsumo.map(v => (
                            <div
                                key={v.veiculoId}
                                className="bg-[#1a1f29] border border-white/[0.05] rounded-[32px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between gap-6"
                            >
                                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                                {/* CARD HEADER */}
                                <div className="flex justify-between items-start border-b border-white/[0.03] pb-4">
                                    <div>
                                        <span className="text-[10px] bg-white text-black font-mono font-black tracking-wider px-2 py-0.5 rounded shadow-sm uppercase">
                                            {v.placa}
                                        </span>
                                        <h2 className="text-sm font-black text-white uppercase tracking-tight mt-2">
                                            {v.nome}
                                        </h2>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                                            Cupons Computados: {v.totalAbastecimentos}
                                        </p>
                                    </div>

                                    {/* MÉDIA VISUAL EM DESTAQUE */}
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Média Geral Computada</p>
                                        <p className={`text-xl font-mono font-black ${typeof v.mediaGeralKmL === 'number' ? 'text-blue-400' : 'text-slate-600 text-[10px] mt-1.5 font-sans uppercase max-w-[150px] leading-tight'}`}>
                                            {typeof v.mediaGeralKmL === 'number' ? `${v.mediaGeralKmL} km/l` : v.mediaGeralKmL}
                                        </p>
                                    </div>
                                </div>

                                {/* TABELA DE MÉTRICAS COMPLEMENTARES */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.01]">
                                        <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Km Rodados Total</p>
                                        <p className="text-xs font-mono font-black text-slate-200 mt-0.5">{v.kmRodadosTotal.toLocaleString('pt-BR')} km</p>
                                    </div>
                                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.01]">
                                        <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Volume Total</p>
                                        <p className="text-xs font-mono font-black text-slate-200 mt-0.5">{v.totalLitros.toLocaleString('pt-BR')} L</p>
                                    </div>
                                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.01]">
                                        <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Custo Total</p>
                                        <p className="text-xs font-mono font-black text-blue-400/90 mt-0.5">R$ {v.totalGasto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                {/* EVOLUÇÃO DAS ÚLTIMAS JANELAS DE ABASTECIMENTO */}
                                <div className="space-y-2 pt-2 border-t border-white/[0.03]">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 pl-1">Evolução por Janela de Abastecimento</p>
                                    {v.historicoMedias.length === 0 ? (
                                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider pl-1 py-1">
                                            Aguardando novos cupons fiscais para traçar o gráfico de desempenho.
                                        </div>
                                    ) : (
                                        <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-[10px]">
                                            {v.historicoMedias.slice(0, 3).map((h, hIdx) => (
                                                <div key={hIdx} className="bg-black/20 border border-white/[0.02] px-3 py-2 rounded-lg flex justify-between items-center font-mono">
                                                    <span className="text-slate-400 text-[9px] font-sans">{h.data}</span>
                                                    <span className="text-slate-500 text-[9px]">Intervalo: <strong className="text-slate-300">{h.kmRodados}km</strong></span>
                                                    <span className="text-slate-500 text-[9px]">Litros: <strong className="text-slate-300">{h.litros}L</strong></span>
                                                    <span className="text-emerald-400 font-black">{h.kmL} KM/L</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RODAPÉ */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Fuel Intelligence v1.0</div>
            </footer>
        </main>
    );
}