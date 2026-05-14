"use client";
import Link from 'next/link';

// Interface para o TypeScript
interface MenuCardProps {
    href: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
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

            {/* Grid com 8 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

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
                    title="Estoque"
                    desc="Peças e Etiquetas"
                    icon="📦"
                    color="bg-orange-600"
                />

                {/* TERMINAL DE PONTO (TOTEM) */}
                <MenuCard
                    href="/dashboard/ponto"
                    title="Totem Ponto"
                    desc="Registrar via Crachá"
                    icon="⏱️"
                    color="bg-orange-500"
                />

                {/* TERMINAL DE RETIRADA */}
                <MenuCard
                    href="/dashboard/retirada"
                    title="Retirada"
                    desc="Saída de Peças"
                    icon="🔧"
                    color="bg-blue-500"
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
                    title="Fechamento"
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

function MenuCard({ href, title, desc, icon, color }: MenuCardProps) {
    return (
        <Link href={href} className="group bg-slate-900 border border-white/5 p-6 rounded-[40px] hover:border-white/20 transition-all active:scale-95 flex flex-col items-center text-center">
            <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-xl group-hover:rotate-6 transition-transform`}>
                {icon}
            </div>
            <h2 className="text-lg font-black uppercase italic leading-none mb-2">{title}</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{desc}</p>
        </Link>
    );
}