"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CadastroMotoristaPage() {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [cpf, setCpf] = useState('');
    const [categoriaCnh, setCategoriaCnh] = useState('');
    const [vencimentoCnh, setVencimentoCnh] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [contato, setContato] = useState('');
    const [cidade, setCidade] = useState('');

    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Cidades permitidas atualizadas com LAGOA DA CANOA
    const cidadesOperacao = [
        "PILAR", "ARAPIRACA", "MACEIÓ", "TAQUARANA", "FEIRA GRANDE",
        "LIMOEIRO", "BANANEIRA", "JUNQUEIRO", "COITÉ", "SÃO MIGUEL",
        "LAGOA DA CANOA"
    ];

    // Máscara de CPF dinâmico (000.000.000-00)
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

        setCpf(value);
    };

    // Máscara de Celular/Contato dinâmico ((00) 00000-0000)
    const handleContatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d)/, "($1) $2");
        }

        setContato(value);
    };

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            if (cpf.length < 14) {
                throw new Error("Por favor, insira um CPF válido e completo.");
            }
            if (contato.length < 14) {
                throw new Error("O número de contato deve conter DDD e o número completo.");
            }
            if (!cidade) {
                throw new Error("Por favor, selecione a cidade base do motorista.");
            }

            const payload = {
                nome_completo: nomeCompleto.trim().toUpperCase(),
                cpf: cpf.trim(),
                categoria_cnh: categoriaCnh.trim().toUpperCase(),
                vencimento_cnh: vencimentoCnh,
                data_nascimento: dataNascimento || null,
                contato: contato.trim(),
                cidade: cidade
            };

            const { error } = await supabase
                .from('motoristas')
                .insert([payload]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Este CPF já está vinculado a um motorista cadastrado.");
                }
                throw error;
            }

            setStatusFeed({
                tipo: 'sucesso',
                texto: `🪪 Condutor ${payload.nome_completo} de ${payload.cidade} vinculado com sucesso!`
            });

            setNomeCompleto('');
            setCpf('');
            setCategoriaCnh('');
            setVencimentoCnh('');
            setDataNascimento('');
            setContato('');
            setCidade('');

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha ao registrar ficha do motorista.'
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID LINES BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.01]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                <div className="w-full max-w-2xl mb-4 text-left px-2">
                    <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Menu de Frotas
                    </Link>
                </div>

                <div className="w-full max-w-2xl relative bg-[#1a1f29]/95 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="mb-8">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <span>🪪</span> Ficha de <span className="text-blue-400">Novo Motorista</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                            Controle cadastral de condutores e validade de habilitações (CNH)
                        </p>
                    </div>

                    {statusFeed.texto && (
                        <div className={`mb-6 p-4 rounded-xl border text-[10px] font-black uppercase tracking-wide text-center leading-relaxed ${
                            statusFeed.tipo === 'sucesso'
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            {statusFeed.texto}
                        </div>
                    )}

                    <form onSubmit={handleCadastro} className="space-y-6">

                        {/* NOME COMPLETO */}
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Nome Completo do Condutor</label>
                            <input
                                type="text"
                                placeholder="Digite o nome sem abreviações..."
                                value={nomeCompleto}
                                onChange={e => setNomeCompleto(e.target.value)}
                                className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase transition-all placeholder-slate-700"
                                required
                                disabled={enviando}
                            />
                        </div>

                        {/* ROW 1: CPF E CONTATO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Inscrição CPF</label>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono tracking-wider transition-all placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Telefone para Contato / WhatsApp</label>
                                <input
                                    type="text"
                                    placeholder="(00) 00000-0000"
                                    value={contato}
                                    onChange={handleContatoChange}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono tracking-wider transition-all placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ROW 2: CATEGORIA CNH E VENCIMENTO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Categoria da Habilitação (CNH)</label>
                                <input
                                    type="text"
                                    placeholder="EX: D, E, AB"
                                    value={categoriaCnh}
                                    onChange={e => setCategoriaCnh(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase tracking-widest placeholder-slate-700 transition-all"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Data de Vencimento da CNH</label>
                                <input
                                    type="date"
                                    value={vencimentoCnh}
                                    onChange={e => setVencimentoCnh(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-300 text-xs font-mono transition-all"
                                    required
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ROW 3: SELEÇÃO DE CIDADE BASE E DATA NASCIMENTO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Cidade Base Operacional</label>
                                <select
                                    value={cidade}
                                    onChange={e => setCidade(e.target.value)}
                                    className="w-full bg-[#11141a]/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="" className="text-slate-600">-- Escolha a Cidade --</option>
                                    {cidadesOperacao.map((cid, cIdx) => (
                                        <option key={cIdx} value={cid} className="bg-[#1a1f29]">{cid}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Data de Nascimento (Opcional)</label>
                                <input
                                    type="date"
                                    value={dataNascimento}
                                    onChange={e => setDataNascimento(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-300 text-xs font-mono transition-all"
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {enviando ? "Processando Cadastro..." : "Salvar Cadastro do Motorista (Enter)"}
                        </button>
                    </form>
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.0</div>
            </footer>
        </main>
    );
}