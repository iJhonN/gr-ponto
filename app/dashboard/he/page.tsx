"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PontoExtra {
    id: string;
    funcionarioId: string;
    nome: string;
    data: string;
    horaFormatada: string;
    observacao: string;
    tipo: 'extra';
}

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

function ConteudoHorasExtras() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mesUrl = searchParams.get('mes') || '2026-05';

    const [dados, setDados] = useState<{ extras: PontoExtra[], funcionarios: Funcionario[] }>({
        extras: [],
        funcionarios: []
    });
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const buscarDados = async () => {
            setCarregando(true);

            // Puxa a URL configurada na Vercel
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!baseUrl) {
                console.error("ERRO: NEXT_PUBLIC_API_URL não configurada.");
                setCarregando(false);
                return;
            }

            try {
                const [resFunc, resPontos] = await Promise.all([
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/pontos`, { cache: 'no-store' })
                ]);

                if (resFunc.ok && resPontos.ok) {
                    const f = await resFunc.json();
                    const p = await resPontos.json();
                    const [ano, mes] = mesUrl.split('-').map(Number);

                    const filtrados = p.filter((ponto: PontoExtra) => {
                        const dt = new Date(ponto.data);
                        return ponto.tipo === 'extra' &&
                            (dt.getMonth() + 1) === mes &&
                            dt.getFullYear() === ano;
                    });

                    setDados({ extras: filtrados, funcionarios: f });
                }
            } catch (error) {
                console.error("Erro VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        buscarDados();
    }, [mesUrl]);

    const converterParaMinutos = (horario: string) => {
        const [h, m] = horario.split(':').map(Number);
        return (h * 60) + m;
    };

    const formatarMinutos = (total: number) => {
        const h = Math.floor(total / 60);
        const m = total % 60;
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 print:hidden">
                <div>
                    <Link href="/dashboard" className="text-green-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Painel Admin</Link>
                    <h1 className="text-3xl font-black uppercase italic leading-none text-white">Horas <span className="text-green-500">Extras</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={mesUrl}
                        onChange={(e) => router.push(`/dashboard/he?mes=${e.target.value}`)}
                        className="bg-slate-900 border border-white/10 p-3 rounded-xl text-white font-bold uppercase text-xs outline-none focus:border-green-500"
                    />
                    <button
                        onClick={() => window.print()}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-900/20"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </header>

            <div className="bg-white text-black p-12 rounded-[40px] shadow-2xl print:shadow-none print:p-0 print:rounded-none">
                <div className="flex justify-between items-start border-b-4 border-green-600 pb-8 mb-10">
                    <div>
                        <h2 className="text-4xl font-black uppercase italic leading-none text-green-700">Adicionais</h2>
                        <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-tighter">GR AUTOPEÇAS • GESTÃO DE PRODUTIVIDADE</p>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-2xl uppercase italic text-black">{mesUrl.split('-').reverse().join('/')}</p>
                        <p className="text-[9px] font-bold opacity-40">GERADO VIA GR-ADMIN • SYNC VPS</p>
                    </div>
                </div>

                {carregando ? (
                    <div className="py-20 text-center font-black uppercase text-slate-300 animate-pulse tracking-[10px]">Processando Banco de Horas...</div>
                ) : (
                    <div className="space-y-16">
                        {dados.funcionarios.map(func => {
                            const suasExtras = dados.extras.filter(e => String(e.funcionarioId) === String(func.id));
                            if (suasExtras.length === 0) return null;

                            let minDiurnos = 0;
                            let minNoturnos = 0;

                            suasExtras.forEach(e => {
                                const [h] = e.horaFormatada.split(':').map(Number);
                                if (h >= 18) {
                                    minNoturnos += (converterParaMinutos(e.horaFormatada) - converterParaMinutos("18:00"));
                                } else {
                                    minDiurnos += 30;
                                }
                            });

                            return (
                                <section key={func.id} className="break-inside-avoid">
                                    <div className="flex justify-between items-center bg-green-50 p-5 rounded-2xl border-l-8 border-green-700 mb-6 text-black">
                                        <h3 className="text-2xl font-black uppercase italic">{func.nome} {func.sobrenome}</h3>
                                        <p className="text-[10px] font-black uppercase text-green-800 tracking-widest">{func.cargo}</p>
                                    </div>

                                    <table className="w-full text-left text-[12px] border-collapse mb-6 text-black">
                                        <thead>
                                        <tr className="border-b-2 border-slate-200 text-slate-400 uppercase">
                                            <th className="py-3 font-black">Data</th>
                                            <th className="py-3 font-black">Registro</th>
                                            <th className="py-3 font-black text-right">Classificação</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {suasExtras.map((e, i) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="py-4 font-bold">{new Date(e.data).toLocaleDateString('pt-BR')}</td>
                                                <td className="py-4 font-black text-green-700">{e.horaFormatada}</td>
                                                <td className="py-4 text-right italic font-black uppercase text-[10px] text-slate-400">
                                                    {converterParaMinutos(e.horaFormatada) >= 1080 ? '🌙 Noturna' : '☀️ Diurna'}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-black">
                                        <div className="border-r border-slate-200">
                                            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Extras Diurnas</p>
                                            <p className="text-2xl font-black italic">{formatarMinutos(minDiurnos)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-green-700 tracking-widest">Extras Noturnas</p>
                                            <p className="text-2xl font-black italic">{formatarMinutos(minNoturnos)}</p>
                                        </div>
                                    </div>
                                </section>
                            );
                        })}

                        <section className="pt-20 grid grid-cols-2 gap-20">
                            <div className="text-center border-t-2 border-black pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-black">Visto do Colaborador</p>
                            </div>
                            <div className="text-center border-t-2 border-black pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-black">Diretoria GR Autopeças</p>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; size: A4; }
                    body { background: white !important; color: black !important; }
                    header, .print\:hidden { display: none !important; }
                    .text-green-700 { color: #15803d !important; }
                }
            `}</style>
        </div>
    );
}

export default function HEAdmin() {
    return (
        <main className="min-h-screen bg-black text-white font-sans">
            <Suspense fallback={<div className="flex items-center justify-center h-screen font-black uppercase opacity-20 tracking-[10px]">Calculando Horas Extras...</div>}>
                <ConteudoHorasExtras />
            </Suspense>
        </main>
    );
}