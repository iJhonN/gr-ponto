"use client";
import Link from 'next/link';

export default function HubFerramentasPage() {
    const modulos = [
        {
            titulo: "Retirada & Devolução",
            descricao: "Terminal operacional para bipagem rápida de código de barras ou crachá.",
            icone: "📡",
            rota: "/dashboard/ferramentas/retirada",
            corGlow: "rgba(249, 115, 22, 0.15)"
        },
        {
            titulo: "Inventário Geral",
            descricao: "Listagem completa e em tempo real dos 196 ativos cadastrados na bancada.",
            icone: "📋",
            rota: "/dashboard/ferramentas/lista",
            corGlow: "rgba(251, 191, 36, 0.1)"
        },
        {
            titulo: "Histórico de Cautelas",
            descricao: "Auditoria detalhada e linha do tempo de quem retirou e devolveu os equipamentos.",
            icone: "⏱️",
            rota: "/dashboard/ferramentas/historico",
            corGlow: "rgba(249, 115, 22, 0.1)"
        },
        {
            titulo: "Cadastrar Nova Ferramenta",
            descricao: "Inclusão manual e rápida de novos itens coletando apenas ID, Nome e Status.",
            icone: "📥",
            rota: "/dashboard/ferramentas/cadastro",
            corGlow: "rgba(251, 191, 36, 0.15)"
        }
    ];

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID BACKGROUND EFFECT */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '45px 45px',
                    }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-600/[0.015] rounded-full blur-[180px]" />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-10 max-w-[1400px] mx-auto justify-center">

                {/* HEADER */}
                <header className="w-full text-center border-b border-white/[0.03] pb-8 max-w-2xl mx-auto px-4">
                    <Link href="/dashboard" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">
                        ← Voltar ao Dashboard Geral
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Ativos & Ferramental</span>
                    </h1>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-bold leading-relaxed">
                        Painel de controle centralizado para monitoramento, movimentação e auditoria do pátio da oficina
                    </p>
                </header>

                {/* GRID DE BOTÕES/CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto px-4">
                    {modulos.map((m, index) => (
                        <Link
                            key={index}
                            href={m.rota}
                            className="group relative bg-[#09090b]/80 border border-white/[0.06] hover:border-orange-500/40 rounded-[28px] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-start gap-5 hover:-translate-y-1 overflow-hidden"
                            style={{
                                boxShadow: `0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)`
                            }}
                        >
                            {/* Dynamic ambient hover glow */}
                            <div
                                className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[28px] pointer-events-none"
                                style={{
                                    background: `radial-gradient(400px circle at 50% 50%, ${m.corGlow}, transparent 40%)`
                                }}
                            />

                            {/* TOP GRADIENT LINE ON HOVER */}
                            <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-orange-500/0 group-hover:via-orange-500/50 to-transparent transition-all duration-500" />

                            <div className="text-2xl bg-black/40 border border-white/[0.04] p-3.5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10">
                                {m.icone}
                            </div>

                            <div className="space-y-1 flex-1 relative z-10">
                                <h2 className="text-sm font-black uppercase text-slate-200 group-hover:text-orange-400 tracking-wide transition-colors flex items-center gap-1.5">
                                    {m.titulo}
                                    <span className="text-orange-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-xs">➔</span>
                                </h2>
                                <p className="text-[11px] text-slate-500 font-bold leading-normal group-hover:text-slate-400 transition-colors">
                                    {m.descricao}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CENTRAL DISPATCH STATUS FOOTNOTE */}
                <div className="text-center max-w-xs mx-auto mt-2">
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed border border-white/[0.03] bg-black/30 px-4 py-2 rounded-xl">
                        Acesso Restrito • Monitoramento via Logs do PostgreSQL
                    </p>
                </div>
            </div>

            {/* LOWER STATS BAR */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-4">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Almoxarifado Central v3.2</div>
            </footer>
        </main>
    );
}