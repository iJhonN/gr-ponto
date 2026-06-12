"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function HubCombustivelPage() {
    const [totalGasto, setTotalGasto] = useState(0);
    const [totalLitros, setTotalLitros] = useState(0);
    const [carregando, setCarregando] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function buscarMetricasCombustivel() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('abastecimentos')
                .select('valor_total, litragem');

            if (error) throw error;

            if (data) {
                const gasto = data.reduce((acc, curr) => acc + Number(curr.valor_total), 0);
                const litros = data.reduce((acc, curr) => acc + Number(curr.litragem), 0);
                setTotalGasto(gasto);
                setTotalLitros(litros);
            }
        } catch (err) {
            console.error("Erro ao carregar métricas de combustível:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        buscarMetricasCombustivel();
    }, []);

    const opcoes = [
        {
            titulo: "Lançar Abastecimento",
            descricao: "Registrar litragem, valor pago, posto e atualizar o odômetro do veículo automaticamente.",
            icone: "⛽",
            rota: "/dashboard/frota/combustivel/cadastrar"
        },
        {
            titulo: "Histórico de Abastecimentos",
            descricao: "Listagem detalhada de cupons fiscais lançados, datas e locais de parada.",
            icone: "📋",
            rota: "/dashboard/frota/combustivel/lista"
        },
        {
            titulo: "Média de Consumo (KM/L)",
            descricao: "Análise inteligente de consumo real para identificar desvios de combustível ou manutenção.",
            icone: "📊",
            rota: "/dashboard/frota/combustivel/media"
        }
    ];

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.012]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center max-w-[1400px] mx-auto">

                {/* HEADER SUPERIOR */}
                <header className="w-full text-center border-b border-white/[0.05] pb-6 max-w-2xl mx-auto px-4 mb-8">
                    <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-2 block hover:opacity-80 transition-all">
                        ← Menu de Frota Geral
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Combustível & Auditoria</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-bold leading-relaxed">
                        Controle de bombas, odômetros integrados e eficiência energética de frotas
                    </p>
                </header>

                {/* PLACAR DE GASTOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full px-4 mb-10">
                    <div className="bg-[#1a1f29]/60 border border-white/[0.03] p-4 rounded-xl text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Investimento Total em Bombas</p>
                        <p className="text-xl font-mono font-black mt-0.5 text-blue-400">
                            {carregando ? "..." : `R$ ${totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.03] p-4 rounded-xl text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Volume Total Escoado</p>
                        <p className="text-xl font-mono font-black mt-0.5 text-white">
                            {carregando ? "..." : `${totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`}
                        </p>
                    </div>
                </div>

                {/* GRID DE DIRECIONAMENTO CONTROLE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4">
                    {opcoes.map((o, idx) => (
                        <Link
                            key={idx}
                            href={o.rota}
                            className="group relative bg-[#1a1f29] border border-white/[0.05] hover:border-blue-500/40 rounded-[24px] p-6 shadow-xl transition-all flex flex-col justify-between hover:-translate-y-1"
                        >
                            <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                            <div className="space-y-4">
                                <div className="text-2xl bg-white/[0.02] border border-white/[0.04] w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                                    {o.icone}
                                </div>
                                <div>
                                    <h2 className="text-xs font-black uppercase text-white group-hover:text-blue-400 tracking-wide transition-colors">
                                        {o.titulo} ➔
                                    </h2>
                                    <p className="text-[11px] text-slate-400 font-medium leading-normal mt-1">
                                        {o.descricao}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* RODAPÉ OPERACIONAL */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-4">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Fuel Intelligence v1.0</div>
            </footer>
        </main>
    );
}