"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Atraso {
    id: string;
    funcionarioId: string;
    nome: string;
    data: string;
    horaFormatada: string;
    observacao: string;
    tipo: string;
}

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

function ConteudoAtrasos() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mesUrl = searchParams.get('mes') || '2026-05';

    const [dados, setDados] = useState<{ atrasos: Atraso[], funcionarios: Funcionario[] }>({
        atrasos: [],
        funcionarios: []
    });
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const buscarDados = async () => {
            setCarregando(true);

            // Puxa a URL da Vercel (Configurada no Enviroment)
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!baseUrl) {
                console.error("ERRO: NEXT_PUBLIC_API_URL não está configurada na Vercel.");
                setCarregando(false);
                return;
            }

            try {
                // Agora as chamadas usam a variável dinâmica
                const [resFunc, resPontos] = await Promise.all([
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/pontos`, { cache: 'no-store' })
                ]);

                if (resFunc.ok && resPontos.ok) {
                    const f = await resFunc.json();
                    const p = await resPontos.json();
                    const [ano, mes] = mesUrl.split('-').map(Number);

                    const filtrados = p.filter((ponto: Atraso) => {
                        const dt = new Date(ponto.data);
                        return ponto.tipo === 'alerta' &&
                            (dt.getMonth() + 1) === mes &&
                            dt.getFullYear() === ano;
                    });

                    setDados({ atrasos: filtrados, funcionarios: f });
                }
            } catch (error) {
                console.error("Erro ao conectar com a VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        buscarDados();
    }, [mesUrl]);

    const mudarMes = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/dashboard/atrasos?mes=${e.target.value}`);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 print:hidden">
                <div className="text-center md:text-left">
                    <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Voltar ao Início</Link>
                    <h1 className="text-3xl font-black uppercase italic leading-none">Relatório de <span className="text-orange-500">Atrasos</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={mesUrl}
                        onChange={mudarMes}
                        className="bg-slate-900 border border-white/10 p-3 rounded-xl text-white font-bold uppercase text-xs outline-none focus:border-orange-500"
                    />
                    <button
                        onClick={() => window.print()}
                        className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all active:scale-95"
                    >
                        🖨️ Imprimir Papel A4
                    </button>
                </div>
            </header>

            <div className="bg-white text-black p-12 rounded-[40px] shadow-2xl print:shadow-none print:p-0 print:rounded-none">
                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10 text-black">
                    <div>
                        <h2 className="text-4xl font-black uppercase italic leading-none">Inconsistências</h2>
                        <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-tighter">GR AUTOPEÇAS • DEPARTAMENTO DE RH</p>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-2xl uppercase italic text-black">{mesUrl.split('-').reverse().join('/')}</p>
                        <p className="text-[10px] font-bold opacity-40">GERADO VIA GR-ADMIN • VPS SYNC</p>
                    </div>
                </div>

                {carregando ? (
                    <div className="py-20 text-center font-black uppercase text-slate-300 animate-pulse tracking-[10px]">Auditando VPS...</div>
                ) : (
                    <div className="space-y-12">
                        {dados.funcionarios.map(func => {
                            const seusAtrasos = dados.atrasos.filter(a => String(a.funcionarioId) === String(func.id));
                            if (seusAtrasos.length === 0) return null;

                            return (
                                <section key={func.id} className="break-inside-avoid">
                                    <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border-l-8 border-black mb-4">
                                        <h3 className="text-xl font-black uppercase italic text-black">{func.nome} {func.sobrenome}</h3>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{func.cargo}</span>
                                    </div>

                                    <table className="w-full text-left text-sm border-collapse text-black">
                                        <thead>
                                        <tr className="border-b-2 border-slate-200">
                                            <th className="py-3 font-black uppercase text-[10px]">Data</th>
                                            <th className="py-3 font-black uppercase text-[10px]">Horário</th>
                                            <th className="py-3 font-black uppercase text-[10px] text-right">Observação</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {seusAtrasos.map((a, i) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="py-4 font-bold">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                                                <td className="py-4 font-black text-red-600">{a.horaFormatada}</td>
                                                <td className="py-4 text-right italic text-[10px] font-bold text-slate-400 uppercase">{a.observacao}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </section>
                            );
                        })}

                        {dados.atrasos.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                                <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Sem ocorrências no período.</p>
                            </div>
                        )}

                        <section className="pt-20 grid grid-cols-2 gap-20">
                            <div className="text-center border-t-2 border-black pt-4">
                                <p className="text-[10px] font-black uppercase">Responsável Operacional</p>
                            </div>
                            <div className="text-center border-t-2 border-black pt-4">
                                <p className="text-[10px] font-black uppercase">Recebido Contabilidade</p>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; size: A4; }
                    body { background: white !important; color: black !important; }
                    main { padding: 0 !important; background: white !important; }
                    header, .print\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}

export default function AtrasosAdmin() {
    return (
        <main className="min-h-screen bg-black text-white font-sans">
            <Suspense fallback={<div className="flex items-center justify-center h-screen font-black uppercase tracking-[10px] opacity-20">Carregando Relatório...</div>}>
                <ConteudoAtrasos />
            </Suspense>
        </main>
    );
}