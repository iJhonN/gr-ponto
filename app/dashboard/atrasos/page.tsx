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

                    const filtrados = p.filter((ponto: Atraso) => {
                        const dt = new Date(ponto.data);
                        return ponto.tipo === 'alerta' &&
                            (dt.getMonth() + 1) === mes &&
                            dt.getFullYear() === ano;
                    });
                    setDados({ atrasos: filtrados, funcionarios: f });
                }
            } catch (error) {
                console.error("Erro VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        buscarDados();
    }, [mesUrl]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            {/* CONTROLES WEB */}
            <header className="flex justify-between items-center mb-8 print:hidden">
                <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:opacity-70">← Dashboard</Link>
                <div className="flex gap-4">
                    <input type="month" value={mesUrl} onChange={(e) => router.push(`/dashboard/atrasos?mes=${e.target.value}`)} className="bg-slate-900 border border-white/10 p-2 rounded text-white font-bold text-xs" />
                    <button onClick={() => window.print()} className="bg-white text-black px-4 py-2 rounded font-black uppercase text-[10px] hover:bg-orange-500 transition-all">Imprimir</button>
                </div>
            </header>

            {/* RELATÓRIO COMPACTO */}
            <div className="bg-white text-black p-0 md:p-8 print:p-0">
                {/* CABEÇALHO DIRETO */}
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Relatório de Inconsistências</h1>
                        <p className="text-[10px] font-bold text-slate-500">GR AUTOPEÇAS | MÊS: {mesUrl.split('-').reverse().join('/')}</p>
                    </div>
                    <p className="text-[8px] font-mono opacity-50 uppercase">Gerado via Admin-VPS</p>
                </div>

                {carregando ? (
                    <div className="py-10 text-center font-black uppercase animate-pulse">Sincronizando...</div>
                ) : (
                    <div className="space-y-8">
                        {dados.funcionarios.map(func => {
                            const seusAtrasos = dados.atrasos.filter(a => String(a.funcionarioId) === String(func.id));
                            if (seusAtrasos.length === 0) return null;

                            return (
                                <section key={func.id} className="break-inside-avoid border border-slate-200 p-4">
                                    <div className="border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
                                        <h3 className="text-sm font-black uppercase">{func.nome} {func.sobrenome}</h3>
                                        <span className="text-[9px] font-bold text-slate-400 italic">{func.cargo}</span>
                                    </div>

                                    <table className="w-full text-[11px] border-collapse">
                                        <thead>
                                        <tr className="text-slate-500 uppercase">
                                            <th className="py-1 text-left border-b">Data</th>
                                            <th className="py-1 text-left border-b">Horário Registro</th>
                                            <th className="py-1 text-right border-b">Ocorrência</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {seusAtrasos.map((a, i) => (
                                            <tr key={i} className="border-b border-slate-50">
                                                <td className="py-2 font-medium">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                                                <td className="py-2 font-black">{a.horaFormatada}</td>
                                                <td className="py-2 text-right text-red-600 font-bold uppercase text-[9px]">{a.observacao}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </section>
                            );
                        })}

                        {dados.atrasos.length === 0 && (
                            <p className="py-10 text-center text-slate-400 font-bold uppercase text-xs">Nenhuma inconsistência no período.</p>
                        )}

                        {/* ASSINATURAS SIMPLES */}
                        <div className="pt-10 grid grid-cols-2 gap-10">
                            <div className="border-t border-black text-center pt-2">
                                <p className="text-[9px] font-black uppercase">Responsável RH</p>
                            </div>
                            <div className="border-t border-black text-center pt-2">
                                <p className="text-[9px] font-black uppercase">Financeiro</p>
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
                    section { page-break-inside: avoid; margin-bottom: 20px; }
                }
            `}</style>
        </div>
    );
}

export default function AtrasosAdmin() {
    return (
        <main className="min-h-screen bg-black text-white font-sans">
            <Suspense fallback={null}><ConteudoAtrasos /></Suspense>
        </main>
    );
}