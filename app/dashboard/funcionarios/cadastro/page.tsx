"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CadastroFuncionarioPage() {
    const [id, setId] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [cargo, setCargo] = useState('Mecânico'); // Valor padrão inicial atualizado

    const [enviando, setEnviando] = useState(false);
    const [gerandoId, setGerandoId] = useState(true);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Função para gerar ID único de 5 dígitos consultando o banco
    async function gerarIdUnico() {
        setGerandoId(true);
        let idGerado = '';
        let idDisponivel = false;

        try {
            while (!idDisponivel) {
                // Gera número aleatório entre 10000 e 99999
                const num = Math.floor(10000 + Math.random() * 90000);
                idGerado = String(num);

                // Consulta se já existe no banco
                const { data } = await supabase
                    .from('funcionarios')
                    .select('id')
                    .eq('id', idGerado)
                    .maybeSingle();

                if (!data) {
                    idDisponivel = true;
                }
            }
            setId(idGerado);
        } catch (err) {
            console.error("Erro ao gerar ID único:", err);
            setStatusFeed({ tipo: 'erro', texto: 'Falha ao gerar ID óptico automático.' });
        } finally {
            setGerandoId(false);
        }
    }

    useEffect(() => {
        gerarIdUnico();
    }, []);

    const handleCadastrar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !nome.trim() || !sobrenome.trim()) {
            setStatusFeed({ tipo: 'erro', texto: 'Preencha todos os campos corretamente.' });
            return;
        }

        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            const { error } = await supabase
                .from('funcionarios')
                .insert([{
                    id: id,
                    nome: nome.trim(),
                    sobrenome: sobrenome.trim(),
                    cargo: cargo // Envia o valor exato selecionado
                }]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Conflito de ID. Tente novamente.");
                }
                throw error;
            }

            setStatusFeed({ tipo: 'sucesso', texto: 'Colaborador cadastrado com sucesso!' });
            setTimeout(() => {
                router.push('/dashboard/funcionarios');
            }, 1500);

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Falha ao salvar no banco.' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030303] flex items-center justify-center p-6 font-sans overflow-hidden antialiased">

            {/* ── FUNDO TECNOLÓGICO ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(234,88,12,0.07), transparent)' }}
                />
                <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-orange-600/[0.06] rounded-full blur-[140px]" />
                <div className="absolute -bottom-60 -right-60 w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-[120px]" />
            </div>

            {/* ── CARD DE CADASTRO ── */}
            <div className="relative w-full max-w-md z-10">
                <div className="absolute -inset-px rounded-[44px] bg-gradient-to-b from-orange-500/10 to-transparent blur-sm" />

                <div className="relative w-full bg-[#09090b]/90 border border-white/[0.06] rounded-[40px] shadow-2xl backdrop-blur-2xl overflow-hidden">
                    <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

                    <Link
                        href="/dashboard/funcionarios"
                        className="absolute top-6 left-8 text-[8px] font-black uppercase text-slate-500 tracking-[3px] hover:text-orange-400 transition-colors z-20 flex items-center gap-1"
                    >
                        ← Voltar
                    </Link>

                    <div className="p-8 sm:p-10 pt-14">

                        <div className="text-center mb-8">
                            <span className="text-orange-500 font-black text-[8px] uppercase tracking-[4px] bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10 select-none">
                                Terminal de Admissão
                            </span>
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-3">
                                Novo <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Colaborador</span>
                            </h1>
                            <p className="text-[9px] text-slate-600 uppercase tracking-[4px] font-bold mt-1">
                                Registro de Matrícula NTI
                            </p>
                        </div>

                        {statusFeed.texto && (
                            <div className={`mb-6 flex items-start gap-2.5 p-4 rounded-2xl border ${
                                statusFeed.tipo === 'sucesso'
                                    ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/[0.06] border-red-500/20 text-red-400'
                            }`}>
                                <div className="text-xs shrink-0">{statusFeed.tipo === 'sucesso' ? '✅' : '⚠️'}</div>
                                <p className="text-[10px] font-black uppercase tracking-wide leading-relaxed">
                                    {statusFeed.texto}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleCadastrar} className="space-y-4">

                            {/* ID Gerado Automaticamente */}
                            <div className="space-y-1.5">
                                <label className="block text-[8px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                                    ID Óptico Reservado (Automático)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/60">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="2" y="3" width="12" height="10" rx="2" />
                                            <path d="M6 6h4M6 9h2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="w-full bg-black/60 border border-orange-500/20 pl-11 pr-4 py-3.5 rounded-2xl text-orange-400 text-sm font-mono tracking-widest flex items-center min-h-[46px] select-none">
                                        {gerandoId ? (
                                            <span className="text-[10px] font-sans font-black text-slate-600 uppercase tracking-wider animate-pulse">Consultando cluster...</span>
                                        ) : (
                                            id
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Nome & Sobrenome */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                                        Nome
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 px-4 py-3.5 rounded-2xl outline-none text-white text-xs font-bold uppercase tracking-wide transition-all placeholder-slate-700 disabled:opacity-40"
                                        required
                                        disabled={enviando || gerandoId}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                                        Sobrenome
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Sobrenome"
                                        value={sobrenome}
                                        onChange={e => setSobrenome(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 px-4 py-3.5 rounded-2xl outline-none text-white text-xs font-bold uppercase tracking-wide transition-all placeholder-slate-700 disabled:opacity-40"
                                        required
                                        disabled={enviando || gerandoId}
                                    />
                                </div>
                            </div>

                            {/* Lista de Cargos Atualizada */}
                            <div className="space-y-1.5">
                                <label className="block text-[8px] font-black uppercase tracking-[3px] text-slate-500 ml-1">
                                    Cargo / Atribuição (Lista Atualizada)
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500/70 transition-colors pointer-events-none">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M3 13s1-4 5-4 5 4 5 4M8 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <select
                                        value={cargo}
                                        onChange={e => setCargo(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 focus:bg-black/60 pl-11 pr-10 py-3.5 rounded-2xl outline-none text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer appearance-none disabled:opacity-40"
                                        disabled={enviando || gerandoId}
                                    >
                                        <option value="Administrativo" className="bg-[#09090b] text-white">Administrativo</option>
                                        <option value="Ajudante" className="bg-[#09090b] text-white">Ajudante</option>
                                        <option value="Balconista" className="bg-[#09090b] text-white">Balconista</option>
                                        <option value="Comprador" className="bg-[#09090b] text-white">Comprador</option>
                                        <option value="Estoque" className="bg-[#09090b] text-white">Estoque</option>
                                        <option value="Gerente" className="bg-[#09090b] text-white">Gerente</option>
                                        <option value="Lojista" className="bg-[#09090b] text-white">Lojista</option>
                                        <option value="Mecânico" className="bg-[#09090b] text-white">Mecânico</option>
                                        <option value="Motoboy" className="bg-[#09090b] text-white">Motoboy</option>
                                        <option value="Pedreiro" className="bg-[#09090b] text-white">Pedreiro</option>
                                        <option value="Técnico de OS" className="bg-[#09090b] text-white">Técnico de OS</option>
                                        <option value="TI" className="bg-[#09090b] text-white">TI</option>
                                        <option value="Vendedor" className="bg-[#09090b] text-white">Vendedor</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-focus-within:text-orange-500/70">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Envio */}
                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={enviando || gerandoId}
                                    className="relative w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden group"
                                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative flex items-center justify-center gap-2 pt-0.5">
                                        {enviando ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                                                Escrevendo no Banco...
                                            </>
                                        ) : (
                                            <>
                                                Confirmar Cadastro
                                                <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M2 5h6M5 2l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>

                        </form>
                    </div>

                    <div className="border-t border-white/[0.04] px-10 py-4 flex items-center justify-center bg-black/20">
                        <p className="text-[8px] uppercase tracking-[3px] text-slate-700 font-bold">
                            GR Cluster · Control
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}