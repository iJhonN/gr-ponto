"use client";
import Link from 'next/link';

export default function HubRHPage() {
    // Links focados em gestão direta de pessoal e credenciais
    const acoesDiretas = [
        {
            titulo: "Provisionar Credenciais",
            descricao: "Criar novos usuários de acesso para o painel com definição estrita de cargos (RBAC).",
            icone: "🔐",
            rota: "/dashboard/rh/cadastrousuario"
        },
        {
            titulo: "Controle de Atestados",
            descricao: "Lançamento e auditoria de justificativas médicas, dispensas e afastamentos legais.",
            icone: "📄",
            rota: "/dashboard/rh/atestados"
        },
        {
            titulo: "Fechamento Contábil",
            descricao: "Balanço mensal de horas da folha de pátio em formato A4 Retrato colorida para a diretoria.",
            icone: "📊",
            rota: "/dashboard/fechamento"
        }
    ];

    // Links de auditoria e monitoramento de jornadas de ponto
    const auditoriaPonto = [
        {
            titulo: "Controle de Pausas",
            descricao: "Monitorar intervalos de almoço e descansos intrajornada da equipe.",
            icone: "☕",
            rota: "/dashboard/ponto/pausas"
        },
        {
            titulo: "Horas Extras",
            descricao: "Auditar minutos e horas que ultrapassaram a escala regular para banco de horas.",
            icone: "⚡",
            rota: "/dashboard/ponto/horas_extras"
        },
        {
            titulo: "Relatório de Atrasos",
            descricao: "Identificar gargalos de pontualidade na entrada dos turnos do pátio.",
            icone: "🚨",
            rota: "/dashboard/ponto/atrasos"
        },
        {
            titulo: "Saídas Emergenciais",
            descricao: "Analisar justificativas obrigatórias de abandono temporário de posto.",
            icone: "🚒",
            rota: "/dashboard/ponto/emergencia"
        }
    ];

    return (
        <main className="relative min-h-screen bg-[#030303] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* BACKGROUND GRID MATRIX */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.012]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '45px 45px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-10 max-w-[1400px] mx-auto justify-center">

                {/* HEADER SUPERIOR */}
                <header className="w-full text-center border-b border-white/[0.05] pb-6 max-w-2xl mx-auto px-4">
                    <Link href="/dashboard" className="text-orange-500 font-bold text-[10px] uppercase tracking-[3px] mb-2 block hover:opacity-80 transition-all">
                        ← Retornar ao Terminal Geral
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Recursos Humanos</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold leading-relaxed">
                        Módulo de governança corporativa, segurança jurídica e controle de jornadas
                    </p>
                </header>

                {/* BLOCCO 1: AÇÕES DIRETAS DO RH */}
                <div className="w-full max-w-5xl mx-auto px-2">
                    <h2 className="text-[9px] font-black uppercase tracking-[3px] text-orange-500 mb-4 pl-1">
                        I. Diretoria & Administração
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {acoesDiretas.map((o, idx) => (
                            <Link
                                key={idx}
                                href={o.rota}
                                className="group relative bg-[#09090b]/90 border border-white/[0.06] hover:border-orange-500/40 rounded-[24px] p-6 shadow-xl transition-all flex flex-col justify-between hover:-translate-y-0.5 min-h-[160px]"
                            >
                                <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-xl bg-white/[0.02] border border-white/[0.04] w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                                        {o.icone}
                                    </div>
                                    <span className="text-[7px] font-black uppercase bg-orange-500/5 text-orange-400 px-2 py-0.5 rounded border border-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity">Acessar</span>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase text-white group-hover:text-orange-400 tracking-wide transition-colors">
                                        {o.titulo}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium leading-normal mt-1">
                                        {o.descricao}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* BLOCCO 2: AUDITORIA DE PÁTIO */}
                <div className="w-full max-w-5xl mx-auto px-2">
                    <h2 className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 mb-4 pl-1">
                        II. Auditoria de Pátio & Jornadas (Ponto)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        {auditoriaPonto.map((o, idx) => (
                            <Link
                                key={idx}
                                href={o.rota}
                                className="group relative bg-[#09090b]/80 border border-white/[0.04] hover:border-white/[0.15] rounded-[24px] p-5 shadow-xl transition-all flex flex-col justify-between hover:-translate-y-0.5 min-h-[150px]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-lg bg-white/[0.01] border border-white/[0.03] w-9 h-9 rounded-xl flex items-center justify-center shadow-inner">
                                        {o.icone}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-200 group-hover:text-white tracking-wide transition-colors">
                                        {o.titulo}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-normal mt-1">
                                        {o.descricao}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>

            {/* RODAPÉ OPERACIONAL */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-600 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-700">Módulo Core Security v3.0</div>
            </footer>
        </main>
    );
}