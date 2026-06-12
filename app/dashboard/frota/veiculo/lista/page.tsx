"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Veiculo {
    id: string;
    tem_placa: boolean;
    placa: string | null;
    chassis: string | null;
    fabricante: string;
    modelo: string;
    ano: number;
    km_litro: number | null;
    km_atual: number | null;
    foto_url: string | null;
    data_cadastro: string;
}

export default function ListaVeiculosPage() {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, emplacados, maquinario

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarFrota() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('veiculos')
                .select('*')
                .order('fabricante', { ascending: true });

            if (error) throw error;
            if (data) setVeiculos(data as Veiculo[]);
        } catch (err) {
            console.error("Erro ao consultar frota de veículos:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarFrota();
    }, []);

    // Processamento de filtros rápidos em memória no MacBook Air
    const frotaFiltrada = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        return veiculos.filter(v => {
            const batePesquisa =
                v.modelo.toLowerCase().includes(termo) ||
                v.fabricante.toLowerCase().includes(termo) ||
                (v.placa && v.placa.toLowerCase().includes(termo));

            const bateTipo =
                filtroTipo === 'todos' ||
                (filtroTipo === 'emplacados' && v.tem_placa) ||
                (filtroTipo === 'maquinario' && !v.tem_placa);

            return batePesquisa && bateTipo;
        });
    }, [veiculos, pesquisa, filtroTipo]);

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID BACKGROUND EFFECT */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.01]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '45px 45px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* CABEÇALHO */}
                <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/[0.05] pb-6 px-2">
                    <div>
                        <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-1.5 block hover:opacity-80 transition-all">
                            ← Menu de Frotas
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                            Controle e <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Ativos de Frota</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold">
                            Monitoramento de rodagem, consumo médio e especificações técnicas
                        </p>
                    </div>

                    {/* BARRA DE PESQUISA E FILTROS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por placa, modelo ou fabricante..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-blue-500/40 px-4 py-2.5 rounded-xl text-white text-xs font-bold outline-none w-full sm:w-72 uppercase transition-all placeholder-slate-700"
                        />

                        <div className="flex items-center bg-black border border-white/[0.06] p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setFiltroTipo('todos')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroTipo === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFiltroTipo('emplacados')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroTipo === 'emplacados' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Rodoviários
                            </button>
                            <button
                                onClick={() => setFiltroTipo('maquinario')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    filtroTipo === 'maquinario' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Maquinários
                            </button>
                        </div>
                    </div>
                </header>

                {/* GRID DE CARDS DOS VEÍCULOS */}
                {carregando ? (
                    <div className="text-center py-36 text-[10px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                        Sincronizando garagem corporativa...
                    </div>
                ) : frotaFiltrada.length === 0 ? (
                    <div className="py-36 text-center bg-[#1a1f29]/40 rounded-[32px] border border-white/[0.03]">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum veículo localizado com os filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                        {frotaFiltrada.map(v => (
                            <div
                                key={v.id}
                                className="bg-[#1a1f29] border border-white/[0.05] rounded-[28px] overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                            >
                                {/* ÁREA DA IMAGEM / PREVIEW */}
                                <div className="h-44 w-full bg-[#151922] relative flex items-center justify-center border-b border-white/[0.03]">
                                    {v.foto_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={v.foto_url}
                                            alt={v.modelo}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <span className="text-4xl block opacity-40">🚚</span>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">Sem Mídia Cadastrada</span>
                                        </div>
                                    )}

                                    {/* TAG DE PLACA FLUTUANTE */}
                                    <div className="absolute top-4 right-4">
                                        {v.tem_placa && v.placa ? (
                                            <div className="bg-white text-black border border-blue-900 rounded-md px-2.5 py-1 text-[10px] font-mono font-black tracking-widest shadow-md uppercase">
                                                {v.placa}
                                            </div>
                                        ) : (
                                            <div className="bg-indigo-950/90 text-indigo-400 border border-indigo-500/30 rounded-md px-2.5 py-1 text-[8px] font-black tracking-widest shadow-md uppercase">
                                                ⚙️ Maquinário
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CORPO DAS ESPECIFICAÇÕES */}
                                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                                    <div>
                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest block">
                                            {v.fabricante}
                                        </span>
                                        <h2 className="text-sm font-black text-white uppercase tracking-tight mt-0.5 group-hover:text-blue-400 transition-colors">
                                            {v.modelo}
                                        </h2>
                                        {v.chassis && (
                                            <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
                                                Chassis: {v.chassis}
                                            </p>
                                        )}
                                    </div>

                                    {/* TABELA DE MÉTRICAS OPERACIONAIS */}
                                    <div className="grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4 text-center">
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.02]">
                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Ano</p>
                                            <p className="text-xs font-mono font-black text-slate-200 mt-0.5">{v.ano}</p>
                                        </div>
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.02]">
                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Média</p>
                                            <p className="text-xs font-mono font-black text-slate-200 mt-0.5">
                                                {v.km_litro ? `${v.km_litro} km/l` : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.02]">
                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Odômetro</p>
                                            <p className="text-xs font-mono font-black text-slate-200 mt-0.5">
                                                {v.km_atual ? `${v.km_atual.toLocaleString('pt-BR')} km` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RODAPÉ */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.0</div>
            </footer>
        </main>
    );
}