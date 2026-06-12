"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CriarRotaPage() {
    // Estados dos campos básicos
    const [nomeRota, setNomeRota] = useState('');
    const [origem, setOrigem] = useState('');
    const [destinoFinal, setDestinoFinal] = useState('');
    const [kmTotal, setKmTotal] = useState('');
    const [turno, setTurno] = useState('Manhã');
    const [tempoEstimado, setTempoEstimado] = useState(''); // Ex: "02:30" ou "12h"

    // Estados para as listas dinâmicas (Múltiplas Paradas e Múltiplos Horários)
    const [novaParada, setNovaParada] = useState('');
    const [pontosParada, setPontosParada] = useState<string[]>([]);

    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [horariosOperacionais, setHorariosOperacionais] = useState<string[]>([]);

    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Adiciona uma parada no array dinâmico
    const adicionarParada = () => {
        const parada = novaParada.trim().toUpperCase();
        if (parada && !pontosParada.includes(parada)) {
            setPontosParada([...pontosParada, parada]);
            setNovaParada('');
        }
    };

    // Remove uma parada da lista
    const removerParada = (indexToRemove: number) => {
        setPontosParada(pontosParada.filter((_, index) => index !== indexToRemove));
    };

    // Adiciona um intervalo de horário operacional (Início - Fim)
    const adicionarHorario = () => {
        if (horaInicio && horaFim) {
            const novoIntervalo = `${horaInicio} até ${horaFim}`;
            if (!horariosOperacionais.includes(novoIntervalo)) {
                setHorariosOperacionais([...horariosOperacionais, novoIntervalo]);
                setHoraInicio('');
                setHoraFim('');
            }
        }
    };

    // Remove um intervalo de horário da lista
    const removerHorario = (indexToRemove: number) => {
        setHorariosOperacionais(horariosOperacionais.filter((_, index) => index !== indexToRemove));
    };

    const handleSalvarRota = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            if (!nomeRota.trim() || !origem.trim() || !destinoFinal.trim() || !kmTotal) {
                throw new Error("Por favor, preencha todos os campos estruturais obrigatórios.");
            }

            // Prepara as observações ou metadados de tempo se preenchido
            const sufixoDescritivo = tempoEstimado.trim()
                ? `DURAÇÃO ESTIMADA: ${tempoEstimado.trim().toUpperCase()}`
                : '';

            const payload = {
                nome_rota: nomeRota.trim().toUpperCase(),
                origem: origem.trim().toUpperCase(),
                destino_final: destinoFinal.trim().toUpperCase(),
                km_total: parseFloat(kmTotal),
                turno: turno,
                // Passa os arrays do estado nativo do react diretamente para as colunas TEXT[] do Postgres
                pontos_parada: pontosParada.length > 0 ? pontosParada : null,
                horarios_operacionais: horariosOperacionais.length > 0 ? horariosOperacionais : null
            };

            const { error } = await supabase
                .from('rotas')
                .insert([payload]);

            if (error) throw error;

            setStatusFeed({
                tipo: 'sucesso',
                texto: `🗺️ Itinerário "${payload.nome_rota}" configurado e salvo com sucesso!`
            });

            // Reseta o formulário por completo para a próxima entrada
            setNomeRota('');
            setOrigem('');
            setDestinoFinal('');
            setKmTotal('');
            setTurno('Manhã');
            setTempoEstimado('');
            setPontosParada([]);
            setHorariosOperacionais([]);

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha ao gravar rotas no Supabase.'
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                <div className="w-full max-w-2xl mb-4 text-left px-2">
                    <Link href="/dashboard/frota/rotas" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Voltar ao Painel Logístico
                    </Link>
                </div>

                {/* FORM CONTAINER */}
                <div className="w-full max-w-2xl relative bg-[#1a1f29]/95 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="mb-8">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <span>🗺️</span> Desenhar <span className="text-blue-400">Novo Itinerário</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                            Defina o trajeto base, classificação de turnos e múltiplas janelas operacionais
                        </p>
                    </div>

                    {statusFeed.texto && (
                        <div className={`mb-6 p-4 rounded-xl border text-[10px] font-black uppercase tracking-wide text-center leading-relaxed ${
                            statusFeed.tipo === 'sucesso' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            {statusFeed.texto}
                        </div>
                    )}

                    <form onSubmit={handleSalvarRota} className="space-y-6">

                        {/* IDENTIFICAÇÃO E TURNO */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Nome Identificador do Trajeto</label>
                                <input
                                    type="text"
                                    placeholder="EX: ROTA EXPRESSA DISTRIBUIÇÃO NORTE"
                                    value={nomeRota}
                                    onChange={e => setNomeRota(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase placeholder-slate-700 transition-all"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Turno Predominante</label>
                                <select
                                    value={turno}
                                    onChange={e => setTurno(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-300 text-xs font-bold uppercase cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="Manhã">🌅 Manhã</option>
                                    <option value="Tarde">☀️ Tarde</option>
                                    <option value="Noite">🌌 Noite</option>
                                    <option value="Madrugada">🦇 Madrugada</option>
                                </select>
                            </div>
                        </div>

                        {/* ORIGEM E DESTINO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Ponto de Partida (Origem)</label>
                                <input
                                    type="text"
                                    placeholder="EX: GALPÃO CENTRAL - MATRIZ"
                                    value={origem}
                                    onChange={e => setOrigem(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Destino Final</label>
                                <input
                                    type="text"
                                    placeholder="EX: FILIAL DISTRIBUIDORA SUL"
                                    value={destinoFinal}
                                    onChange={e => setDestinoFinal(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* QUILOMETRAGEM E TEMPO ESTIMADO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Quilometragem Total do Percurso (KM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="EX: 145.80"
                                    value={kmTotal}
                                    onChange={e => setKmTotal(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Duração Estimada de Viagem (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="EX: 2H e 30MIN / 12H"
                                    value={tempoEstimado}
                                    onChange={e => setTempoEstimado(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs uppercase font-bold placeholder-slate-700"
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ADICIONAR MÚLTIPLOS HORÁRIOS OPERACIONAIS (PEDIDO ADICIONAL COORDENADO) */}
                        <div className="bg-[#222936]/40 border border-white/[0.03] p-5 rounded-2xl space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Janelas de Saída/Horários Operacionais</label>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[100px]">
                                    <span className="text-[8px] font-bold block text-slate-500 uppercase tracking-wider mb-1">Início</span>
                                    <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="w-full bg-black border border-white/[0.06] p-2 rounded-lg text-xs font-mono text-white outline-none" />
                                </div>
                                <div className="flex-1 min-w-[100px]">
                                    <span className="text-[8px] font-bold block text-slate-500 uppercase tracking-wider mb-1">Fim</span>
                                    <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="w-full bg-black border border-white/[0.06] p-2 rounded-lg text-xs font-mono text-white outline-none" />
                                </div>
                                <button type="button" onClick={adicionarHorario} className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 px-3 py-2 rounded-xl text-[9px] font-black uppercase mt-4 h-9 tracking-wider transition-colors">
                                    ➕ Incluir Janela
                                </button>
                            </div>

                            {horariosOperacionais.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                    {horariosOperacionais.map((h, i) => (
                                        <span key={i} className="bg-black/60 border border-white/[0.06] rounded-md px-2.5 py-1 text-[9px] font-mono text-slate-300 flex items-center gap-2 uppercase font-bold">
                                            🕒 {h}
                                            <button type="button" onClick={() => removerHorario(i)} className="text-red-400 hover:text-red-600 font-sans font-black text-xs">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CONFIGURADOR DE PONTOS DE PARADA / CHECKPOINTS (REQUISITO GERAL) */}
                        <div className="bg-[#222936]/40 border border-white/[0.03] p-5 rounded-2xl space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Pontos de Parada / Checkpoints Dinâmicos</label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="EX: POSTO GRAAL KM 45 / PARADA BALANÇA"
                                    value={novaParada}
                                    onChange={e => setNovaParada(e.target.value)}
                                    className="flex-1 bg-black border border-white/[0.06] px-3 py-2 rounded-xl text-xs font-bold uppercase outline-none text-white placeholder-slate-800"
                                    disabled={enviando}
                                />
                                <button
                                    type="button"
                                    onClick={adicionarParada}
                                    className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                                >
                                    📍 Inserir
                                </button>
                            </div>

                            {pontosParada.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                    {pontosParada.map((p, i) => (
                                        <span key={i} className="bg-black/60 border border-white/[0.06] rounded-md px-2.5 py-1 text-[9px] font-bold text-slate-300 flex items-center gap-2 uppercase tracking-tight">
                                            <span className="text-indigo-400">#{i+1}</span> {p}
                                            <button type="button" onClick={() => removerParada(i)} className="text-red-400 hover:text-red-600 font-black text-xs">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {enviando ? "Consolidando Linha..." : "Registrar Rota e Itinerário (Enter)"}
                        </button>
                    </form>
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.1</div>
            </footer>
        </main>
    );
}