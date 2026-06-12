"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Abastecimento {
    id: string;
    litragem: number;
    km_abastecimento: number;
    valor_total: number;
    posto_combustivel: string;
    data_hora: string;
    veiculos: { fabricante: string; modelo: string; placa: string | null; tem_placa: boolean } | null;
}

export default function ListaAbastecimentosPage() {
    const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarHistorico() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('abastecimentos')
                .select(`
                    id, litragem, km_abastecimento, valor_total, posto_combustivel, data_hora,
                    veiculos(fabricante, modelo, placa, tem_placa)
                `)
                .order('data_hora', { ascending: false });

            if (error) throw error;
            if (data) setAbastecimentos(data as unknown as Abastecimento[]);
        } catch (err) {
            console.error("Erro ao buscar histórico de abastecimentos:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarHistorico();
    }, []);

    // Filtro dinâmico em memória no Mac Air
    const abastecimentosFiltrados = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        return abastecimentos.filter(a => {
            const nomeVeiculo = a.veiculos ? `${a.veiculos.fabricante} ${a.veiculos.modelo}`.toLowerCase() : '';
            const placaVeiculo = a.veiculos?.placa ? a.veiculos.placa.toLowerCase() : '';
            const posto = a.posto_combustivel.toLowerCase();

            return nomeVeiculo.includes(termo) || placaVeiculo.includes(termo) || posto.includes(termo);
        });
    }, [abastecimentos, pesquisa]);

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
                            Histórico de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Abastecimentos</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold">
                            Auditoria de notas fiscais, postos credenciados e evolução de odômetros
                        </p>
                    </div>

                    <div className="w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por veículo, placa ou posto..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-blue-500/40 px-4 py-2.5 rounded-xl text-white text-xs font-bold outline-none w-full sm:w-72 uppercase transition-all placeholder-slate-700"
                        />
                    </div>
                </header>

                {/* TABELA DE REGISTROS */}
                <div className="relative bg-[#1a1f29]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 min-h-[400px]">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                    {carregando ? (
                        <div className="text-center py-32 text-[10px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                            Buscando registros em bombas...
                        </div>
                    ) : abastecimentosFiltrados.length === 0 ? (
                        <div className="py-32 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum cupom de combustível localizado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 pl-4">Veículo / Equipamento</th>
                                    <th className="pb-3">Posto de Combustível</th>
                                    <th className="pb-3 text-center">Volume (Litros)</th>
                                    <th className="pb-3 text-center">Odômetro (KM)</th>
                                    <th className="pb-3 text-center">Preço por Litro</th>
                                    <th className="pb-3 text-right pr-4">Valor Total</th>
                                    <th className="pb-3 text-right pr-4">Data / Hora</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.01]">
                                {abastecimentosFiltrados.map(a => {
                                    const precoPorLitro = a.valor_total / a.litragem;
                                    return (
                                        <tr key={a.id} className="hover:bg-white/[0.01] transition-colors group">
                                            {/* DADOS VEÍCULO */}
                                            <td className="py-4 pl-4">
                                                <p className="font-black text-slate-200 uppercase tracking-tight text-xs">
                                                    {a.veiculos ? `${a.veiculos.fabricante} ${a.veiculos.modelo}` : 'N/A'}
                                                </p>
                                                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider block mt-0.5">
                                                        {a.veiculos?.tem_placa ? `Placa: ${a.veiculos.placa}` : '⚙️ Maquinário'}
                                                    </span>
                                            </td>
                                            {/* POSTO */}
                                            <td className="py-4 font-bold text-slate-300 uppercase text-xs">
                                                {a.posto_combustivel}
                                            </td>
                                            {/* LITRAGEM */}
                                            <td className="py-4 text-center font-mono text-xs font-bold text-slate-200">
                                                {Number(a.litragem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
                                            </td>
                                            {/* KM DO ATO */}
                                            <td className="py-4 text-center font-mono text-xs font-bold text-slate-400">
                                                {Number(a.km_abastecimento).toLocaleString('pt-BR')} km
                                            </td>
                                            {/* MÉDIA PREÇO/LITRO */}
                                            <td className="py-4 text-center font-mono text-[11px] text-slate-500">
                                                R$ {precoPorLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {/* VALOR PAGO */}
                                            <td className="py-4 text-right pr-4 font-mono text-xs font-black text-blue-400">
                                                R$ {Number(a.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {/* DATA E HORA */}
                                            <td className="py-4 text-right pr-4 font-mono text-[10px] text-slate-500">
                                                {new Date(a.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

            {/* RODAPÉ */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Fuel Intelligence v1.0</div>
            </footer>
        </main>
    );
}