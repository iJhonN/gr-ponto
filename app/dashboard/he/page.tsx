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
    tipo: 'extra' | 'pausa'; // Agora aceita pausa para o cálculo
    minutosAjuste?: number;  // Campo vindo da VPS
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
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!baseUrl) { setCarregando(false); return; }

            try {
                const [resFunc, resPontos] = await Promise.all([
                    fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' }),
                    fetch(`${baseUrl}/pontos`, { cache: 'no-store' })
                ]);

                if (resFunc.ok && resPontos.ok) {
                    const f = await resFunc.json();
                    const p = await resPontos.json();
                    const [ano, mes] = mesUrl.split('-').map(Number);

                    // Filtramos por mês/ano e apenas tipos que afetam o banco de horas
                    const filtrados = p.filter((ponto: PontoExtra) => {
                        const dt = new Date(ponto.data);
                        return (ponto.tipo === 'extra' || ponto.tipo === 'pausa') &&
                            (dt.getMonth() + 1) === mes &&
                            dt.getFullYear() === ano;
                    });
                    setDados({ extras: filtrados, funcionarios: f });
                }
            } catch (error) { console.error(error); }
            finally { setCarregando(false); }
        };
        buscarDados();
    }, [mesUrl]);

    const converterParaMinutos = (horario: string) => {
        if (!horario || horario === "--:--") return 0;
        const [h, m] = horario.split(':').map(Number);
        return (h * 60) + m;
    };

    const formatarMinutos = (total: number) => {
        const totalAbs = Math.abs(total);
        const h = Math.floor(totalAbs / 60);
        const m = totalAbs % 60;
        const sinal = total < 0 ? "-" : "";
        return `${sinal}${h}h ${m.toString().padStart(2, '0')}m`;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 text-black">
            <header className="flex justify-between items-center mb-8 print:hidden">
                <Link href="/dashboard" className="text-green-500 font-black text-[10px] uppercase tracking-widest hover:opacity-70">← Dashboard</Link>
                <div className="flex gap-4">
                    <input type="month" value={mesUrl} onChange={(e) => router.push(`/dashboard/he?mes=${e.target.value}`)} className="bg-slate-900 border border-white/10 p-2 rounded text-white font-bold text-xs" />
                    <button onClick={() => window.print()} className="bg-white text-black px-4 py-2 rounded font-black uppercase text-[10px] hover:bg-green-500 transition-all">Imprimir</button>
                </div>
            </header>

            <div className="bg-white p-0 md:p-8 print:p-0">
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-green-700">Fechamento de Horas Extras</h1>
                        <p className="text-[10px] font-bold text-slate-500">GR AUTOPEÇAS | COMPETÊNCIA: {mesUrl.split('-').reverse().join('/')}</p>
                    </div>
                    <p className="text-[8px] font-mono opacity-50 uppercase">Cálculo VPS v2.0</p>
                </div>

                {carregando ? (
                    <div className="py-10 text-center font-black uppercase animate-pulse">Calculando Folha...</div>
                ) : (
                    <div className="space-y-10">
                        {dados.funcionarios.map(func => {
                            const seusRegistros = dados.extras.filter(e => String(e.funcionarioId) === String(func.id));
                            if (seusRegistros.length === 0) return null;

                            let minDiurnos = 0;
                            let minNoturnos = 0;

                            return (
                                <section key={func.id} className="break-inside-avoid border border-slate-200 p-4">
                                    <div className="border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
                                        <h3 className="text-sm font-black uppercase">{func.nome} {func.sobrenome}</h3>
                                        <span className="text-[9px] font-bold text-slate-400 italic">{func.cargo}</span>
                                    </div>

                                    <table className="w-full text-[11px] border-collapse mb-4">
                                        <thead>
                                        <tr className="text-slate-500 uppercase text-[10px]">
                                            <th className="py-1 text-left border-b">Data</th>
                                            <th className="py-1 text-left border-b">Registro</th>
                                            <th className="py-1 text-right border-b">Classificação / Ajuste</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {seusRegistros.map((e, i) => {
                                            const minutosPonto = converterParaMinutos(e.horaFormatada);
                                            const isNoturno = minutosPonto >= 1080; // 18:00

                                            // Se for EXTRA (Automática ou Manual)
                                            if (e.tipo === 'extra') {
                                                if (e.horaFormatada === "--:--") {
                                                    // Manual: Adiciona direto nos diurnos (ou você pode ajustar a lógica se for extra noturna manual)
                                                    minDiurnos += (e.minutosAjuste || 0);
                                                } else {
                                                    // Automática (Bipe)
                                                    if (isNoturno) minNoturnos += (minutosPonto - 1080);
                                                    else minDiurnos += 30;
                                                }
                                            }
                                            // Se for PAUSA (Sempre manual)
                                            else if (e.tipo === 'pausa') {
                                                minDiurnos -= (e.minutosAjuste || 0);
                                            }

                                            return (
                                                <tr key={i} className="border-b border-slate-50">
                                                    <td className="py-2 font-medium">{new Date(e.data).toLocaleDateString('pt-BR')}</td>
                                                    <td className={`py-2 font-black ${e.tipo === 'pausa' ? 'text-purple-600' : 'text-green-700'}`}>
                                                        {e.horaFormatada !== "--:--" ? e.horaFormatada : `${e.minutosAjuste} min`}
                                                    </td>
                                                    <td className="py-2 text-right font-bold uppercase text-[9px]">
                                                        {e.tipo === 'pausa' ? '☕ Pausa Lançada' : (isNoturno ? '🌙 Noturna' : '☀️ Diurna')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>

                                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                                        <div className="bg-slate-50 p-2 text-center">
                                            <p className="text-[8px] font-black uppercase opacity-50">Saldo Diurno (c/ descontos)</p>
                                            <p className="text-sm font-black">{formatarMinutos(minDiurnos)}</p>
                                        </div>
                                        <div className="bg-green-50 p-2 text-center">
                                            <p className="text-[8px] font-black uppercase text-green-600">Total Noturnas</p>
                                            <p className="text-sm font-black text-green-700">{formatarMinutos(minNoturnos)}</p>
                                        </div>
                                    </div>
                                </section>
                            );
                        })}

                        <div className="pt-10 grid grid-cols-2 gap-10">
                            <div className="border-t border-black text-center pt-2">
                                <p className="text-[9px] font-black uppercase">Assinatura Colaborador</p>
                            </div>
                            <div className="border-t border-black text-center pt-2">
                                <p className="text-[9px] font-black uppercase">Conferido por Direção</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { background: white !important; color: black !important; }
                    header, .print\:hidden { display: none !important; }
                    .text-green-700 { color: #15803d !important; }
                    .text-purple-600 { color: #7c3aed !important; }
                }
            `}</style>
        </div>
    );
}

export default function HEAdmin() {
    return (
        <main className="min-h-screen bg-black text-white font-sans">
            <Suspense fallback={null}><ConteudoHorasExtras /></Suspense>
        </main>
    );
}