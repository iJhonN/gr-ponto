"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Barcode from 'react-barcode';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

function ConteudoCrachas() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(true);
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
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, [baseUrl]);

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans print:bg-white print:p-0">
            {/* HEADER WEB */}
            <header className="max-w-5xl mx-auto mb-10 flex justify-between items-end print:hidden">
                <div>
                    <Link href="/dashboard/funcionario" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block">← Gestão</Link>
                    <h1 className="text-3xl font-black uppercase italic text-white leading-none">Emissão de <span className="text-orange-500">Crachás</span></h1>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[3px] mt-1 italic">Ajuste: Código de barras elevado</p>
                </div>
                <button onClick={() => window.print()} className="bg-orange-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20">
                    🖨️ Imprimir em Lote
                </button>
            </header>

            {/* GRADE DE CRACHÁS */}
            <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-2 print:gap-x-10 print:gap-y-16">
                {carregando ? (
                    <div className="col-span-full text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px]">Sincronizando Equipe...</div>
                ) : (
                    funcionarios.map((func) => (
                        <div
                            key={func.id}
                            className="relative mx-auto w-[320px] h-[480px] bg-white text-black border-[3px] border-slate-100 rounded-[30px] overflow-hidden shadow-2xl print:shadow-none print:border-black print:break-inside-avoid"
                        >
                            {/* Furo Cordão */}
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-slate-50 rounded-full border border-slate-200 print:border-black"></div>

                            {/* Header Crachá */}
                            <div className="pt-14 pb-4 text-center">
                                <h2 className="text-2xl font-black uppercase italic leading-none tracking-tighter text-black">GR <span className="text-orange-600">Autopeças</span></h2>
                                <div className="h-1 w-12 bg-orange-500 mx-auto mt-2"></div>
                            </div>

                            {/* Foto / Perfil */}
                            <div className="flex justify-center my-4">
                                <div className="w-28 h-28 bg-slate-50 border-[6px] border-orange-500 rounded-full flex items-center justify-center text-5xl font-black text-slate-200 italic shadow-lg">
                                    {func.nome.charAt(0)}
                                </div>
                            </div>

                            {/* Nomes */}
                            <div className="text-center px-6 mt-2">
                                <h3 className="text-3xl font-black uppercase italic leading-none text-black mb-1">
                                    {func.nome}
                                </h3>
                                <h4 className="text-2xl font-black uppercase italic text-slate-400 leading-none mb-2">
                                    {func.sobrenome}
                                </h4>
                                <p className="text-orange-600 text-[10px] font-black uppercase tracking-[5px] italic">
                                    {func.cargo}
                                </p>
                            </div>

                            {/* Código de Barras - Reduzido e Posicionado 10px para cima */}
                            <div className="absolute bottom-[60px] left-0 w-full flex flex-col items-center justify-center bg-white px-4">
                                <div className="scale-[1.1] origin-center">
                                    <Barcode
                                        value={func.id}
                                        width={1.2}
                                        height={45}
                                        fontSize={12}
                                        margin={5}
                                        background="#ffffff"
                                        lineColor="#000000"
                                    />
                                </div>
                            </div>

                            {/* Base */}
                            <div className="absolute bottom-0 w-full h-10 bg-orange-600 flex flex-col items-center justify-center">
                                <p className="text-[8px] font-black text-white uppercase tracking-[4px]">Acesso Autorizado • VPS Sync</p>
                            </div>
                        </div>
                    ))
                )}
            </section>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    header { display: none !important; }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { background: white !important; padding: 0 !important; }
                }
            `}</style>
        </main>
    );
}

export default function CrachasPage() {
    return (
        <Suspense fallback={null}>
            <ConteudoCrachas />
        </Suspense>
    );
}