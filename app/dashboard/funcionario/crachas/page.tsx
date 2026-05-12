"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Barcode from 'react-barcode';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

export default function CrachasPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [itemIndividual, setItemIndividual] = useState<Funcionario | null>(null);

    // Puxa a URL configurada na Vercel
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const carregarDados = async () => {
            if (!baseUrl) return;
            setCarregando(true);
            try {
                const response = await fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' });
                if (response.ok) {
                    const dados = await response.json();
                    setFuncionarios(dados);
                }
            } catch (error) {
                console.error("Erro ao carregar dados da VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, [baseUrl]);

    const imprimirIndividual = (func: Funcionario) => {
        setItemIndividual(func);
        setTimeout(() => {
            window.print();
            setItemIndividual(null);
        }, 300);
    };

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans print:bg-white print:p-0">

            {/* CABEÇALHO - OCULTO NA IMPRESSÃO */}
            <header className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6 print:hidden animate-in fade-in slide-in-from-top duration-500">
                <div>
                    <Link href="/dashboard/funcionario" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Painel de Gestão</Link>
                    <h1 className="text-4xl font-black uppercase italic leading-none text-white">Emissão de <span className="text-orange-500">Crachás</span></h1>
                </div>

                <button
                    onClick={() => window.print()}
                    className="bg-orange-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-900/20"
                >
                    🖨️ Imprimir Todos (Lote)
                </button>
            </header>

            {/* GRADE DE CRACHÁS */}
            <section className={`max-w-5xl mx-auto ${itemIndividual ? 'print:hidden' : 'print:grid print:grid-cols-2 print:gap-x-12 print:gap-y-12'} flex flex-col gap-6`}>
                {carregando ? (
                    <div className="text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px]">Sincronizando Equipe...</div>
                ) : (
                    funcionarios.map((func) => (
                        <div
                            key={func.id}
                            className="bg-slate-900 border border-white/5 p-1 rounded-[40px] flex group transition-all hover:border-orange-500/30 print:border-[3px] print:border-black print:rounded-[35px] print:bg-white print:text-black print:shadow-none print:break-inside-avoid print:w-[380px] print:h-[220px] overflow-hidden"
                        >
                            <div className="w-1/3 bg-orange-600 flex flex-col items-center justify-center p-4 print:bg-orange-600 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
                                <div className="w-20 h-20 bg-black/15 rounded-[25px] flex items-center justify-center text-4xl font-black text-black uppercase italic mb-2">
                                    {func.nome.charAt(0)}
                                </div>
                                <p className="text-[7px] font-black uppercase tracking-[3px] text-black/60 rotate-[-90deg] mt-6 origin-center whitespace-nowrap">GR AUTOPEÇAS</p>
                            </div>

                            <div className="flex-1 p-8 flex flex-col justify-between bg-slate-900 print:bg-white">
                                <div>
                                    <h3 className="font-black text-2xl leading-none uppercase italic mb-1 text-white print:text-black">
                                        {func.nome} <br /> {func.sobrenome}
                                    </h3>
                                    <p className="text-orange-500 text-[10px] font-black uppercase tracking-[4px] italic">
                                        {func.cargo}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start gap-2 mt-auto pt-6">
                                    <div className="bg-white p-2 rounded-lg inline-block border border-slate-100 shadow-sm">
                                        <Barcode
                                            value={func.id}
                                            width={1.2}
                                            height={40}
                                            fontSize={10}
                                            margin={0}
                                        />
                                    </div>
                                    <button
                                        onClick={() => imprimirIndividual(func)}
                                        className="mt-2 text-[8px] font-black uppercase text-slate-500 border border-slate-200/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all print:hidden"
                                    >
                                        Imprimir Solo
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* FOCO DE IMPRESSÃO INDIVIDUAL */}
            {itemIndividual && (
                <div className="hidden print:flex flex-col items-center justify-center h-screen w-full bg-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                    <div className="border-[4px] border-black p-1 rounded-[45px] flex w-[500px] h-[300px] overflow-hidden bg-white shadow-none">
                        <div className="w-1/3 bg-orange-600 flex flex-col items-center justify-center p-6 print:bg-orange-600 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
                            <div className="w-24 h-24 bg-black/10 rounded-[30px] flex items-center justify-center text-6xl font-black text-black uppercase italic">
                                {itemIndividual.nome.charAt(0)}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[5px] text-black/50 rotate-[-90deg] mt-12 whitespace-nowrap">GR AUTOPEÇAS</p>
                        </div>

                        <div className="flex-1 p-10 flex flex-col justify-between bg-white">
                            <div>
                                <h3 className="font-black text-4xl leading-tight uppercase italic mb-2 text-black">
                                    {itemIndividual.nome} <br /> {itemIndividual.sobrenome}
                                </h3>
                                <p className="text-orange-600 text-sm font-black uppercase tracking-[6px] italic">
                                    {itemIndividual.cargo}
                                </p>
                            </div>

                            <div className="bg-white pt-6 mt-auto">
                                <div className="inline-block bg-white p-2 border border-slate-100 rounded-lg">
                                    <Barcode
                                        value={itemIndividual.id}
                                        width={1.8}
                                        height={60}
                                        fontSize={14}
                                        margin={0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    header, .print\:hidden, [class*="print:hidden"] { display: none !important; }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { background: white !important; padding: 0 !important; }
                }
            `}</style>
        </main>
    );
}