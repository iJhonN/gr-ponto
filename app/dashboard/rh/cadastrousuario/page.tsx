"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CadastroUsuarioPainelPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [contato, setContato] = useState('');
    const [cargo, setCargo] = useState('');

    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Os 5 cargos estritos aprovados na constraint do banco
    const cargosDisponiveis = [
        { id: "ADMIN", label: "ADMINISTRADOR (ACESSO TOTAL)" },
        { id: "GERENTE", label: "GERENTE OPERACIONAL" },
        { id: "TECNICO", label: "TÉCNICO DE PÁTIO / ALMOXARIFADO" },
        { id: "MECANICO", label: "MECÂNICO / OPERADOR DE PISTA" },
        { id: "GESTORDEFROTAS", label: "GESTOR DE FROTAS & LOGÍSTICA" }
    ];

    // Máscara dinâmica para o contato corporativo ((00) 00000-0000)
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

    const handleCriarUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            // Validações básicas antes do disparo
            if (senha.length < 6) {
                throw new Error("A senha de acesso precisa ter no mínimo 6 caracteres.");
            }
            if (contato.length < 14) {
                throw new Error("Formato de contato inválido. Certifique-se de inserir o DDD.");
            }
            if (!cargo) {
                throw new Error("Por favor, selecione um cargo para definir o nível de acesso do usuário.");
            }

            // 1. Cria a credencial de autenticação no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: senha,
                options: {
                    // Impede o Next.js de deslogar o RH ao criar uma conta de terceiro
                    emailRedirectTo: undefined
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Falha ao gerar UID de segurança no Auth do servidor.");

            // 2. Vincula os dados cadastrais na tabela 'usuarios_painel' usando o ID gerado pelo Auth
            const payload = {
                id: authData.user.id,
                nome: nome.trim().toUpperCase(),
                email: email.trim().toLowerCase(),
                senha: senha, // Mantém salvo de forma controlada conforme estrutura da tabela
                contato: contato.trim(),
                cargo: cargo
            };

            const { error: dbError } = await supabase
                .from('usuarios_painel')
                .insert([payload]);

            if (dbError) throw dbError;

            setStatusFeed({
                tipo: 'sucesso',
                texto: `💼 Credenciais criadas! Operador ${payload.nome} registrado sob o cargo [${payload.cargo}]`
            });

            // Reseta o formulário limpo para o próximo cadastro
            setNome('');
            setEmail('');
            setSenha('');
            setContato('');
            setCargo('');

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha catastrófica ao injetar credenciais no cluster.'
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030303] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* BACKGROUND MATRIX SUTIL */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.012]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                <div className="w-full max-w-2xl mb-4 text-left px-2">
                    <Link href="/dashboard" className="text-orange-500 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Retornar ao Terminal Geral
                    </Link>
                </div>

                {/* FORM CONTAINER (DESIGN COERENTE COM A DASHBOARD PRINCIPAL) */}
                <div className="w-full max-w-2xl relative bg-[#09090b]/90 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

                    <div className="mb-8">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <span>💼</span> Provisionar <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Nova Credencial</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                            Módulo do RH: Emissão de logins de acesso com atribuição estrita de cargos (RBAC)
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

                    <form onSubmit={handleCriarUsuario} className="space-y-6">

                        {/* NOME COMPLETO */}
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Nome Completo do Funcionário</label>
                            <input
                                type="text"
                                placeholder="EX: JOSE SILVA"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full bg-black/50 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase transition-all placeholder-slate-800"
                                required
                                disabled={enviando}
                            />
                        </div>

                        {/* ROW 1: E-MAIL CORPORATIVO E CONTATO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">E-mail Corporativo (Login)</label>
                                <input
                                    type="email"
                                    placeholder="operador@grcorporativo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono transition-all placeholder-slate-800"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Linha Telefônica / WhatsApp</label>
                                <input
                                    type="text"
                                    placeholder="(00) 00000-0000"
                                    value={contato}
                                    onChange={handleContatoChange}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono tracking-wider transition-all placeholder-slate-800"
                                    required
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ROW 2: SENHA DE ACESSO E CARGO DO SISTEMA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Senha Provisória de Acesso</label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 dígitos..."
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono transition-all placeholder-slate-800"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Nível de Atribuição (Cargo / Matriz)</label>
                                <select
                                    value={cargo}
                                    onChange={e => setCargo(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-orange-500/40 px-4 py-3 rounded-xl outline-none text-slate-200 text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                    disabled={enviando}
                                >
                                    <option value="" className="text-slate-700">-- Escolha o Escopo --</option>
                                    {cargosDisponiveis.map((c, idx) => (
                                        <option key={idx} value={c.id} className="bg-[#09090b]">{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {enviando ? "Gravando Autenticação no Cluster..." : "Consolidar e Ativar Conta (Enter)"}
                        </button>
                    </form>
                </div>

            </div>

            {/* RODAPÉ OPERACIONAL COERENTE COM A MARCA */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-600 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-700">Módulo RBAC Core Security v3.0</div>
            </footer>
        </main>
    );
}