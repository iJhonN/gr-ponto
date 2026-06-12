"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
}

interface RegistroPonto {
    id: number;
    funcionario_id: string;
    data_registro: string;
    hora_formatada: string;
    tipo_batida: string;
}

interface HoraExtraManual {
    id: number;
    funcionario_id: string;
    data_referencia: string;
    minutos_diurnos: number;
    minutos_noturnos: number;
    observacao: string;
}

interface DiaCompetencia {
    dia: number;
    mes: number;
    ano: number;
    label: string;
}

function ConteudoHorasExtras() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<RegistroPonto[]>([]);
    const [extrasManuais, setExtrasManuais] = useState<HoraExtraManual[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');

    const dataAtual = new Date();
    const mesInicial = dataAtual.getDate() > 15 ? dataAtual.getMonth() + 2 : dataAtual.getMonth() + 1;
    const [mesSelecionado, setMesSelecionado] = useState(mesInicial > 12 ? 1 : mesInicial);
    const [anoSelecionado, setAnoSelecionado] = useState(mesInicial > 12 ? dataAtual.getFullYear() + 1 : dataAtual.getFullYear());

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const carregarDados = async () => {
            setCarregando(true);
            try {
                // Busca funcionários, pontos do totem e os lançamentos manuais em paralelo
                const [resFunc, resPontos, resManuais] = await Promise.all([
                    supabase.from('funcionarios').select('id, nome, sobrenome, cargo').order('nome'),
                    supabase.from('pontos').select('id, funcionario_id, data_registro, hora_formatada, tipo_batida'),
                    supabase.from('horas_extras').select('id, funcionario_id, data_referencia, minutos_diurnos, minutos_noturnos, observacao')
                ]);

                if (resFunc.data) setFuncionarios(resFunc.data);
                if (resPontos.data) setPontos(resPontos.data as unknown as RegistroPonto[]);
                if (resManuais.data) setExtrasManuais(resManuais.data as unknown as HoraExtraManual[]);
            } catch (error) {
                console.error("Erro ao carregar dados de horas extras:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, []);

    const diasDoCiclo = useMemo((): DiaCompetencia[] => {
        const listaDias: DiaCompetencia[] = [];
        let mesAnterior = mesSelecionado - 1;
        let anoAnterior = anoSelecionado;
        if (mesAnterior === 0) { mesAnterior = 12; anoAnterior = anoSelecionado - 1; }

        const totalDiasMesAnterior = new Date(anoAnterior, mesAnterior, 0).getDate();

        for (let d = 16; d <= totalDiasMesAnterior; d++) {
            listaDias.push({ dia: d, mes: mesAnterior, ano: anoAnterior, label: `${String(d).padStart(2, '0')}/${String(mesAnterior).padStart(2, '0')}` });
        }
        for (let d = 1; d <= 15; d++) {
            listaDias.push({ dia: d, mes: mesSelecionado, ano: anoSelecionado, label: `${String(d).padStart(2, '0')}/${String(mesSelecionado).padStart(2, '0')}` });
        }
        return listaDias;
    }, [mesSelecionado, anoSelecionado]);

    // Agrupa pontos na memória por funcionário e por dia
    const mapaPontos = useMemo(() => {
        const mapa: { [chave: string]: RegistroPonto[] } = {};
        pontos.forEach(p => {
            if (!p.data_registro) return;
            const dLocal = new Date(new Date(p.data_registro).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${p.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;
            if (!mapa[chave]) mapa[chave] = [];
            mapa[chave].push(p);
        });
        Object.keys(mapa).forEach(chave => {
            mapa[chave].sort((a, b) => a.hora_formatada.localeCompare(b.hora_formatada));
        });
        return mapa;
    }, [pontos]);

    // Indexa as horas extras manuais na memória para busca instantânea O(1) por data_referencia
    const mapaManuais = useMemo(() => {
        const mapa: { [chave: string]: { diurnos: number; noturnos: number } } = {};
        extrasManuais.forEach(m => {
            if (!m.data_referencia) return;
            // A data_referencia já vem salva do banco como 'YYYY-MM-DD'
            const [ano, mes, dia] = m.data_referencia.split('-').map(Number);
            const chave = `${m.funcionario_id}-${ano}-${mes}-${dia}`;

            if (!mapa[chave]) mapa[chave] = { diurnos: 0, noturnos: 0 };
            mapa[chave].diurnos += Number(m.minutos_diurnos || 0);
            mapa[chave].noturnos += Number(m.minutos_noturnos || 0);
        });
        return mapa;
    }, [extrasManuais]);

    // MESTRE DO CÁLCULO UNIFICADO: Une cálculo automático e lançamentos manuais da gerência
    const calcularExtrasTotaisDoDia = (funcionarioId: string, itemDia: DiaCompetencia) => {
        const chave = `${funcionarioId}-${itemDia.ano}-${itemDia.mes}-${itemDia.dia}`;
        const pts = mapaPontos[chave] || [];
        const manualDoDia = mapaManuais[chave];

        let extraDiurnaCalculada = 0;
        let extraNoturnaCalculada = 0;

        // 1. SE HOUVER 4 BATIDAS, CALCULA O AUTOMÁTICO DO TOTEM
        if (pts.length >= 4) {
            const converteParaMinutos = (hhmm: string) => {
                const [h, m] = hhmm.split(':').map(Number);
                return h * 60 + m;
            };

            const entrada = converteParaMinutos(pts[0].hora_formatada);
            const saidaAlm = converteParaMinutos(pts[1].hora_formatada);
            const voltaAlm = converteParaMinutos(pts[2].hora_formatada);
            const saidaFim = converteParaMinutos(pts[3].hora_formatada);

            const minutosTrabalhadosManha = saidaAlm - entrada;
            const minutosTrabalhadosTarde = saidaFim - voltaAlm;
            const totalTrabalhadoNoDia = minutosTrabalhadosManha + minutosTrabalhadosTarde;

            const jornadaPadraoMinutos = 8 * 60;

            if (totalTrabalhadoNoDia > jornadaPadraoMinutos) {
                let minutosExtrasRestantes = totalTrabalhadoNoDia - jornadaPadraoMinutos;
                const limiteNoite = 18 * 60; // 18:00h

                if (saidaFim > limiteNoite) {
                    const excedenteNoite = saidaFim - limiteNoite;
                    extraNoturnaCalculada = Math.min(excedenteNoite, minutosExtrasRestantes);
                    minutosExtrasRestantes -= extraNoturnaCalculada;
                }
                extraDiurnaCalculada = minutosExtrasRestantes;
            }
        }

        // 2. SOMA COM OS LANÇAMENTOS MANUAIS (Se existirem para esse dia)
        const diurnaFinal = extraDiurnaCalculada + (manualDoDia ? manualDoDia.diurnos : 0);
        const noturnaFinal = extraNoturnaCalculada + (manualDoDia ? manualDoDia.noturnos : 0);

        return { diurna: diurnaFinal, noturna: noturnaFinal };
    };

    // Consolida e soma todas as horas extras do mês por funcionário para exibição rápida
    const resumoFuncionariosComExtras = useMemo(() => {
        return funcionarios.filter(func => {
            const termo = pesquisa.toLowerCase().trim();
            if (!termo) return true;
            const nomeCompleto = `${func.nome} ${func.sobrenome}`.toLowerCase();
            return nomeCompleto.includes(termo) || String(func.id).includes(termo);
        }).map(func => {
            let totalDiurna = 0;
            let totalNoturna = 0;

            diasDoCiclo.forEach(itemDia => {
                const extras = calcularExtrasTotaisDoDia(func.id, itemDia);
                totalDiurna += extras.diurna;
                totalNoturna += extras.noturna;
            });

            const formatarMinutos = (min: number) => {
                if (min === 0) return '---';
                const hrs = Math.floor(min / 60);
                const mnts = min % 60;
                return `${hrs}h ${mnts.toString().padStart(2, '0')}m`;
            };

            return {
                ...func,
                diurnaFormatada: formatarMinutos(totalDiurna),
                noturnaFormatada: formatarMinutos(totalNoturna),
                temExtras: totalDiurna > 0 || totalNoturna > 0
            };
        });
    }, [funcionarios, diasDoCiclo, mapaPontos, mapaManuais, pesquisa]);

    return (
        <main className="min-h-screen bg-black text-white p-4 font-sans print:bg-white print:text-black">

            {/* PAINEL ADMINISTRATIVO */}
            <header className="max-w-6xl mx-auto mb-6 bg-slate-900/40 p-5 rounded-[25px] border border-white/5 print:hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                        <h1 className="text-2xl font-black uppercase italic text-white leading-none">Banco de <span className="text-orange-500">Horas Extras</span></h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por colaborador..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/10 px-4 py-2 rounded-xl font-bold text-white text-sm outline-none focus:border-orange-500 w-full sm:w-64"
                        />
                        <select
                            value={mesSelecionado}
                            onChange={(e) => setMesSelecionado(Number(e.target.value))}
                            className="bg-black border border-white/10 px-3 py-2 rounded-xl font-bold text-white text-sm outline-none cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>Ciclo até 15/{String(m).padStart(2, '0')}</option>
                            ))}
                        </select>
                        <button onClick={() => window.print()} className="bg-orange-600 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all">
                            🖨️ Imprimir Balanço
                        </button>
                    </div>
                </div>
            </header>

            {/* LISTAGEM DE ACUMULADOS MENSAL */}
            <section className="max-w-5xl mx-auto flex flex-col gap-6">
                {carregando ? (
                    <div className="text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px]">Calculando Banco de Horas...</div>
                ) : resumoFuncionariosComExtras.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-[30px] text-slate-500 font-bold text-sm">
                        Nenhum funcionário localizado.
                    </div>
                ) : (
                    resumoFuncionariosComExtras.map((func) => (
                        <div key={func.id} className="bg-white text-black p-6 rounded-[30px] border border-slate-200 print:break-inside-avoid print:page-break-after-always">

                            {/* CABEÇALHO INDIVIDUAL */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
                                <div>
                                    <h3 className="text-base font-black uppercase italic leading-tight text-black">{func.nome} {func.sobrenome}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase font-mono">{func.cargo} • ID: {func.id}</p>
                                </div>
                                <div className="text-right text-xs">
                                    <p className="font-black text-slate-800 uppercase tracking-wide">Competência</p>
                                    <p className="font-mono font-bold text-orange-600">16/{String(mesSelecionado === 1 ? 12 : mesSelecionado - 1).padStart(2, '0')} a 15/{String(mesSelecionado).padStart(2, '0')}/{anoSelecionado}</p>
                                </div>
                            </div>

                            {/* QUADRO DE RESUMO ACUMULADO */}
                            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl print:bg-slate-100">
                                <div className="text-center border-r border-slate-200">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Total Extra Diurna</p>
                                    <p className="text-base font-mono font-black text-black mt-0.5">{func.diurnaFormatada}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-orange-600">Total Extra Noturna (pós-18:00)</p>
                                    <p className="text-base font-mono font-black text-orange-600 mt-0.5">{func.noturnaFormatada}</p>
                                </div>
                            </div>

                            {/* DETALHAMENTO DIA A DIA */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                    <tr className="border-b border-slate-300 text-slate-800 uppercase font-black text-[9px] tracking-wider bg-slate-100">
                                        <th className="py-1 px-2 w-16">Data</th>
                                        <th className="py-1 px-2 text-center w-16">Entrada</th>
                                        <th className="py-1 px-2 text-center w-16">Saída Alm</th>
                                        <th className="py-1 px-2 text-center w-16">Volta Alm</th>
                                        <th className="py-1 px-2 text-center w-16">Saída Fim</th>
                                        <th className="py-1 px-2 text-center w-24">Extra Diurna</th>
                                        <th className="py-1 px-2 text-center w-24 text-orange-600">Extra Noturna</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {diasDoCiclo.map((itemDia, idx) => {
                                        const extras = calcularExtrasTotaisDoDia(func.id, itemDia);
                                        const chave = `${func.id}-${itemDia.ano}-${itemDia.mes}-${itemDia.dia}`;
                                        const pts = mapaPontos[chave] || [];

                                        // Se não houver extras automáticas nem manuais, oculta o dia para enxugar o relatório
                                        if (extras.diurna === 0 && extras.noturna === 0) return null;

                                        return (
                                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-1 px-2 font-mono font-black text-black">{itemDia.label}</td>
                                                <td className="py-1 px-2 font-mono text-center text-slate-600">{pts[0]?.hora_formatada || '---'}</td>
                                                <td className="py-1 px-2 font-mono text-center text-slate-600">{pts[1]?.hora_formatada || '---'}</td>
                                                <td className="py-1 px-2 font-mono text-center text-slate-600">{pts[2]?.hora_formatada || '---'}</td>
                                                <td className="py-1 px-2 font-mono text-center text-slate-600">{pts[3]?.hora_formatada || '---'}</td>
                                                <td className="py-1 px-2 font-mono text-center font-bold text-emerald-600">
                                                    {extras.diurna > 0 ? `+${extras.diurna} min` : '---'}
                                                </td>
                                                <td className="py-1 px-2 font-mono text-center font-black text-orange-600">
                                                    {extras.noturna > 0 ? `+${extras.noturna} min` : '---'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Caso o funcionário não tenha feito nenhuma extra no mês */}
                                    {!func.temExtras && (
                                        <tr>
                                            <td colSpan={7} className="py-4 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                Nenhuma hora extra gerada neste ciclo.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    ))
                )}
            </section>
        </main>
    );
}

export default function HorasExtrasPage() {
    return (
        <Suspense fallback={null}>
            <ConteudoHorasExtras />
        </Suspense>
    );
}