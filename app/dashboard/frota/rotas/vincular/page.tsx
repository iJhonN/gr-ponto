"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface DataSelect {
    id: string;
    label: string;
}

export default function VincularRotaViagemPage() {
    const router = useRouter();

    // Estados para carregar as opções do banco
    const [veiculos, setVeiculos] = useState<DataSelect[]>([]);
    const [motoristas, setMotoristas] = useState<DataSelect[]>([]);
    const [rotas, setRotas] = useState<DataSelect[]>([]);

    // Estados dos campos do formulário
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaId, setMotoristaId] = useState('');
    const [rotaId, setRotaId] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const [carregandoListas, setCarregandoListas] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Carrega todos os dados relacionais necessários para o despacho
    async function carregarDadosFormulario() {
        setCarregandoListas(true);
        try {
            // 1. Busca veículos disponíveis
            const { data: dataV } = await supabase.from('veiculos').select('id, fabricante, modelo, placa, tem_placa').order('modelo');
            if (dataV) {
                setVeiculos(dataV.map(v => ({
                    id: v.id,
                    label: `${v.fabricante} ${v.modelo} ${v.tem_placa ? `[${v.placa}]` : '(⚙️ Maquinário)'}`
                })));
            }

            // 2. Busca motoristas ativos
            const { data: dataM } = await supabase.from('motoristas').select('id, nome_completo').order('nome_completo');
            if (dataM) {
                setMotoristas(dataM.map(m => ({
                    id: m.id,
                    label: m.nome_completo
                })));
            }

            // 3. Busca itinerários configurados
            const { data: dataR } = await supabase.from('rotas').select('id, nome_rota, km_total, turno').order('nome_rota');
            if (dataR) {
                setRotas(dataR.map(r => ({
                    id: r.id,
                    label: `${r.nome_rota} (${r.km_total} KM) - Turno: ${r.turno}`
                })));
            }

        } catch (err) {
            console.error("Erro ao alimentar listas de despacho:", err);
        } finally {
            setCarregandoListas(false);
        }
    }

    useEffect(() => {
        carregarDadosFormulario();
    }, []);

    const handleDespacharViagem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!veiculoId || !motoristaId || !rotaId) {
            setStatusFeed({ tipo: 'erro', texto: 'Por favor, selecione todos os elementos obrigatórios da viagem.' });
            return;
        }

        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            const payload = {
                veiculo_id: veiculoId,
                motorista_id: motoristaId,
                rota_id: rotaId,
                status_viagem: 'Em trânsito', // Nasce ativo nas rodovias
                observacoes: observacoes.trim() || null,
                data_saida: new Date().toISOString()
            };

            const { error } = await supabase
                .from('viagens_despacho')
                .insert([payload]);

            if (error) throw error;

            setStatusFeed({
                tipo: 'sucesso',
                texto: '🚀 Sucesso! Ordem de tráfego emitida e veículo despachado.'
            });

            // Limpa o formulário
            setVeiculoId('');
            setMotoristaId('');
            setRotaId('');
            setObservacoes('');

            // Redireciona o usuário de volta para o monitor principal após 1.5 segundos
            setTimeout(() => {
                router.push('/dashboard/frota/rotas');
            }, 1500);

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha ao consolidar ordem de tráfego.'
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

                <div className="w-full max-w-xl mb-4 text-left px-2">
                    <Link href="/dashboard/frota/rotas" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Cancelar e Voltar ao Monitor
                    </Link>
                </div>

                {/* CONTAINER CARD */}
                <div className="w-full max-w-xl relative bg-[#1a1f29]/95 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="mb-8 text-center sm:text-left">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                            <span>🚀</span> Emitir Ordem de <span className="text-blue-400">Despacho</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                            Vincule um ativo de frota, motorista escalado e itinerário operacional
                        </p>
                    </div>

                    {statusFeed.texto && (
                        <div className={`mb-6 p-4 rounded-xl border text-[10px] font-black uppercase tracking-wide text-center leading-relaxed ${
                            statusFeed.tipo === 'sucesso' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            {statusFeed.texto}
                        </div>
                    )}

                    {carregandoListas ? (
                        <div className="text-center py-20 text-[9px] uppercase font-black text-slate-500 tracking-[3px] animate-pulse">
                            Alimentando barramentos relacionais do banco...
                        </div>
                    ) : (
                        <form onSubmit={handleDespacharViagem} className="space-y-5">

                            {/* SELECT VEÍCULO */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">1. Selecione o Veículo / Ativo</label>
                                <select
                                    value={veiculoId}
                                    onChange={e => setVeiculoId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="">-- Escolha o veículo da garagem --</option>
                                    {veiculos.map(v => (
                                        <option key={v.id} value={v.id} className="bg-[#1a1f29]">{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECT MOTORISTA */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">2. Escolha o Condutor Escalado</label>
                                <select
                                    value={motoristaId}
                                    onChange={e => setMotoristaId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="">-- Escolha o motorista parceiro --</option>
                                    {motoristas.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#1a1f29]">{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECT ROTA */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">3. Itinerário & Turno de Destino</label>
                                <select
                                    value={rotaId}
                                    onChange={e => setRotaId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="">-- Vincular linha de trajeto --</option>
                                    {rotas.map(r => (
                                        <option key={r.id} value={r.id} className="bg-[#1a1f29]">{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* OBSERVAÇÕES */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Notas de Despacho / Dados da Carga (Opcional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ex: Transporte de autopeças Volkswagen, carga lacrada nº 45520, saída autorizada."
                                    value={observacoes}
                                    onChange={e => setObservacoes(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-medium placeholder-slate-700 transition-all resize-none"
                                    disabled={enviando}
                                />
                            </div>

                            {/* INTEL FOOTNOTE */}
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-black/20 p-3 rounded-xl border border-white/[0.02]">
                                ℹ️ Ao consolidar o envio, o veículo entrará automaticamente em estado de trânsito no painel de monitoramento e colherá o carimbo de data/hora (Timestamp UTC) atual.
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                                style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {enviando ? "Abrindo Ordem de Tráfego..." : "Confirmar e Despachar Viagem (Enter)"}
                            </button>
                        </form>
                    )}
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.1</div>
            </footer>
        </main>
    );
}