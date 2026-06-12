"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function PontoEmergenciaPage() {
    const [funcionarioId, setFuncionarioId] = useState('');
    const [justificativa, setJustificativa] = useState('');
    const [etapa, setEtapa] = useState<'identificacao' | 'justificativa'>('identificacao');
    const [funcionarioDados, setFuncionarioDados] = useState<any>(null);

    const [processando, setProcessando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Passo 1: Valida o ID do crachá e checa se é Saída ou Retorno
    const verificarFuncionario = async (e: React.FormEvent) => {
        e.preventDefault();
        const idLimpo = funcionarioId.trim().toUpperCase();
        if (!idLimpo) return;

        setProcessando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            // Busca o funcionário ativo
            const { data: func, error: funcErr } = await supabase
                .from('funcionarios')
                .select('id, nome, sobrenome, cargo')
                .eq('id', idLimpo)
                .single();

            if (funcErr || !func) {
                throw new Error("Colaborador não localizado. Verifique o ID do crachá.");
            }

            setFuncionarioDados(func);

            // Verifica se este funcionário já possui uma saída de emergência aberta (sem horário de retorno)
            const { data: saidaAberta, error: saidaErr } = await supabase
                .from('saidas_emergencia')
                .select('*')
                .eq('funcionario_id', idLimpo)
                .is('horario_retorno', null)
                .order('horario_saida', { ascending: false })
                .maybeSingle();

            if (saidaAberta) {
                // FLUXO DE RETORNO: Se já tem saída aberta, registra o retorno imediatamente
                const { error: updateErr } = await supabase
                    .from('saidas_emergencia')
                    .update({ horario_retorno: new Date().toISOString() })
                    .eq('id', saidaAberta.id);

                if (updateErr) throw updateErr;

                setStatusFeed({
                    tipo: 'sucesso',
                    texto: `Retorno registrado! Bom trabalho, ${func.nome}.`
                });
                resetarFormulario();
            } else {
                // FLUXO DE SAÍDA: Avança para a tela de justificativa
                setEtapa('justificativa');
            }

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Falha ao processar identificação.' });
        } finally {
            setProcessando(false);
        }
    };

    // Passo 2: Confirma a saída gravando a justificativa obrigatória
    const confirmarSaida = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!justificativa.trim()) {
            setStatusFeed({ tipo: 'erro', texto: 'Informe o motivo da saída de emergência.' });
            return;
        }

        setProcessando(true);

        try {
            const { error } = await supabase
                .from('saidas_emergencia')
                .insert([{
                    funcionario_id: funcionarioDados.id,
                    justificativa: justificativa.trim(),
                    horario_saida: new Date().toISOString()
                }]);

            if (error) throw error;

            setStatusFeed({
                tipo: 'sucesso',
                texto: `Saída autorizada! Registro concluído para ${funcionarioDados.nome}.`
            });
            resetarFormulario();

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Erro ao salvar saída emergencial.' });
        } finally {
            setProcessando(false);
        }
    };

    const resetarFormulario = () => {
        setTimeout(() => {
            setFuncionarioId('');
            setJustificativa('');
            setFuncionarioDados(null);
            setEtapa('identificacao');
            setStatusFeed({ tipo: '', texto: '' });
        }, 3000);
    };

    return (
        <main className="min-h-screen bg-[#07080a] text-white flex items-center justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-md bg-[#0e1117] border border-white/[0.04] rounded-[40px] p-8 shadow-2xl relative overflow-hidden">

                {/* Linha de Design Superior */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-amber-500 to-transparent"></div>

                <div className="text-center mb-8">
                    <span className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10">
                        Módulo de Exceção
                    </span>
                    <h1 className="text-2xl font-black uppercase italic tracking-tight mt-3">
                        Saída / Retorno <span className="text-orange-500">Extra</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                        GR CLUSTER CONTROLER
                    </p>
                </div>

                {/* FEEDBACK FEED */}
                {statusFeed.texto && (
                    <div className={`mb-6 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-wide border ${
                        statusFeed.tipo === 'sucesso'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/5 border-red-500/20 text-red-400'
                    }`}>
                        {statusFeed.tipo === 'sucesso' ? '✅' : '⚠️'} {statusFeed.texto}
                    </div>
                )}

                {/* ETAPA 1: LEITURA DO CRACHÁ */}
                {etapa === 'identificacao' && (
                    <form onSubmit={verificarFuncionario} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">
                                Identificação do Colaborador
                            </label>
                            <input
                                type="text"
                                placeholder="Bipe o crachá ou digite o ID..."
                                value={funcionarioId}
                                onChange={e => setFuncionarioId(e.target.value)}
                                disabled={processando}
                                className="w-full bg-[#07080a] border border-white/[0.05] p-4 rounded-xl outline-none focus:border-orange-500/50 text-orange-400 text-sm font-mono tracking-widest text-center"
                                autoFocus
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processando || !funcionarioId.trim()}
                            className="w-full bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-black text-xs uppercase tracking-[2px] disabled:opacity-30 transition-all pt-4"
                        >
                            {processando ? "Verificando..." : "Confirmar Identidade →"}
                        </button>
                    </form>
                )}

                {/* ETAPA 2: JUSTIFICATIVA DE SAÍDA */}
                {etapa === 'justificativa' && funcionarioDados && (
                    <form onSubmit={confirmarSaida} className="space-y-5">
                        <div className="bg-[#07080a] border border-white/[0.03] p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Colaborador Identificado:</p>
                            <h3 className="text-sm font-black text-white uppercase italic mt-0.5">
                                {funcionarioDados.nome} {funcionarioDados.sobrenome}
                            </h3>
                            <p className="text-[10px] text-orange-500 font-mono font-bold uppercase tracking-wide mt-0.5">
                                {funcionarioDados.cargo}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">
                                Motivo / Justificativa da Saída
                            </label>
                            <textarea
                                placeholder="Ex: Ida ao banco, consulta médica rápida, retirada de autopeça externa..."
                                value={justificativa}
                                onChange={e => setJustificativa(e.target.value)}
                                disabled={processando}
                                rows={3}
                                className="w-full bg-[#07080a] border border-white/[0.05] p-4 rounded-xl outline-none focus:border-orange-500/50 text-white text-xs font-medium resize-none placeholder-slate-600"
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setEtapa('identificacao');
                                    setFuncionarioDados(null);
                                }}
                                className="w-1/3 bg-white/[0.02] border border-white/[0.08] text-slate-400 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processando || !justificativa.trim()}
                                className="w-2/3 bg-gradient-to-r from-orange-600 to-orange-500 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-[2px] disabled:opacity-30 transition-all pt-4"
                            >
                                {processando ? "Registrando..." : "Registrar Saída 🗓️"}
                            </button>
                        </div>
                    </form>
                )}

                {/* VOLTAR PRO PANEL */}
                <div className="mt-8 text-center border-t border-white/[0.02] pt-4">
                    <Link href="/dashboard" className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-orange-500 transition-colors">
                        ← Voltar ao Terminal Principal
                    </Link>
                </div>

            </div>
        </main>
    );
}