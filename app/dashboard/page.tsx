"use client";
import Link from 'next/link';

// Interface para o TypeScript
interface MenuCardProps {
    href: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
    destaque?: boolean;
}

export default function DashboardHome() {
    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <header className="flex justify-between items-end mb-12 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-4xl font-black uppercase italic text-orange-500 leading-none">Dashboard</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-[5px] mt-2 font-bold">Gestão Centralizada GR Autopeças</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-green-500 uppercase italic">Sincronizado: VPS Hostinger</p>
                </div>
            </header>

            {/* Grid Principal - 8 cards com destaque nos dois primeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">

                {/* 1º PRINCIPAL: TERMINAL DE PONTO (TOTEM) */}
                <MenuCard
                    href="/dashboard/ponto"
                    title="Totem Ponto"
                    desc="Registrar via Crachá / Código"
                    icon="⏱️"
                    color="bg-orange-500 shadow-lg shadow-orange-500/20"
                    destaque={true}
                />

                {/* 2º PRINCIPAL: TERMINAL DE RETIRADA */}
                <MenuCard
                    href="/dashboard/retirada"
                    title="Retirada"
                    desc="Saída e devolução de ferramentas"
                    icon="🔧"
                    color="bg-blue-500 shadow-lg shadow-blue-500/20"
                    destaque={true}
                />

                {/* CARD FUNCIONÁRIOS */}
                <MenuCard
                    href="/dashboard/funcionario"
                    title="Equipe"
                    desc="Lista e Crachás"
                    icon="👤"
                    color="bg-blue-600"
                />

                {/* CARD FERRAMENTAS (ESTOQUE) */}
                <MenuCard
                    href="/dashboard/ferramenta"
                    title="Ferramentas"
                    desc="Ferramentas e Etiquetas"
                    icon="📦"
                    color="bg-orange-600"
                />

                {/* CARD REGISTRAR (MANUAL) */}
                <MenuCard
                    href="/dashboard/registrar"
                    title="Ajustes"
                    desc="Pausas e Extras Manuais"
                    icon="✍️"
                    color="bg-indigo-600"
                />

                {/* CARD ATRASOS */}
                <MenuCard
                    href="/dashboard/atrasos"
                    title="Atrasos"
                    desc="Inconsistências"
                    icon="⚠️"
                    color="bg-red-600"
                />

                {/* CARD HORAS EXTRAS */}
                <MenuCard
                    href="/dashboard/he"
                    title="Horas Extras"
                    desc="Cálculo de Extras"
                    icon="💰"
                    color="bg-green-600"
                />

                {/* CARD CALENDÁRIO */}
                <MenuCard
                    href="/dashboard/calendario"
                    title="Espelho"
                    desc="Visão Mensal"
                    icon="📅"
                    color="bg-slate-800"
                />
            </div>
        </main>
    );
}

function MenuCard({ href, title, desc, icon, color, destaque = false }: MenuCardProps) {
    return (
        <Link
            href={href}
            className={`group transition-all active:scale-95 flex flex-col items-center text-center ${
                destaque
                    ? `bg-slate-850 border-2 ${href.includes('ponto') ? 'border-orange-500/40 hover:border-orange-500' : 'border-blue-500/40 hover:border-blue-500'} p-7 rounded-[40px] lg:scale-105 z-10 shadow-2xl`
                    : 'bg-slate-900 border border-white/5 p-6 rounded-[40px] hover:border-white/20'
            }`}
        >
            <div className={`${color} ${destaque ? 'w-16 h-16 text-3xl' : 'w-14 h-14 text-2xl'} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6`}>
                {icon}
            </div>
            <h2 className={`${destaque ? 'text-xl' : 'text-lg'} font-black uppercase italic leading-none mb-2`}>{title}</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{desc}</p>
        </Link>
    );
}