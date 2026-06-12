"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface RotaCadastrada {
    id: string;
    nome_rota: string;
    origem: string;
    destino_final: string;
    km_total: number;
    pontos_parada: string[] | null;
    turno: 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada' | null;
    horarios_operacionais: string[] | null;
}

interface ViagemDespacho {
    id: string;
    status_viagem: string;
    data_saida: string;
    data_chegada: string | null;
    observacoes: string | null;
    veiculos: { fabricante: string; modelo: string; placa: string | null; tem_placa: boolean } | null;
    motoristas: { nome_completo: string } | null;
    rotas: { nome_rota: string; origem: string; destino_final: string; km_total: number; turno: string | null; horarios_operacionais: string[] | null } | null;
}

export default function PainelRotasPage() {
    const [rotas, setRotas] = useState<RotaCadastrada[]>([]);
    const [viagens, setViagens] = useState<ViagemDespacho[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState<'viagens' | 'itinerarios'>('viagens');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function buscarDadosLogistica() {
        setCarregando(true);
        try {
            const { data: dataRotas } = await supabase.from('rotas').select('*').order('nome_rota');
            if (dataRotas) setRotas(dataRotas);

            const { data: dataViagens, error: errV } = await supabase
                .from('viagens_despacho')
                .select(`
                    id, status_viagem, data_saida, data_chegada, observacoes,
                    veiculos(fabricante, modelo, placa, tem_placa),
                    motoristas(nome_completo),
                    rotas(nome_rota, origem, destino_final, km_total, turno, horarios_operacionais)
                `)
                .order('data_saida', { ascending: false });

            if (errV) throw errV;
            if (dataViagens) setViagens(dataViagens as unknown as ViagemDespacho[]);

        } catch (err) {
            console.error("Erro ao carregar painel de controle de rotas:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        buscarDadosLogistica();
    }, []);

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
            buscarDadosLogistica();
        } catch (err) {
            console.error("Erro ao atualizar status da viagem:", err);
        }
    };

    const resumoMétricas = useMemo(() => {
        const emTransito = viagens.filter(v => v.status_viagem === 'Em trânsito').length;
        const concluidas = viagens.filter(v => v.status_viagem === 'Concluída').length;
        return { emTransito, concluidas, totalRotas: rotas.length };
    }, [viagens, rotas]);

    // Função auxiliar para pintar as tags de turnos operacionais
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

            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`, backgroundSize: '45px 45px' }} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* CABEÇALHO */}
                <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/[0.05] pb-6 px-2">
                    <div>
                        <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-1.5 block hover:opacity-80 transition-all">
                            ← Logística de Frota
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                            Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Rotas & Despacho</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold">
                            Monitoramento de turnos diários, janelas de horários e frotas ativas
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <Link href="/dashboard/frota/rotas/criar" className="bg-[#222936] hover:bg-[#2b3547] border border-white/[0.05] text-slate-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                            ➕ Criar Itinerário
                        </Link>
                        <Link href="/dashboard/frota/rotas/vincular" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10">
                            🚀 Despachar Veículo (Vincular)
                        </Link>
                    </div>
                </header>

                {/* PLACAR LOGÍSTICO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-blue-400">Veículos em Trânsito</p>
                        <p className="text-2xl font-mono font-black mt-1 text-white">{resumoMétricas.emTransito}</p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Viagens Concluídas</p>
                        <p className="text-2xl font-mono font-black mt-1 text-emerald-400">{resumoMétricas.concluidas}</p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Linhas de Rotas Ativas</p>
                        <p className="text-2xl font-mono font-black mt-1 text-slate-300">{resumoMétricas.totalRotas}</p>
                    </div>
                </div>

                {/* ALTERNADOR DE ABAS */}
                <div className="flex items-center border-b border-white/[0.04] px-2 gap-6">
                    <button
                        onClick={() => setAbaAtiva('viagens')}
                        className={`pb-3 text-xs uppercase tracking-widest font-black transition-all border-b-2 ${abaAtiva === 'viagens' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        🚚 Monitor de Viagens ({viagens.filter(v=>v.status_viagem==='Em trânsito').length})
                    </button>
                    <button
                        onClick={() => setAbaAtiva('itinerarios')}
                        className={`pb-3 text-xs uppercase tracking-widest font-black transition-all border-b-2 ${abaAtiva === 'itinerarios' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        🗺️ Itinerários, Turnos e Horários ({rotas.length})
                    </button>
                </div>

                {/* PAINEL PRINCIPAL */}
                <div className="relative bg-[#1a1f29]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 min-h-[380px]">
                    {carregando ? (
                        <div className="text-center py-32 text-[10px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                            Acessando canais de tráfego...
                        </div>
                    ) : abaAtiva === 'viagens' ? (
                        viagens.length === 0 ? (
                            <div className="text-center py-28 text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum despacho ativo registrado.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                        <th className="pb-3 pl-2">Veículo / Placa</th>
                                        <th className="pb-3">Condutor</th>
                                        <th className="pb-3">Destino / Janela Operacional</th>
                                        <th className="pb-3 text-center">Data Saída</th>
                                        <th className="pb-3 text-center">Status</th>
                                        <th className="pb-3 text-right pr-2">Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.01]">
                                    {viagens.map(v => (
                                        <tr key={v.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="py-4 pl-2">
                                                <p className="font-black text-white uppercase text-xs">
                                                    {v.veiculos ? `${v.veiculos.fabricante} ${v.veiculos.modelo}` : 'N/A'}
                                                </p>
                                                <span className="font-mono font-bold text-[9px] text-blue-400 uppercase tracking-wider mt-0.5 block">
                                                        {v.veiculos?.tem_placa ? `Placa: ${v.veiculos.placa}` : '⚙️ Maquinário'}
                                                    </span>
                                            </td>
                                            <td className="py-4 font-bold text-slate-300 uppercase text-xs">
                                                {v.motoristas?.nome_completo || 'Desconhecido'}
                                            </td>
                                            <td className="py-4">
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
                                                    {v.rotas?.horarios_operacionais && ` • Horários: ${v.rotas.horarios_operacionais.join(', ')}`}
                                                    </span>
                                            </td>
                                            <td className="py-4 text-center font-mono text-[10px] text-slate-400">
                                                {new Date(v.data_saida).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 text-center">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                                        v.status_viagem === 'Em trânsito' ? 'bg-blue-500/5 text-blue-400 border border-blue-500/10 animate-pulse' :
                                                            v.status_viagem === 'Concluída' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' :
                                                                'bg-red-500/5 text-red-400 border border-red-500/10'
                                                    }`}>
                                                        {v.status_viagem}
                                                    </span>
                                            </td>
                                            <td className="py-4 text-right pr-2">
                                                {v.status_viagem === 'Em trânsito' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => alterarStatusViagem(v.id, 'Concluída')}
                                                            className="bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            ✓ Chegou
                                                        </button>
                                                        <button
                                                            onClick={() => alterarStatusViagem(v.id, 'Cancelada')}
                                                            className="bg-red-500/5 hover:bg-red-600 border border-red-500/10 text-red-400 hover:text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            ✕ Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        // TABELA DE ITINERÁRIOS CADASTRADOS (COM TURNOS E MÚLTIPLOS HORÁRIOS)
                        rotas.length === 0 ? (
                            <div className="text-center py-28 text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum itinerário cadastrado.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                        <th className="pb-3 pl-2">Nome do Itinerário</th>
                                        <th className="pb-3 text-center">Turno</th>
                                        <th className="pb-3">Janelas de Horário (Múltiplas)</th>
                                        <th className="pb-3">Trajeto Base</th>
                                        <th className="pb-3">Distância</th>
                                        <th className="pb-3 text-right pr-2">Checkpoints</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.01]">
                                    {rotas.map(r => (
                                        <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="py-4 pl-2 font-black text-white uppercase text-xs">{r.nome_rota}</td>
                                            <td className="py-4 text-center">
                                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getCorTurno(r.turno)}`}>
                                                        {r.turno || 'Não definido'}
                                                    </span>
                                            </td>
                                            <td className="py-4">
                                                {r.horarios_operacionais && r.horarios_operacionais.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {r.horarios_operacionais.map((h, hIdx) => (
                                                            <span key={hIdx} className="bg-black/40 border border-white/[0.06] font-mono text-[9px] text-slate-300 px-2 py-0.5 rounded-md">
                                                                    🕒 {h}
                                                                </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Livre</span>
                                                )}
                                            </td>
                                            <td className="py-4 uppercase text-slate-400 font-bold text-[11px]">
                                                {r.origem} ➔ {r.destino_final}
                                            </td>
                                            <td className="py-4 font-mono text-blue-400 font-black text-xs">{r.km_total} KM</td>
                                            <td className="py-4 text-right pr-2">
                                                {r.pontos_parada && r.pontos_parada.length > 0 ? (
                                                    <span className="text-[9px] font-bold text-slate-400 bg-black/30 border border-white/[0.04] px-2 py-1 rounded-lg uppercase">
                                                            📍 {r.pontos_parada.join(' ➔ ')}
                                                        </span>
                                                ) : (
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Direto</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.1</div>
            </footer>
        </main>
    );
}