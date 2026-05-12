"use client";
import Link from 'next/link';

// Definindo a interface para o TypeScript aceitar as propriedades do card
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* CARD FUNCIONÁRIOS */}
                <MenuCard
                    href="/dashboard/funcionario"
                    title="Equipe"
                    desc="Lista, Crachás e Gestão"
                    icon="👤"
                    color="bg-blue-600"
                />

                {/* CARD FERRAMENTAS */}
                <MenuCard
                    href="/dashboard/ferramenta"
                    title="Ferramentas"
                    desc="Estoque, Etiquetas e Uso"
                    icon="🔧"
                    color="bg-orange-600"
                />

                {/* CARD PONTOS/RELATÓRIOS */}
                <MenuCard
                    href="/dashboard/atrasos"
                    title="Contabilidade"
                    desc="Relatórios e Horas Extras"
                    icon="📊"
                    color="bg-green-600"
                />

                {/* CARD CALENDÁRIO */}
                <MenuCard
                    href="/dashboard/calendario"
                    title="Calendário"
                    desc="Visão Mensal de Pontos"
                    icon="📅"
                    color="bg-slate-800"
                />
            </div>
        </main>
    );
}

// Componente corrigido com a tipagem MenuCardProps
function MenuCard({ href, title, desc, icon, color }: MenuCardProps) {
    return (
        <Link href={href} className="group bg-slate-900 border border-white/5 p-8 rounded-[45px] hover:border-white/20 transition-all active:scale-95">
            <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-xl group-hover:rotate-6 transition-transform`}>
                {icon}
            </div>
            <h2 className="text-2xl font-black uppercase italic leading-none mb-2">{title}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{desc}</p>
        </Link>
    );
}