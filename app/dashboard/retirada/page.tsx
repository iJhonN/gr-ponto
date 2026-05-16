"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function RetiradaDevolucao() {
    const [etapa, setEtapa] = useState<'colaborador' | 'item'>('colaborador');
    const [dados, setDados] = useState({ funcionarioId: '', funcionarioNome: '' });
    const [status, setStatus] = useState<{ msg: string; tipo: 'foco' | 'sucesso' | 'erro' | 'info' }>({
        msg: 'Aproxime o Crachá do Colaborador',
        tipo: 'foco'
    });
    const [carregando, setCarregando] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState("");

    // Foco constante no input híbrido (leitor/teclado)
    useEffect(() => {
        const focus = () => inputRef.current?.focus();
        document.addEventListener('click', focus);
        focus();
        return () => document.removeEventListener('click', focus);
    }, []);

    const processarLeitura = async (codigo: string) => {
        if (!codigo) return;
        const codLimpo = codigo.trim();
        setBarcode(""); // Limpa o campo para a próxima digitação ou bipe

        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        if (etapa === 'colaborador') {
            setCarregando(true);
            try {
                const res = await fetch(`${baseUrl}/funcionarios`);
                const funcionarios = await res.json();
                const f = funcionarios.find((func: any) => String(func.id) === codLimpo);

                if (f) {
                    setDados({ funcionarioId: codLimpo, funcionarioNome: `${f.nome} ${f.sobrenome}` });
                    setEtapa('item');
                    setStatus({ msg: `Olá ${f.nome}! Bipe ou digite a Peça/Ferramenta`, tipo: 'info' });
                } else {
                    setStatus({ msg: 'Crachá não reconhecido', tipo: 'erro' });
                    setTimeout(() => setStatus({ msg: 'Aproxime o Crachá do Colaborador', tipo: 'foco' }), 2000);
                }
            } catch (e) {
                setStatus({ msg: 'Erro de conexão VPS', tipo: 'erro' });
            } finally {
                setCarregando(false);
            }
        } else {
            // ETAPA DO ITEM: Lógica de Movimentação (Retirada ou Devolução)
            setCarregando(true);
            try {
                // ROTA CORRIGIDA: Apontando exatamente para /ferramentas/movimentacao na sua VPS
                const res = await fetch(`${baseUrl}/ferramentas/movimentacao`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        funcionarioId: dados.funcionarioId,
                        itemCodigo: codLimpo
                    })
                });

                const resultado = await res.json();

                if (res.ok) {
                    // VPS processa se o item estava na rua ou não e retorna o tipo da ação
                    const acao = resultado.tipo === 'retirada' ? 'RETIRADA' : 'DEVOLUÇÃO';
                    setStatus({
                        msg: `${acao} CONCLUÍDA: ${codLimpo}`,
                        tipo: 'sucesso'
                    });

                    setTimeout(() => {
                        setEtapa('colaborador');
                        setDados({ funcionarioId: '', funcionarioNome: '' });
                        setStatus({ msg: 'Aproxime o Crachá do Colaborador', tipo: 'foco' });
                    }, 4000);
                } else {
                    setStatus({ msg: resultado.error || 'Erro no registro', tipo: 'erro' });
                    setTimeout(() => setEtapa('colaborador'), 2000);
                }
            } catch (e) {
                setStatus({ msg: 'Falha ao processar movimentação', tipo: 'erro' });
            } finally {
                setCarregando(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 flex flex-col items-center justify-center font-sans">

            <div className="w-full max-w-2xl bg-slate-900/20 border border-white/5 p-12 rounded-[60px] text-center backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                <div className={`absolute top-0 left-0 w-full h-1 animate-scan ${etapa === 'colaborador' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

                <Link href="/dashboard" className="text-slate-500 font-black text-[10px] uppercase tracking-[4px] mb-12 block hover:text-white transition-all">← Dashboard</Link>

                <h1 className="text-6xl font-black italic uppercase mb-2 tracking-tighter">
                    Fluxo <span className={etapa === 'colaborador' ? 'text-blue-500' : 'text-orange-500'}>Estoque</span>
                </h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[8px] mb-12 italic">GR Autopeças • Controle de Uso</p>

                <div className="bg-black/60 rounded-[45px] py-12 mb-8 border border-white/5 shadow-inner">
                    <div className="text-8xl mb-6 transition-all duration-500 transform">
                        {carregando ? '⏳' : (etapa === 'colaborador' ? '👤' : '🛠️')}
                    </div>
                    <p className={`text-2xl font-black uppercase italic tracking-tighter px-4 ${
                        status.tipo === 'erro' ? 'text-red-500' :
                            status.tipo === 'sucesso' ? 'text-green-500' : 'text-white'
                    }`}>
                        {status.msg}
                    </p>
                    {etapa === 'item' && !carregando && (
                        <p className="text-[10px] text-blue-400 font-bold uppercase mt-4 tracking-widest animate-pulse">
                            Operador: {dados.funcionarioNome}
                        </p>
                    )}
                </div>

                {/* CAMPO DE DIGITAÇÃO VISÍVEL (Híbrido: Teclado + Scanner) */}
                <div className="relative max-w-xs mx-auto mb-8">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={etapa === 'colaborador' ? "CRACHÁ" : "CÓD. ITEM"}
                        className={`w-full bg-white/5 border-2 p-5 rounded-3xl text-center text-2xl font-black uppercase tracking-[5px] outline-none transition-all ${
                            etapa === 'colaborador' ? 'border-blue-500/30 focus:border-blue-500' : 'border-orange-500/30 focus:border-orange-500'
                        }`}
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && processarLeitura(barcode)}
                        autoFocus
                    />
                    <div className="mt-2 text-[8px] font-black uppercase text-slate-600 tracking-widest">
                        Bipe ou digite o código e pressione Enter
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <div className={`h-1.5 w-12 rounded-full transition-all ${etapa === 'colaborador' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-green-500'}`}></div>
                    <div className={`h-1.5 w-12 rounded-full transition-all ${etapa === 'item' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-white/10'}`}></div>
                </div>
            </div>

            <footer className="mt-12 text-[9px] font-black uppercase opacity-20 tracking-[6px] flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Endpoint: /ferramentas/movimentacao • GR-API Active
            </footer>
        </div>
    );
}