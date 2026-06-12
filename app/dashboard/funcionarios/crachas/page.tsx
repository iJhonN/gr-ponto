"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

// COMPONENTE NATIVO: Gera as linhas do código de barras usando apenas CSS Puro
function CodigoBarrasNativo({ value }: { value: string }) {
    // Transforma os caracteres do ID em um padrão visual estável de barras largas e finas
    const obterPadraoBarras = (texto: string) => {
        const hash = texto.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const sequenciaBase = "101100101011011010010110101100101"; // Padrão start/stop simulado
        let resultado = "";

        // Gera um padrão visual repetível baseado no peso do ID do crachá
        for (let i = 0; i < 4; i++) {
            resultado += sequenciaBase.split('').reverse().join('');
            if (hash % 2 === 0) resultado += "1100101";
        }
        return resultado.slice(0, 55); // Limita o tamanho horizontal
    };

    const padrao = obterPadraoBarras(value);

    return (
        <div className="flex flex-col items-center justify-center bg-white p-1">
            {/* Linhas pretas e brancas do código */}
            <div className="flex items-end h-[45px]">
                {padrao.split('').map((bit, idx) => (
                    <div
                        key={idx}
                        className={`h-full ${bit === '1' ? 'bg-black' : 'bg-transparent'} ${
                            idx % 3 === 0 ? 'w-[2px]' : 'w-[1.2px]'
                        }`}
                    />
                ))}
            </div>
            {/* Texto do ID centralizado abaixo das listras */}
            <div className="text-[12px] font-mono font-black tracking-[5px] mt-1 uppercase text-black">
                {value}
            </div>
        </div>
    );
}

function ConteudoCrachas() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const carregarDados = async () => {
            setCarregando(true);
            try {
                // Puxa direto da sua tabela oficial do Supabase
                const { data, error } = await supabase
                    .from('funcionarios')
                    .select('*')
                    .order('nome', { ascending: true });

                if (error) throw error;
                if (data) setFuncionarios(data as Funcionario[]);
            } catch (error) {
                console.error("Erro ao sincronizar crachás:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, []);

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans print:bg-white print:p-0">
            {/* HEADER WEB */}
            <header className="max-w-5xl mx-auto mb-10 flex justify-between items-end print:hidden">
                <div>
                    <Link href="/dashboard/funcionarios" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block">← Gestão</Link>
                    <h1 className="text-3xl font-black uppercase italic text-white leading-none">Emissão de <span className="text-orange-500">Crachás</span></h1>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[3px] mt-1 italic">Design Limpo: Sem sombras</p>
                </div>
                <button onClick={() => window.print()} className="bg-orange-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all active:scale-95">
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
                            className="relative mx-auto w-[320px] h-[480px] bg-white text-black border-[3px] border-slate-100 rounded-[30px] overflow-hidden print:border-black print:break-inside-avoid"
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
                                <div className="w-28 h-28 bg-slate-50 border-[6px] border-orange-500 rounded-full flex items-center justify-center text-5xl font-black text-slate-200 italic">
                                    {(func.nome || 'G').charAt(0).toUpperCase()}
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

                            {/* Código de Barras Gerado puramente com CSS Divs */}
                            <div className="absolute bottom-[60px] left-0 w-full flex flex-col items-center justify-center bg-white px-4">
                                <div className="scale-[1.1] origin-center">
                                    <CodigoBarrasNativo value={func.id} />
                                </div>
                            </div>

                            {/* Base */}
                            <div className="absolute bottom-0 w-full h-10 bg-orange-600 flex flex-col items-center justify-center">
                                <p className="text-[8px] font-black text-white uppercase tracking-[4px]">Crachá de Acesso</p>
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