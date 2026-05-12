"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Barcode from 'react-barcode';

interface Ferramenta {
    id: string;
    nome: string;
}

export default function EtiquetasFerramentas() {
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [itemIndividual, setItemIndividual] = useState<Ferramenta | null>(null);

    useEffect(() => {
        const carregarDados = async () => {
            setCarregando(true);

            // Puxa a URL configurada no painel da Vercel
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!baseUrl) {
                console.error("ERRO: NEXT_PUBLIC_API_URL não definida na Vercel.");
                setCarregando(false);
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/ferramentas`, {
                    cache: 'no-store'
                });
                if (response.ok) {
                    const dados = await response.json();
                    setFerramentas(dados);
                }
            } catch (error) {
                console.error("Erro ao carregar ferramentas da VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, []);

    const imprimirIndividual = (item: Ferramenta) => {
        setItemIndividual(item);
        setTimeout(() => {
            window.print();
            setItemIndividual(null);
        }, 100);
    };

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans print:bg-white print:p-0">

            {/* CABEÇALHO - OCULTO NA IMPRESSÃO */}
            <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6 print:hidden">
                <div>
                    <Link href="/dashboard/ferramenta" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Gestão de Ativos</Link>
                    <h1 className="text-4xl font-black uppercase italic leading-none text-white">Etiquetas de <span className="text-orange-500">Identificação</span></h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-widest italic">Padrão de Impressão: Grade 4xN (A4)</p>
                </div>

                <button
                    onClick={() => window.print()}
                    className="bg-orange-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all active:scale-95 shadow-xl"
                >
                    🖨️ Imprimir Todas
                </button>
            </header>

            {/* GRADE DE ETIQUETAS */}
            <section className={`max-w-6xl mx-auto ${itemIndividual ? 'print:hidden' : 'print:grid print:grid-cols-4 print:gap-2'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
                {carregando ? (
                    <div className="col-span-full text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px]">Sincronizando Inventário...</div>
                ) : (
                    ferramentas.map((item) => (
                        <div
                            key={item.id}
                            className="bg-slate-900 border border-white/5 p-6 rounded-[30px] flex flex-col items-center justify-center gap-4 transition-all hover:border-orange-500/30 print:border print:border-black print:rounded-none print:bg-white print:text-black print:shadow-none print:break-inside-avoid print:h-[140px] print:w-full"
                        >
                            <div className="text-center w-full">
                                <h3 className="font-black uppercase italic text-xs leading-tight truncate mb-1 print:text-[9px] text-white print:text-black">
                                    {item.nome}
                                </h3>
                                <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest print:hidden">Ref: {item.id}</p>
                            </div>

                            <div className="bg-white p-2 rounded-xl flex flex-col items-center print:p-0">
                                <Barcode
                                    value={item.id}
                                    width={1.1}
                                    height={35}
                                    fontSize={9}
                                    margin={0}
                                />
                                <p className="mt-1 text-[6px] font-black text-black opacity-30 uppercase tracking-[2px]">GR AUTOPEÇAS</p>
                            </div>

                            <button
                                onClick={() => imprimirIndividual(item)}
                                className="text-[8px] font-black uppercase text-orange-500 border border-orange-500/20 px-4 py-2 rounded-full hover:bg-orange-500 hover:text-black transition-all print:hidden"
                            >
                                Individual
                            </button>
                        </div>
                    ))
                )}
            </section>

            {/* FOCO DE IMPRESSÃO INDIVIDUAL */}
            {itemIndividual && (
                <div className="hidden print:flex flex-col items-center justify-center h-screen w-full">
                    <h1 className="text-4xl font-black uppercase italic mb-8 text-black">{itemIndividual.nome}</h1>
                    <div className="border-[12px] border-black p-12 bg-white">
                        <Barcode
                            value={itemIndividual.id}
                            width={3.5}
                            height={160}
                            fontSize={25}
                        />
                    </div>
                    <p className="mt-10 font-black tracking-[25px] text-2xl uppercase text-black opacity-40">GR AUTOPEÇAS</p>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    header, .print\:hidden, [class*="print:hidden"] {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    main {
                        background: white !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </main>
    );
}