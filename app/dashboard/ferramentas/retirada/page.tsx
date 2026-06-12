"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface FuncionarioAtivo {
    id: string;
    nome: string;
    sobrenome: string;
}

export default function RetiradaDevolucaoPage() {
    const [passo, setPasso] = useState<1 | 2>(1); // 1: Funcionario, 2: Ferramenta
    const [idDigitado, setIdDigitado] = useState('');
    const [funcionarioAtivo, setFuncionarioAtivo] = useState<FuncionarioAtivo | null>(null);
    const [modoManual, setModoManual] = useState(false);

    const [processando, setProcessando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const inputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Mantém o foco no input para receber o laser do leitor de código de barras
    useEffect(() => {
        if (!modoManual) {
            inputRef.current?.focus();
        }
    }, [passo, modoManual]);

    useEffect(() => {
        if (statusFeed.texto && !modoManual) {
            inputRef.current?.focus();
        }
    }, [statusFeed, modoManual]);

    // PASSO 1: Processa o Crachá do Funcionário
    const processarFuncionario = async (codigo: string) => {
        if (!codigo) return;
        setProcessando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            const { data: func, error: errFunc } = await supabase
                .from('funcionarios')
                .select('id, nome, sobrenome')
                .eq('id', codigo)
                .single();

            if (errFunc || !func) {
                throw new Error(`Colaborador ID [${codigo}] não localizado na oficina.`);
            }

            setFuncionarioAtivo(func);
            setPasso(2);
            setIdDigitado('');
            setModoManual(false);
        } catch (err: any) {
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Erro ao validar funcionário.' });
            setIdDigitado('');
        } finally {
            setProcessando(false);
        }
    };

    // PASSO 2: Processa o Código da Ferramenta e grava na tabela ferramenta_movimentacoes
    const processarFerramenta = async (codigo: string) => {
        if (!codigo || !funcionarioAtivo) return;
        setProcessando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            // 1. Busca a ferramenta no inventário estático
            const { data: ferramenta, error: errFerr } = await supabase
                .from('ferramentas')
                .select('*')
                .eq('id', codigo)
                .single();

            if (errFerr || !ferramenta) {
                throw new Error(`Ferramenta código [${codigo}] não cadastrada.`);
            }

            // LÓGICA A: Se a ferramenta está OCUPADA -> DEVOLUÇÃO
            if (ferramenta.status === 'ocupado') {
                // Busca a última movimentação em aberto na tabela ferramenta_movimentacoes para esta ferramenta
                const { data: movAberta, error: errMov } = await supabase
                    .from('ferramenta_movimentacoes')
                    .select('id, funcionario_id')
                    .eq('ferramenta_id', codigo)
                    .eq('status_movimentacao', 'aberto')
                    .order('data_retirada', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (errMov) throw errMov;

                if (movAberta) {
                    // Grava a data de devolução e encerra o status_movimentacao para 'devolvido'
                    const { error: errUpdateMov } = await supabase
                        .from('ferramenta_movimentacoes')
                        .update({
                            data_devolucao: new Date().toISOString(),
                            status_movimentacao: 'devolvido'
                        })
                        .eq('id', movAberta.id);

                    if (errUpdateMov) throw errUpdateMov;
                }

                // Altera o status estático da ferramenta de volta para disponível
                const { error: errUpdateFerr } = await supabase
                    .from('ferramentas')
                    .update({ status: 'disponivel' })
                    .eq('id', codigo);

                if (errUpdateFerr) throw errUpdateFerr;

                setStatusFeed({ tipo: 'sucesso', texto: `📥 DEVOLVIDA: ${ferramenta.nome} retornou para o almoxarifado!` });
            }

            // LÓGICA B: Se a ferramenta está DISPONÍVEL -> RETIRADA
            else {
                // Insere uma nova linha na tabela ferramenta_movimentacoes casando certinho com sua DDL
                const { error: errInsertMov } = await supabase
                    .from('ferramenta_movimentacoes')
                    .insert([{
                        ferramenta_id: codigo,
                        funcionario_id: funcionarioAtivo.id,
                        status_movimentacao: 'aberto' // Configura explicitamente como aberto
                    }]);

                if (errInsertMov) throw errInsertMov;

                // Altera o status estático da ferramenta para ocupado
                const { error: errUpdateFerr } = await supabase
                    .from('ferramentas')
                    .update({ status: 'ocupado' })
                    .eq('id', codigo);

                if (errUpdateFerr) throw errUpdateFerr;

                setStatusFeed({ tipo: 'sucesso', texto: `🚀 RETIRADA: ${ferramenta.nome} entregue para ${funcionarioAtivo.nome}!` });
            }

            // Limpa o fluxo para o próximo operador bipar do início
            setPasso(1);
            setFuncionarioAtivo(null);
            setIdDigitado('');
            setModoManual(false);

        } catch (err: any) {
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Erro ao processar movimentação.' });
            setIdDigitado('');
        } finally {
            setProcessando(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valor = idDigitado.trim();
        if (!valor) return;

        if (passo === 1) {
            processarFuncionario(valor);
        } else {
            processarFerramenta(valor);
        }
    };

    const cancelarOperacao = () => {
        setPasso(1);
        setFuncionarioAtivo(null);
        setIdDigitado('');
        setModoManual(false);
        setStatusFeed({ tipo: '', texto: '' });
    };

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.012]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] transition-all duration-700 ${
                    passo === 1 ? 'bg-orange-600/[0.02]' : 'bg-amber-500/[0.03]'
                }`} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                <div className="w-full max-w-md mb-4 flex justify-between items-center px-1">
                    <Link href="/dashboard/ferramentas" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] hover:opacity-70 transition-all">
                        ← Menu Anterior
                    </Link>
                    {passo === 2 && (
                        <button onClick={cancelarOperacao} className="text-red-500 font-black text-[9px] uppercase tracking-[2px] hover:opacity-70 transition-all">
                            ✕ Abortar Fluxo
                        </button>
                    )}
                </div>

                <div className="w-full max-w-md relative bg-[#09090b]/95 border border-white/[0.06] rounded-[40px] p-8 shadow-2xl backdrop-blur-3xl overflow-hidden">

                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.02] flex">
                        <div className={`h-full bg-orange-500 transition-all duration-500 ${passo === 1 ? 'w-1/2' : 'w-full'}`} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {passo === 1 ? (
                            <div className="text-center space-y-6 animate-fadeIn">
                                <div className="space-y-2">
                                    <span className="text-3xl block animate-pulse">🪪</span>
                                    <h1 className="text-lg font-black uppercase italic tracking-tight text-slate-200">
                                        Identificação do <span className="text-orange-500">Operador</span>
                                    </h1>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                        Por favor, bipa o crachá do colaborador no sensor
                                    </p>
                                </div>

                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder={modoManual ? "DIGITE O ID..." : "AGUARDANDO LASER DO CRACHÁ..."}
                                        value={idDigitado}
                                        onChange={e => setIdDigitado(e.target.value)}
                                        className={`w-full bg-black/70 border px-4 py-4 rounded-2xl outline-none text-center text-sm font-mono tracking-widest uppercase transition-all ${
                                            modoManual
                                                ? 'border-orange-500/50 text-white focus:border-orange-500'
                                                : 'border-white/[0.05] text-orange-400 focus:border-white/[0.05] caret-transparent'
                                        }`}
                                        disabled={processando}
                                        required
                                        autoFocus
                                    />
                                    {!modoManual && <div className="absolute inset-0 rounded-2xl pointer-events-none border border-orange-500/10 animate-pulse" />}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                        👤 {funcionarioAtivo?.nome} {funcionarioAtivo?.sobrenome}
                                    </span>
                                    <h1 className="text-lg font-black uppercase italic tracking-tight text-slate-200 pt-2">
                                        Bipar <span className="text-amber-400">Ferramenta</span>
                                    </h1>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                        Passe o laser no código de barras de 4 dígitos da ferramenta
                                    </p>
                                </div>

                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder={modoManual ? "DIGITE O CÓDIGO DA FERRAMENTA..." : "AGUARDANDO LEITURA DO ATIVO..."}
                                        value={idDigitado}
                                        onChange={e => setIdDigitado(e.target.value)}
                                        className={`w-full bg-black/70 border px-4 py-4 rounded-2xl outline-none text-center text-sm font-mono tracking-widest uppercase transition-all ${
                                            modoManual
                                                ? 'border-amber-500/50 text-white focus:border-amber-500'
                                                : 'border-white/[0.05] text-amber-400 focus:border-white/[0.05] caret-transparent'
                                        }`}
                                        disabled={processando}
                                        required
                                    />
                                    {!modoManual && <div className="absolute inset-0 rounded-2xl pointer-events-none border border-amber-500/10 animate-pulse" />}
                                </div>
                            </div>
                        )}

                        {statusFeed.texto && (
                            <div className={`p-3.5 rounded-xl border text-[9px] font-black uppercase tracking-wide text-center leading-relaxed ${
                                statusFeed.tipo === 'sucesso'
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                                {statusFeed.texto}
                            </div>
                        )}

                        {modoManual && (
                            <button
                                type="submit"
                                disabled={processando}
                                className="w-full py-3.5 rounded-xl font-black uppercase text-[9px] tracking-[2px] text-black transition-all active:scale-[0.99]"
                                style={{ background: passo === 1 ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                                {processando ? "PROCESSANDO..." : "CONFIRMAR ENTRADA"}
                            </button>
                        )}
                    </form>

                    <div className="mt-6 border-t border-white/[0.03] pt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setModoManual(!modoManual);
                                setIdDigitado('');
                            }}
                            className="text-[8px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {modoManual ? "🔌 Ativar modo Leitor Laser" : "⌨️ O leitor falhou? Digitar código manualmente"}
                        </button>
                    </div>
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Totem Flow Engine v4.1</div>
            </footer>
        </main>
    );
}