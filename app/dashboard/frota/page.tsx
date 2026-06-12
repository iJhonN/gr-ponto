"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface ViagemDespacho {
    id: string;
    status_viagem: string;
    data_saida: string;
    data_chegada: string | null;
    observacoes: string | null;
    veiculos: { fabricante: string; modelo: string; placa: string | null; tem_placa: boolean } | null;
    motoristas: { nome_completo: string } | null;
    rotas: { nome_rota: string; origem: string; destino_final: string; km_total: number; turno: string | null } | null;
}

export default function HubFrotaPage() {
    const [viagens, setViagens] = useState<ViagemDespacho[]>([]);
    const [carregandoViagens, setCarregandoViagens] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Carrega logs de tráfego ativos no pátio
    async function buscarViagensAtivas() {
        setCarregandoViagens(true);
        try {
            const { data, error } = await supabase
                .from('viagens_despacho')
                .select(`
                    id, status_viagem, data_saida, data_chegada, observacoes,
                    veiculos(fabricante, modelo, placa, tem_placa),
                    motoristas(nome_completo),
                    rotas(nome_rota, origem, destino_final, km_total, turno)
                `)
                .order('data_saida', { ascending: false });

            if (error) throw error;
            if (data) setViagens(data as unknown as ViagemDespacho[]);
        } catch (err) {
            console.error("Erro ao alimentar monitor da home de frotas:", err);
        } finally {
            setCarregandoViagens(false);
        }
    }

    useEffect(() => {
        buscarViagensAtivas();
    }, []);

    // Atalho operacional rápido para fechar a viagem direto pela Home
    const alterarStatusViagem = async (id: string, novoStatus: string) => {
        try {
            const payload: any = { status_viagem: novoStatus };
            if (novoStatus === 'Concluída') {
                payload.data_chegada = new Date().toISOString();
            }

            const { error } = await supabase
                .from('viagens_despacho')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            buscarViagensAtivas(); // Atualiza painel
        } catch (err) {
            console.error("Erro ao encerrar viagem via hub:", err);
        }
    };

    // Filtra apenas o que está rodando nas estradas agora
    const viagensEmAndamento = useMemo(() => {
        return viagens.filter(v => v.status_viagem === 'Em trânsito');
    }, [viagens]);

    // Configuração com as 4 grandes áreas operacionais da Frota
    const secoes = [
        {
            titulo: "Controle de Veículos",
            descricao: "Gerenciamento da garagem, especificações de montadoras (VW, XCMG) e odômetros.",
            icone: "🚚",
            rotaHub: "/dashboard/frota/veiculo",
            links: [
                { nome: "📄 Cadastrar", rota: "/dashboard/frota/veiculo/cadastro" },
                { nome: "📋 Listar Frota", rota: "/dashboard/frota/veiculo/lista" }
            ]
        },
        {
            titulo: "Controle de Motoristas",
            descricao: "Cadastro de condutores, controle cadastral de CNH, contatos e escalas por cidade.",
            icone: "👤",
            rotaHub: "/dashboard/frota/motorista",
            links: [
                { nome: "➕ Vincular", rota: "/dashboard/frota/motorista/cadastro" },
                { nome: "🪪 Ver Lista", rota: "/dashboard/frota/motorista/lista" }
            ]
        },
        {
            titulo: "Gestão de Rotas & Despachos",
            descricao: "Desenho de trajetos fixos com paradas, janelas de horário e ordens de tráfego ativos.",
            icone: "🗺️",
            rotaHub: "/dashboard/frota/rotas",
            links: [
                { nome: "🗺️ Itinerários", rota: "/dashboard/frota/rotas" },
                { nome: "🚀 Despachar", rota: "/dashboard/frota/rotas/vincular" }
            ]
        },
        {
            titulo: "Combustível & Consumo",
            descricao: "Auditoria de bombas, lançamentos de cupons e relatórios de médias dinâmicas (KM/L).",
            icone: "⛽",
            rotaHub: "/dashboard/frota/combustivel",
            links: [
                { nome: "⚡ Abastecer", rota: "/dashboard/frota/combustivel/cadastrar" },
                { nome: "📊 Ver Médias", rota: "/dashboard/frota/combustivel/media" }
            ]
        }
    ];

    const getCorTurno = (turno: string | null) => {
        switch (turno) {
            case 'Manhã': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Tarde': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'Noite': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Madrugada': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-white/[0.04]';
        }
    };

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* BACKGROUND MATRIX */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.02] rounded-full blur-[160px]" />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* HEADER SUPERIOR */}
                <header className="w-full text-center border-b border-white/[0.05] pb-6 max-w-3xl mx-auto px-4">
                    <Link href="/dashboard" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-2 block hover:opacity-85 transition-all">
                        ← Retornar ao Terminal Geral
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none">
                        Módulo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Logística & Frotas</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-bold leading-relaxed">
                        Painel Geral de monitoramento integrado, ativos rodoviários e expedição
                    </p>
                </header>

                {/* PLACAR ANALÍTICO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full px-2">
                    <div className="bg-[#1a1f29]/60 border border-white/[0.03] p-4 rounded-xl text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-blue-400">Em Trânsito Agora</p>
                        <p className="text-xl font-mono font-black mt-0.5 text-white">{viagensEmAndamento.length}</p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.03] p-4 rounded-xl text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Fluxo Histórico Total</p>
                        <p className="text-xl font-mono font-black mt-0.5 text-slate-400">{viagens.length}</p>
                    </div>
                </div>

                {/* GRID DE DIRECIONAMENTO PRINCIPAL (REESTRUTURADO PARA 4 COLUNAS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-2">
                    {secoes.map((s, idx) => (
                        <div
                            key={idx}
                            className="relative bg-[#1a1f29] border border-white/[0.05] rounded-[28px] p-5 shadow-xl flex flex-col justify-between overflow-hidden group"
                        >
                            <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xl bg-white/[0.02] border border-white/[0.04] w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                                        {s.icone}
                                    </div>
                                    <Link
                                        href={s.rotaHub}
                                        className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-all tracking-wider"
                                    >
                                        Acessar Hub ➔
                                    </Link>
                                </div>
                                <h2 className="text-xs font-black uppercase text-white tracking-wide mb-1.5">
                                    {s.titulo}
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium leading-normal mb-5 min-h-[50px]">
                                    {s.descricao}
                                </p>
                            </div>

                            {/* SHORTCUT LINKS ATALHO */}
                            <div className="grid grid-cols-2 gap-2 border-t border-white/[0.04] pt-4">
                                {s.links.map((link, lIdx) => (
                                    <Link
                                        key={lIdx}
                                        href={link.rota}
                                        className="bg-[#222936] hover:bg-[#2b3447] border border-white/[0.03] text-slate-300 hover:text-white py-2 rounded-lg text-center text-[9px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        {link.nome}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MONITOR DE ROTAS EM ANDAMENTO / TRÂNSITO */}
                <div className="relative bg-[#1a1f29]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 mt-2 min-h-[300px]">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-white/[0.03] pb-4">
                        <div>
                            <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                Monitor de Tráfego Ativo (Viagens na Rua)
                            </h3>
                            <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Veículos em andamento e ordens de tráfego emitidas</p>
                        </div>
                        <Link href="/dashboard/frota/rotas" className="text-blue-400 font-bold text-[9px] uppercase tracking-wider hover:underline">
                            Ver Histórico Completo →
                        </Link>
                    </div>

                    {carregandoViagens ? (
                        <div className="text-center py-20 text-[9px] uppercase font-black text-slate-500 tracking-[3px] animate-pulse">
                            Baixando telemetria de tráfego...
                        </div>
                    ) : viagensEmAndamento.length === 0 ? (
                        <div className="text-center py-20 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Nenhum veículo em trânsito no momento. Todos os ativos encontram-se na garagem.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 pl-2">Veículo / Equipamento</th>
                                    <th className="pb-3">Condutor</th>
                                    <th className="pb-3">Itinerário de Entrega</th>
                                    <th className="pb-3 text-center">Horário Saída</th>
                                    <th className="pb-3 text-right pr-2">Ações Rápidas</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.01]">
                                {viagensEmAndamento.map(v => (
                                    <tr key={v.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="py-3.5 pl-2">
                                            <p className="font-black text-white uppercase text-xs">
                                                {v.veiculos ? `${v.veiculos.fabricante} ${v.veiculos.modelo}` : 'N/A'}
                                            </p>
                                            <span className="font-mono font-bold text-[9px] text-blue-400 uppercase tracking-wider block mt-0.5">
                                                    {v.veiculos?.tem_placa ? `Placa: ${v.veiculos.placa}` : '⚙️ Maquinário'}
                                                </span>
                                        </td>
                                        <td className="py-3.5 font-bold text-slate-300 uppercase text-xs">
                                            {v.motoristas?.nome_completo || 'N/A'}
                                        </td>
                                        <td className="py-3.5">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-200 text-xs uppercase">{v.rotas?.nome_rota}</p>
                                                {v.rotas?.turno && (
                                                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getCorTurno(v.rotas.turno)}`}>
                                                            {v.rotas.turno}
                                                        </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] text-slate-500 block mt-0.5 uppercase tracking-tight">
                                                    {v.rotas?.origem} ➔ {v.rotas?.destino_final} ({v.rotas?.km_total} KM)
                                                </span>
                                        </td>
                                        <td className="py-3.5 text-center font-mono text-[10px] text-slate-400">
                                            {new Date(v.data_saida).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-3.5 text-right pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => alterarStatusViagem(v.id, 'Concluída')}
                                                    className="bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-colors"
                                                >
                                                    ✓ Chegou
                                                </button>
                                                <button
                                                    onClick={() => alterarStatusViagem(v.id, 'Cancelada')}
                                                    className="bg-red-500/5 hover:bg-red-600 border border-red-500/10 text-red-400 hover:text-white px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-colors"
                                                >
                                                    ✕ Abortar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* RODAPÉ OPERACIONAL */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-4">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.3</div>
            </footer>
        </main>
    );
}