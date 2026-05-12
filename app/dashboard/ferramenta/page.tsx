"use client";
import Link from 'next/link';

// Definindo os tipos para o TypeScript não travar o build no Vercel
interface HubCardProps {
    href: string;
    title: string;
    desc: string;
    icon: string;
    bg: string;
}

export default function FerramentaHub() {
    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 font-sans flex flex-col items-center justify-center">

            <header className="text-center mb-16 animate-in fade-in slide-in-from-top duration-700">
                <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[5px] mb-4 inline-block hover:opacity-70 transition-all">
                    ← Voltar ao Início
                </Link>
                <h1 className="text-5xl font-black uppercase italic leading-none tracking-tighter text-white">
                    Controle de <span className="text-orange-500">Ativos</span>
                </h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mt-4">Gestão de Ferramental e Inventário GR</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">

                {/* LISTA E CADASTRO */}
                <HubCard
                    href="/dashboard/ferramenta/lista"
                    title="Inventário"
                    desc="Listar todas as ferramentas e cadastrar novos itens no sistema."
                    icon="🔧"
                    bg="bg-slate-900"
                />

                {/* ETIQUETAS */}
                <HubCard
                    href="/dashboard/ferramenta/etiquetas"
                    title="Etiquetas"
                    desc="Gerar e imprimir etiquetas com QR Code/Código de Barras para identificação."
                    icon="🖨️"
                    bg="bg-orange-600"
                />

                {/* HISTÓRICO DE USO */}
                <HubCard
                    href="/dashboard/ferramenta/historico"
                    title="Histórico de Uso"
                    desc="Ver quem retirou ferramentas, horários e termos de responsabilidade."
                    icon="📜"
                    bg="bg-slate-900"
                />

                {/* STATUS EM TEMPO REAL */}
                <HubCard
                    href="/dashboard/ferramenta/status"
                    title="Painel de Status"
                    desc="Visão rápida de ferramentas em manutenção ou extraviadas."
                    icon="⚠️"
                    bg="bg-zinc-800"
                />
            </div>

            <footer className="mt-20 opacity-20">
                <p className="text-[8px] font-black uppercase tracking-[10px]">GR AUTOPEÇAS • TECNOLOGIA OPERACIONAL</p>
            </footer>
        </main>
    );
}

// Componente tipado corretamente
function HubCard({ href, title, desc, icon, bg }: HubCardProps) {
    return (
        <Link href={href} className="group relative overflow-hidden">
            <div className={`h-full border border-white/5 p-8 rounded-[45px] transition-all duration-300 group-hover:border-white/20 group-hover:-translate-y-1 ${bg === 'bg-orange-600' ? 'bg-orange-600' : 'bg-slate-900/50 backdrop-blur-xl'}`}>
                <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500 block">{icon}</span>
                    <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity text-white">→</span>
                </div>
                <h2 className="text-2xl font-black uppercase italic leading-none mb-3 text-white">{title}</h2>
                <p className={`text-xs leading-relaxed font-bold uppercase opacity-60 ${bg === 'bg-orange-600' ? 'text-orange-100' : 'text-slate-400'}`}>
                    {desc}
                </p>
            </div>
        </Link>
    );
}