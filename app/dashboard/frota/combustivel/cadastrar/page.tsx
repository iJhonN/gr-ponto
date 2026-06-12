"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface VeiculoOptions {
    id: string;
    label: string;
    km_atual: number | null;
}

export default function CadastrarAbastecimentoPage() {
    const [veiculos, setVeiculos] = useState<VeiculoOptions[]>([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoOptions | null>(null);

    // Campos do Formulário
    const [veiculoId, setVeiculoId] = useState('');
    const [litragem, setLitragem] = useState('');
    const [kmAbastecimento, setKmAbastecimento] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [postoCombustivel, setPostoCombustivel] = useState('');
    const [dataHora, setDataHora] = useState('');

    const [carregandoListas, setCarregandoListas] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Carrega os veículos da garagem corporativa
    async function carregarVeiculos() {
        setCarregandoListas(true);
        try {
            const { data, error } = await supabase
                .from('veiculos')
                .select('id, fabricante, modelo, placa, tem_placa, km_atual')
                .order('modelo');

            if (error) throw error;
            if (data) {
                setVeiculos(data.map(v => ({
                    id: v.id,
                    km_atual: v.km_atual,
                    label: `${v.fabricante} ${v.modelo} ${v.tem_placa ? `[${v.placa}]` : '(⚙️ Maquinário)'}`
                })));
            }
        } catch (err) {
            console.error("Erro ao buscar veículos para abastecimento:", err);
        } finally {
            setCarregandoListas(false);
        }
    }

    useEffect(() => {
        carregarVeiculos();
        // Define data e hora local de agora como padrão no input
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        setDataHora(agora.toISOString().slice(0, 16));
    }, []);

    // Monitora a troca de veículo no select para exibir o KM anterior em tempo real
    const handleVeiculoChange = (id: string) => {
        setVeiculoId(id);
        const localizado = veiculos.find(v => v.id === id) || null;
        setVeiculoSelecionado(localizado);
        if (localizado && localizado.km_atual) {
            setKmAbastecimento(String(localizado.km_atual)); // Joga o KM atual como sugestão inicial
        } else {
            setKmAbastecimento('');
        }
    };

    const handleSalvarAbastecimento = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            const kmInformado = parseInt(kmAbastecimento);

            // Validação de segurança: Não deixa lançar um KM menor do que o veículo já tem rodado
            if (veiculoSelecionado && veiculoSelecionado.km_atual && kmInformado < veiculoSelecionado.km_atual) {
                throw new Error(`Inconsistência de Odômetro! O KM informado (${kmInformado.toLocaleString('pt-BR')}) não pode ser menor que o último KM registrado (${veiculoSelecionado.km_atual.toLocaleString('pt-BR')}).`);
            }

            const payload = {
                veiculo_id: veiculoId,
                litragem: parseFloat(litragem),
                km_abastecimento: kmInformado,
                valor_total: parseFloat(valorTotal),
                posto_combustivel: postoCombustivel.trim().toUpperCase(),
                data_hora: new Date(dataHora).toISOString()
            };

            const { error } = await supabase
                .from('abastecimentos')
                .insert([payload]);

            if (error) throw error;

            setStatusFeed({
                tipo: 'sucesso',
                texto: '⛽ Abastecimento registrado! O odômetro do veículo foi atualizado no banco.'
            });

            // Reseta campos do formulário
            setVeiculoId('');
            setVeiculoSelecionado(null);
            setLitragem('');
            setKmAbastecimento('');
            setValorTotal('');
            setPostoCombustivel('');

            // Atualiza a lista local de veículos para refletir o novo KM na próxima escolha
            carregarVeiculos();

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha ao registrar cupom de combustível.'
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
                    <Link href="/dashboard/frota/combustivel" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Voltar ao Hub de Combustível
                    </Link>
                </div>

                {/* FORM CONTAINER */}
                <div className="w-full max-w-2xl relative bg-[#1a1f29]/95 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="mb-8">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <span>⛽</span> Lançar Cupom de <span className="text-blue-400">Abastecimento</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                            Insira os dados fiscais da bomba. O odômetro central do veículo será atualizado sincronizado.
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
                            Conectando com a garagem central...
                        </div>
                    ) : (
                        <form onSubmit={handleSalvarAbastecimento} className="space-y-6">

                            {/* SELECT VEÍCULO */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">1. Identifique o Veículo / Ativo Abastecido</label>
                                <select
                                    value={veiculoId}
                                    onChange={e => handleVeiculoChange(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="">-- Escolha o veículo --</option>
                                    {veiculos.map(v => (
                                        <option key={v.id} value={v.id} className="bg-[#1a1f29]">{v.label}</option>
                                    ))}
                                </select>
                                {veiculoSelecionado && (
                                    <span className="text-[9px] font-mono text-slate-500 block pl-1 uppercase">
                                        ℹ️ Último odômetro registrado no banco: <strong className="text-blue-400">{veiculoSelecionado.km_atual ? `${veiculoSelecionado.km_atual.toLocaleString('pt-BR')} KM` : '0 KM'}</strong>
                                    </span>
                                )}
                            </div>

                            {/* ROW 1: KM DO ATO E LITRAGEM */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">2. Odômetro Atual no Painel (KM)</label>
                                    <input
                                        type="number"
                                        placeholder="EX: 45280"
                                        value={kmAbastecimento}
                                        onChange={e => setKmAbastecimento(e.target.value)}
                                        className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono placeholder-slate-700"
                                        required
                                        disabled={enviando || !veiculoId}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">3. Volume Abastecido (Litros)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="EX: 85.50"
                                        value={litragem}
                                        onChange={e => setLitragem(e.target.value)}
                                        className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono placeholder-slate-700"
                                        required
                                        disabled={enviando}
                                    />
                                </div>
                            </div>

                            {/* ROW 2: VALOR TOTAL E POSTO */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">4. Valor Total Pago (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="EX: 485.90"
                                        value={valorTotal}
                                        onChange={e => setValorTotal(e.target.value)}
                                        className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono placeholder-slate-700"
                                        required
                                        disabled={enviando}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">5. Posto de Combustível (Estabelecimento)</label>
                                    <input
                                        type="text"
                                        placeholder="EX: POSTO IPIRANGA - MATRIZ BR116"
                                        value={postoCombustivel}
                                        onChange={e => setPostoCombustivel(e.target.value)}
                                        className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase placeholder-slate-700"
                                        required
                                        disabled={enviando}
                                    />
                                </div>
                            </div>

                            {/* DATA E HORA DO COMPROVANTE */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">6. Data e Hora do Abastecimento</label>
                                <input
                                    type="datetime-local"
                                    value={dataHora}
                                    onChange={e => setDataHora(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-300 text-xs font-mono"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                                style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {enviando ? "Processando Lançamento..." : "Consolidar Abastecimento (Enter)"}
                            </button>
                        </form>
                    )}
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Fuel Intelligence v1.0</div>
            </footer>
        </main>
    );
}