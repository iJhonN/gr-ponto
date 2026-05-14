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
                    <h1 className="text-3xl font-black uppercase italic">Impressão de <span className="text-orange-500">Crachás Verticais</span></h1>
                </div>
                <button onClick={() => window.print()} className="bg-orange-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20">
                    🖨️ Imprimir Lote A4
                </button>
            </header>

            {/* GRADE DE CRACHÁS VERTICAIS */}
            <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3 print:gap-4">
                {carregando ? (
                    <div className="col-span-full text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px]">Sincronizando...</div>
                ) : (
                    funcionarios.map((func) => (
                        <div
                            key={func.id}
                            className="relative mx-auto w-[280px] h-[420px] bg-white text-black border-2 border-slate-200 rounded-[20px] overflow-hidden shadow-2xl print:shadow-none print:border-black print:break-inside-avoid"
                        >
                            {/* Detalhe do Furo do Cordão */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-3 bg-slate-100 rounded-full border border-slate-200 print:border-black"></div>

                            {/* Topo / Logo */}
                            <div className="pt-12 pb-4 text-center">
                                <h2 className="text-xl font-black uppercase italic leading-none tracking-tighter">GR <span className="text-orange-600">Autopeças</span></h2>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[3px]">Controle de Acesso</p>
                            </div>

                            {/* Foto / Avatar */}
                            <div className="flex justify-center my-2">
                                <div className="w-24 h-24 bg-slate-100 border-4 border-orange-500 rounded-full flex items-center justify-center text-4xl font-black text-slate-300 italic">
                                    {func.nome.charAt(0)}
                                </div>
                            </div>

                            {/* Informações */}
                            <div className="text-center px-4 mt-2">
                                <h3 className="text-2xl font-black uppercase italic leading-tight text-black">
                                    {func.nome} <br /> {func.sobrenome}
                                </h3>
                                <p className="text-orange-600 text-[10px] font-black uppercase tracking-[4px] mt-1 italic">
                                    {func.cargo}
                                </p>
                            </div>

                            {/* Área do Código de Barras (Otimizada para Scanner) */}
                            <div className="absolute bottom-10 left-0 w-full flex flex-col items-center bg-white">
                                <div className="scale-[1.3] mb-2"> {/* Aumenta o código de barras sem quebrar o layout */}
                                    <Barcode
                                        value={func.id}
                                        width={1.2}
                                        height={50}
                                        fontSize={10}
                                        background="#ffffff"
                                        lineColor="#000000"
                                        margin={0}
                                    />
                                </div>
                            </div>

                            {/* Rodapé do Crachá */}
                            <div className="absolute bottom-0 w-full h-8 bg-orange-600 flex items-center justify-center">
                                <p className="text-[7px] font-black text-white uppercase tracking-[3px]">Felinto Tech | VPS Sync</p>
                            </div>
                        </div>
                    ))
                )}
            </section>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    header { display: none !important; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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