"use client";
import Link from 'next/link';

export default function HubVeiculosPage() {
    const opcoes = [
        {
            titulo: "Cadastrar Novo Veículo",
            descricao: "Inserir caminhões, utilitários ou maquinários pesados (XCMG, VW) com especificações de consumo.",
            icone: "📄",
            rota: "/dashboard/frota/veiculo/cadastro"
        },
        {
            titulo: "Frota Cadastrada",
            descricao: "Auditar odômetros, médias de consumo e mídias de toda a frota operacional ativa.",
            icone: "📋",
            rota: "/dashboard/frota/veiculo/lista"
        }
    ];

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center max-w-[1400px] mx-auto">
                <header className="w-full text-center border-b border-white/[0.05] pb-8 max-w-2xl mx-auto px-4 mb-10">
                    <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-2 block hover:opacity-80 transition-all">
                        ← Menu de Frotas
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                        Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Veículos</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mx-auto px-4">
                    {opcoes.map((o, idx) => (
                        <Link
                            key={idx}
                            href={o.rota}
                            className="group relative bg-[#1a1f29] border border-white/[0.06] hover:border-blue-500/40 rounded-[24px] p-6 shadow-xl transition-all flex flex-col justify-between hover:-translate-y-1"
                        >
                            <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                            <div className="space-y-3">
                                <div className="text-xl bg-white/[0.02] w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.04]">
                                    {o.icone}
                                </div>
                                <h2 className="text-sm font-black uppercase text-white group-hover:text-blue-400 transition-colors">
                                    {o.titulo} ➔
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                    {o.descricao}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 text-center text-[8px] text-slate-500 uppercase font-bold tracking-[3px]">
                GR Autopeças & Distribuição • Fleet Control Unit
            </footer>
        </main>
    );
}