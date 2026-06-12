"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function TotemPontoPage() {
    const [idCracha, setIdCracha] = useState('');
    const [statusEnvio, setStatusEnvio] = useState({ tipo: '', texto: '' });
    const [carregando, setCarregando] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Prende o foco no input para o leitor de código de barras estar sempre pronto
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [statusEnvio]);

    // Força o foco de volta se clicarem em qualquer outro lugar da tela
    useEffect(() => {
        const forcarFocoGeral = () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        window.addEventListener("click", forcarFocoGeral);
        return () => window.removeEventListener("click", forcarFocoGeral);
    }, []);

    const handleLimpar = () => {
        setIdCracha('');
        setStatusEnvio({ tipo: '', texto: '' });
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleVerificarERegistrarPonto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idCracha.trim() || carregando) return;

        setCarregando(true);
        setStatusEnvio({ tipo: '', texto: '' });

        try {
            // 1. Busca funcionário no Supabase para validar a existência
            const { data: func } = await supabase
                .from('funcionarios')
                .select('id, nome, sobrenome')
                .eq('id', idCracha.trim())
                .maybeSingle();

            if (!func) {
                setStatusEnvio({ tipo: 'erro', texto: 'Crachá inválido ou não encontrado.' });
                setIdCracha('');
                setCarregando(false);
                return;
            }

            // 2. Calcula os limites do dia atual no fuso de Brasília
            const dataBrasilia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const hora = dataBrasilia.getHours();
            const minuto = dataBrasilia.getMinutes();
            const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

            const inicioDia = new Date(dataBrasilia); inicioDia.setHours(0,0,0,0);
            const fimDia = new Date(dataBrasilia); fimDia.setHours(23,59,59,999);

            // 3. Puxa quantas batidas ele já deu hoje para saber o tipo sequencial da próxima
            const { data: pointsHoje } = await supabase
                .from('pontos')
                .select('id')
                .eq('funcionario_id', func.id)
                .gte('data_registro', inicioDia.toISOString())
                .lte('data_registro', fimDia.toISOString());

            const numBatidas = pointsHoje ? pointsHoje.length : 0;

            let tipoBatida = 'entrada';
            if (numBatidas === 1) tipoBatida = 'saida_almoco';
            else if (numBatidas === 2) tipoBatida = 'volta_almoco';
            else if (numBatidas === 3) tipoBatida = 'saida_fim';

            // --- VALIDAÇÃO DE ATRASO BASEADA NOS HORÁRIOS DE FUNCIONAMENTO ---
            let textoObservacao = 'Jornada Normal';

            if (tipoBatida === 'entrada' && horaFormatada > '08:05') {
                textoObservacao = 'Atraso';
            } else if (tipoBatida === 'volta_almoco' && horaFormatada > '14:05') {
                textoObservacao = 'Atraso';
            }

            // 4. Injeta direto na tabela com o status de observação correto
            const { error: errInsert } = await supabase
                .from('pontos')
                .insert([{
                    funcionario_id: func.id,
                    nome_completo: `${func.nome} ${func.sobrenome}`,
                    data_registro: new Date().toISOString(),
                    hora_formatada: horaFormatada,
                    tipo_batida: tipoBatida,
                    observacao: textoObservacao,
                    status_auditoria: 'validado',
                    dispositivo_origem: 'totem'
                }]);

            if (errInsert) throw errInsert;

            setStatusEnvio({
                tipo: 'sucesso',
                texto: `Ponto registrado! Bom trabalho, ${func.nome}. (${horaFormatada})`
            });

            // Zera o estado do input e libera para o próximo bipe em 3 segundos
            setTimeout(() => {
                handleLimpar();
            }, 3000);

        } catch (err) {
            console.error(err);
            setStatusEnvio({ tipo: 'erro', texto: 'Erro de conexão ao salvar o ponto.' });
        } finally {
            setCarregando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030303] flex items-center justify-center p-6 font-sans overflow-hidden antialiased">

            {/* ── FUNDO TECNOLÓGICO DO LOGIN ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Grid sutil */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
                {/* Glow central */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(234,88,12,0.07), transparent)' }}
                />
                {/* Glows periféricos */}
                <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-orange-600/[0.06] rounded-full blur-[140px]" />
                <div className="absolute -bottom-60 -right-60 w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-[120px]" />
            </div>

            {/* ── CARD PRINCIPAL DO TOTEM ── */}
            <div className="relative w-full max-w-sm z-10">

                {/* Brilho sutil atrás do card */}
                <div className="absolute -inset-px rounded-[44px] bg-gradient-to-b from-orange-500/10 to-transparent blur-sm" />

                <div className="relative w-full bg-[#09090b]/90 border border-white/[0.06] rounded-[40px] shadow-2xl backdrop-blur-2xl overflow-hidden">

                    {/* Linha de acabamento topo */}
                    <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

                    {/* Botão de Voltar para o Dashboard */}
                    <Link
                        href="/dashboard"
                        className="absolute top-6 left-8 text-[8px] font-black uppercase text-slate-500 tracking-[3px] hover:text-orange-400 transition-colors z-20 flex items-center gap-1"
                    >
                        ← Dashboard
                    </Link>

                    <div className="p-8 sm:p-10 pt-14">

                        {/* ── CABEÇALHO DO PAINEL ── */}
                        <div className="text-center mb-8">
                            <span className="text-orange-500 font-black text-[8px] uppercase tracking-[4px] bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10 select-none">
                                Terminal Biométrico Optico
                            </span>
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-3 leading-none">
                                Totem de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Ponto</span>
                            </h1>
                            <p className="text-[9px] text-slate-600 uppercase tracking-[4px] font-bold mt-1.5">
                                GR Cluster Controller
                            </p>
                        </div>

                        {/* ── FEEDBACK DO STATUS DO REGISTRO ── */}
                        {statusEnvio.texto && (
                            <div className={`mb-6 flex items-start gap-2.5 p-4 rounded-2xl border ${
                                statusEnvio.tipo === 'sucesso'
                                    ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/[0.06] border-red-500/20 text-red-400'
                            }`}>
                                <div className="text-xs shrink-0">{statusEnvio.tipo === 'sucesso' ? '✅' : '⚠️'}</div>
                                <p className="text-[10px] font-black uppercase tracking-wide leading-relaxed">
                                    {statusEnvio.texto}
                                </p>
                            </div>
                        )}

                        {/* ── INTERFACE DO LEITOR ÓPTICO ── */}
                        <form onSubmit={handleVerificarERegistrarPonto} className="space-y-4">
                            <div className="w-full bg-black/40 border border-white/[0.05] rounded-3xl p-6 text-center border-dashed relative overflow-hidden flex flex-col items-center justify-center gap-4 group transition-all duration-300">

                                {/* Efeito de scanner laser piscando ao fundo */}
                                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent top-1/2 -translate-y-1/2 animate-bounce pointer-events-none" />

                                <div className="relative z-10 w-12 h-12 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-center text-orange-400 text-lg font-black group-hover:scale-105 transition-transform">
                                    💳
                                </div>

                                <div className="relative z-10">
                                    <p className="text-xs font-black uppercase tracking-[2px] text-slate-300">Aproxime o Crachá</p>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[3px] mt-1">O escaneamento está ativo</p>
                                </div>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Aguardando código..."
                                    value={idCracha}
                                    onChange={e => setIdCracha(e.target.value)}
                                    className="relative z-10 w-full bg-[#030303]/80 border border-white/[0.05] focus:border-orange-500/30 text-center px-4 py-3 rounded-xl text-xs font-mono tracking-[4px] text-orange-400 font-bold outline-none placeholder-slate-800 disabled:opacity-40 uppercase"
                                    autoFocus
                                    disabled={carregando}
                                />
                            </div>
                        </form>

                    </div>

                    {/* ── RODAPÉ DO CARD ── */}
                    <div className="border-t border-white/[0.04] px-10 py-4 flex items-center justify-center bg-black/20">
                        <p className="text-[8px] uppercase tracking-[3px] text-slate-700 font-bold">
                            GR Cluster · Felinto Tech Control
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}