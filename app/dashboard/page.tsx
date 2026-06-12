"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function DashboardPage() {
    const [userName, setUserName] = useState('Carregando...');
    const [userRole, setUserRole] = useState('...');
    const [carregando, setCarregando] = useState(true);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        let ativo = true;

        async function buscarSessao() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (ativo) router.push('/');
                    return;
                }

                const { data: perfil } = await supabase
                    .from('usuarios_painel')
                    .select('nome, cargo')
                    .eq('id', user.id)
                    .maybeSingle();

                if (ativo) {
                    if (perfil) {
                        setUserName(perfil.nome);
                        setUserRole(perfil.cargo.toUpperCase());
                    } else {
                        setUserName(user.email?.split('@')[0] || 'Usuário');
                        setUserRole('MECANICO');
                    }
                    setCarregando(false);
                }
            } catch (error) {
                console.error("Erro ao sincronizar sessão:", error);
                if (ativo) setCarregando(false);
            }
        }

        buscarSessao();

        return () => {
            ativo = false;
        };
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (carregando) {
        return (
            <main className="min-h-screen bg-[#030303] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Iniciando GR Cluster...</p>
                </div>
            </main>
        );
    }

    // ─── MATRIZ DE ACESSOS REQUISITADA PELO JHON ───
    const podeVerPonto = ['ADMIN', 'GERENTE', 'TECNICO'];
    const podeVerRetiradaFerramentas = ['ADMIN', 'GERENTE', 'TECNICO', 'MECANICO'];
    const podeVerHubFerramentas = ['ADMIN', 'GERENTE', 'TECNICO', 'MECANICO'];
    const podeVerFrota = ['ADMIN', 'GERENTE', 'GESTORDEFROTAS'];
    const podeVerFechamento = ['ADMIN', 'GERENTE'];
    const podeVerFuncionarios = ['ADMIN', 'GERENTE'];
    const podeVerRH = ['ADMIN', 'GERENTE'];

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-8 font-sans overflow-hidden antialiased flex flex-col justify-between gap-10 w-full">

            {/* FUNDO VISUAL */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* HEADER */}
            <header className="relative z-10 w-full flex items-center justify-between border-b border-white/[0.04] pb-6 px-2 md:px-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-b from-orange-400 to-orange-600 border border-orange-400/20 rounded-xl flex items-center justify-center font-black italic text-black text-lg shadow-lg select-none">
                        GR
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase italic tracking-tight leading-none">
                            GR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Cluster</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1.5 font-bold">
                            Operador: {userName} • <span className="text-orange-400/90 tracking-widest font-mono">[{userRole}]</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-white/[0.02] border border-white/[0.05] hover:border-red-500/20 hover:text-red-400 text-slate-400 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                    Sair
                </button>
            </header>

            {/* CORPO DE SEÇÕES OPERACIONAIS */}
            <section className="relative z-10 w-full flex-1 flex flex-col justify-center my-auto space-y-10 px-2 md:px-4">

                <div className="text-left space-y-1.5">
                    <span className="text-orange-500 font-black text-[8px] uppercase tracking-[4px] bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10 select-none">
                        Matriz de Acessos Ativa
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">Painel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Operações</span></h2>
                    <p className="text-xs text-slate-500 font-medium">Visualização customizada baseada nas suas atribuições de segurança de dados</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">

                    {/* ⏱️ CARD PONTO (LARGURA DUPLA) - Visível para Admin, Gerente, Técnico */}
                    {podeVerPonto.includes(userRole) && (
                        <Link href="/dashboard/ponto" className="bg-[#09090b]/90 border border-orange-500/30 hover:border-orange-500/70 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px] sm:col-span-2">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/[0.06] rounded-full blur-2xl transition-all" />
                            <div className="flex items-center justify-between">
                                <div className="w-11 h-11 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-400 text-lg font-black group-hover:bg-orange-500 group-hover:text-black transition-all">⏱️</div>
                                <span className="text-[7px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md">Obrigatório</span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 text-orange-400">Controle de Ponto</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Acesso a batidas, pausas, controle de horas extras, monitoramento de atrasos e saídas emergenciais.</p>
                            </div>
                        </Link>
                    )}

                    {/* 🛠️ CARD RETIRADA FERRAMENTAS (LARGURA DUPLA) - Visível para Admin, Gerente, Técnico, Mecânico */}
                    {podeVerRetiradaFerramentas.includes(userRole) && (
                        <Link href="/dashboard/ferramentas/retirada" className="bg-[#09090b]/90 border border-emerald-500/30 hover:border-emerald-500/70 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px] sm:col-span-2">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.06] rounded-full blur-2xl transition-all" />
                            <div className="flex items-center justify-between">
                                <div className="w-11 h-11 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 text-lg font-black group-hover:bg-emerald-500 group-hover:text-black transition-all">🛠️</div>
                                <span className="text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">Almoxarifado</span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 text-emerald-400">Retirada de Ferramenta</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Controle patrimonial de chaves, scanners e equipamentos industriais vinculados ao ID do mecânico.</p>
                            </div>
                        </Link>
                    )}

                    {/* ⚙️ HUB FERRAMENTAS (Retirada e devolução) - Visível para Admin, Gerente, Técnico, Mecânico */}
                    {podeVerHubFerramentas.includes(userRole) && (
                        <Link href="/dashboard/ferramentas" className="bg-[#09090b]/80 border border-white/[0.06] hover:border-blue-500/40 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]">
                            <div className="w-11 h-11 bg-blue-500/10 border border-white/[0.04] rounded-xl flex items-center justify-center text-blue-400 text-lg font-black mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">⚙️</div>
                            <div>
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 group-hover:text-blue-400 transition-colors">Ferramentas</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Inventário geral de ferramentas da oficina e histórico de devoluções.</p>
                            </div>
                        </Link>
                    )}

                    {/* 🚚 HUB FROTAS - Visível para Admin, Gerente, Gestordefrotas */}
                    {podeVerFrota.includes(userRole) && (
                        <Link href="/dashboard/frota" className="bg-[#09090b]/80 border border-white/[0.06] hover:border-indigo-500/40 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]">
                            <div className="w-11 h-11 bg-indigo-500/10 border border-white/[0.04] rounded-xl flex items-center justify-center text-indigo-400 text-lg font-black mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">🚚</div>
                            <div>
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 group-hover:text-indigo-400 transition-colors">Frotas & Rotas</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Módulo de monitoramento de viagens, motoristas, combustível e auditoria.</p>
                            </div>
                        </Link>
                    )}

                    {/* 📊 FECHAMENTO CONTÁBIL - Visível para Admin, Gerente */}
                    {podeVerFechamento.includes(userRole) && (
                        <Link href="/dashboard/fechamento" className="bg-[#09090b]/80 border border-white/[0.06] hover:border-purple-500/40 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]">
                            <div className="w-11 h-11 bg-purple-500/10 border border-white/[0.04] rounded-xl flex items-center justify-center text-purple-400 text-lg font-black mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">📊</div>
                            <div>
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 group-hover:text-purple-400 transition-colors">Fechamento</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Apuração contábil e auditoria mensal de horas da folha de pátio.</p>
                            </div>
                        </Link>
                    )}

                    {/* 👥 BASE DE FUNCIONÁRIOS - Visível para Admin, Gerente */}
                    {podeVerFuncionarios.includes(userRole) && (
                        <Link href="/dashboard/funcionarios" className="bg-[#09090b]/80 border border-white/[0.06] hover:border-amber-500/40 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]">
                            <div className="w-11 h-11 bg-amber-500/10 border border-white/[0.04] rounded-xl flex items-center justify-center text-amber-400 text-lg font-black mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all">👥</div>
                            <div>
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 group-hover:text-amber-400 transition-colors">Funcionários</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Controle cadastral corporativo e crachás ópticos nativos.</p>
                            </div>
                        </Link>
                    )}

                    {/* 💼 DIRETORIA / RECURSOS HUMANOS - Visível para Admin, Gerente */}
                    {podeVerRH.includes(userRole) && (
                        <Link href="/dashboard/rh" className="bg-[#09090b]/80 border border-white/[0.06] hover:border-pink-500/40 p-6 rounded-[28px] text-left transition-all active:scale-[0.98] group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]">
                            <div className="w-11 h-11 bg-pink-500/10 border border-white/[0.04] rounded-xl flex items-center justify-center text-pink-400 text-lg font-black mb-4 group-hover:bg-pink-600 group-hover:text-white transition-all">💼</div>
                            <div>
                                <h3 className="text-base font-black uppercase italic tracking-tight mb-1 group-hover:text-pink-400 transition-colors">Gestão de RH</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Admissões confidenciais, termos legais e documentação interna da gerência.</p>
                            </div>
                        </Link>
                    )}

                </div>
            </section>

            {/* RODAPÉ */}
            <footer className="relative z-10 w-full border-t border-white/[0.02] pt-6 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-600 uppercase font-bold tracking-widest gap-4 text-center sm:text-left px-2 md:px-4">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-700">Módulo RBAC Cluster Security v3.1</div>
            </footer>
        </main>
    );
}