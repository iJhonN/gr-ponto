"use client";
import { useState, useEffect, Suspense, useMemo } from 'react';
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
    observacao: string;
}

interface RegistroPausa {
    id: number;
    funcionario_id: string;
    data: string;
    minutos_ajuste: number;
    tipo: string;
    observacao: string;
}

interface SaidaEmergency {
    id: string;
    funcionario_id: string;
    horario_saida: string;
    horario_retorno: string | null;
    justificativa: string;
}

interface HoraExtraManual {
    id: number;
    funcionario_id: string;
    data_referencia: string;
    minutos_diurnos: number;
    minutos_noturnos: number;
}

interface DiaCompetencia {
    dia: number;
    mes: number;
    ano: number;
    label: string;
}

function ConteudoRelatorio() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<RegistroPonto[]>([]);
    const [pausas, setPausas] = useState<RegistroPausa[]>([]);
    const [saidasEmergencia, setSaidasEmergencia] = useState<SaidaEmergency[]>([]);
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
        const carregarDadosSupabase = async () => {
            setCarregando(true);
            try {
                const [resFunc, resPontos, resPausas, resSaidas, resExtras] = await Promise.all([
                    supabase.from('funcionarios').select('id, nome, sobrenome, cargo').order('nome'),
                    supabase.from('pontos').select('id, funcionario_id, data_registro, hora_formatada, tipo_batida, observacao'),
                    supabase.from('pausas').select('id, funcionario_id, data, minutos_ajuste, tipo, observacao'),
                    supabase.from('saidas_emergencia').select('id, funcionario_id, horario_saida, horario_retorno, justificativa'),
                    supabase.from('horas_extras').select('id, funcionario_id, data_referencia, minutos_diurnos, minutos_noturnos')
                ]);

                if (resFunc.data) setFuncionarios(resFunc.data);
                if (resPontos.data) setPontos(resPontos.data as unknown as RegistroPonto[]);
                if (resPausas.data) setPausas(resPausas.data as unknown as RegistroPausa[]);
                if (resSaidas.data) setSaidasEmergencia(resSaidas.data as unknown as SaidaEmergency[]);
                if (resExtras.data) setExtrasManuais(resExtras.data as unknown as HoraExtraManual[]);
            } catch (error) {
                console.error("Erro ao carregar dados do Supabase:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDadosSupabase();
    }, []);

    const diasDoCiclo = useMemo((): DiaCompetencia[] => {
        const listaDias: DiaCompetencia[] = [];
        let mesAnterior = mesSelecionado - 1;
        let anoAnterior = anoSelecionado;
        if (mesAnterior === 0) {
            mesAnterior = 12;
            anoAnterior = anoSelecionado - 1;
        }

        const totalDiasMesAnterior = new Date(anoAnterior, mesAnterior, 0).getDate();

        for (let d = 16; d <= totalDiasMesAnterior; d++) {
            listaDias.push({ dia: d, mes: mesAnterior, ano: anoAnterior, label: `${String(d).padStart(2, '0')}/${String(mesAnterior).padStart(2, '0')}` });
        }
        for (let d = 1; d <= 15; d++) {
            listaDias.push({ dia: d, mes: mesSelecionado, ano: anoSelecionado, label: `${String(d).padStart(2, '0')}/${String(mesSelecionado).padStart(2, '0')}` });
        }
        return listaDias;
    }, [mesSelecionado, anoSelecionado]);

    const mapaDadosAgrupados = useMemo(() => {
        const mapa: {
            [chave: string]: {
                pontos: RegistroPonto[];
                minutosPausa: number;
                emergenciaSaida: string;
                emergenciaRetorno: string;
                emergenciaDuracao: string;
                emergenciaMinutosTotais: number;
                justificativa: string;
                extraManualDiurna: number;
                extraManualNoturna: number;
                temAtraso: boolean;
            }
        } = {};

        pontos.forEach(p => {
            if (!p.data_registro) return;
            const dLocal = new Date(new Date(p.data_registro).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${p.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false };
            mapa[chave].pontos.push(p);

            if (p.observacao === 'Atraso') {
                mapa[chave].temAtraso = true;
            }
        });

        pausas.forEach(p => {
            if (!p.data) return;
            const dLocal = new Date(new Date(p.data).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${p.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false };
            if (p.tipo === 'pausa') {
                mapa[chave].minutosPausa += Number(p.minutos_ajuste || 0);
            }
        });

        saidasEmergencia.forEach(s => {
            if (!s.horario_saida) return;
            const dLocal = new Date(new Date(s.horario_saida).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${s.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false };

            const formataHora = (isoString: string | null) => {
                if (!isoString) return 'Ab.';
                return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
            };

            const obtenerMinutosPuros = (saidaStr: string, retornoStr: string | null) => {
                if (!retornoStr) return 0;
                return Math.floor((new Date(retornoStr).getTime() - new Date(saidaStr).getTime()) / 60000);
            };

            const minutosPuros = obtenerMinutosPuros(s.horario_saida, s.horario_retorno);
            const hSaida = formataHora(s.horario_saida);
            const hRetorno = formataHora(s.horario_retorno);
            const hDuracao = minutosPuros > 0 ? `${minutosPuros}m` : 'Ab.';

            mapa[chave].emergenciaMinutosTotais += minutosPuros;
            mapa[chave].emergenciaSaida = mapa[chave].emergenciaSaida === '---' ? hSaida : `${mapa[chave].emergenciaSaida}|${hSaida}`;
            mapa[chave].emergenciaRetorno = mapa[chave].emergenciaRetorno === '---' ? hRetorno : `${mapa[chave].emergenciaRetorno}|${hRetorno}`;
            mapa[chave].emergenciaDuracao = mapa[chave].emergenciaDuracao === '---' ? hDuracao : `${mapa[chave].emergenciaDuracao}|${hDuracao}`;
            mapa[chave].justificativa = mapa[chave].justificativa === '' ? s.justificativa : `${mapa[chave].justificativa}; ${s.justificativa}`;
        });

        extrasManuais.forEach(m => {
            if (!m.data_referencia) return;
            const [ano, mes, dia] = m.data_referencia.split('-').map(Number);
            const chave = `${m.funcionario_id}-${ano}-${mes}-${dia}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false };
            mapa[chave].extraManualDiurna += Number(m.minutos_diurnos || 0);
            mapa[chave].extraManualNoturna += Number(m.minutos_noturnos || 0);
        });

        Object.keys(mapa).forEach(chave => {
            mapa[chave].pontos.sort((a, b) => a.hora_formatada.localeCompare(b.hora_formatada));
        });

        return mapa;
    }, [pontos, pausas, saidasEmergencia, extrasManuais]);

    const obterDadosComExtrasDoDia = (funcionarioId: string, itemDia: DiaCompetencia) => {
        const chave = `${funcionarioId}-${itemDia.ano}-${itemDia.mes}-${itemDia.dia}`;
        const dadosDoDia = mapaDadosAgrupados[chave];

        const retornoBase = {
            entrada: '---', saidaAlmoço: '---', voltaAlmoço: '---', saidaFinal: '---',
            totalPausa: '---', emSaida: '---', emRetorno: '---', emDuracao: '---',
            justificativa: '', extraDiurnaMinutos: 0, extraNoturnaMinutos: 0, minutosEmergenciaAcumuladoDia: 0, minutosPausaPurosDia: 0, temAtraso: false
        };

        if (!dadosDoDia) return retornoBase;

        const pts = dadosDoDia.pontos;
        let extraDiurnaCalculada = 0;
        let extraNoturnaCalculada = 0;

        if (pts.length >= 4) {
            const converteParaMinutos = (hhmm: string) => {
                const [h, m] = hhmm.split(':').map(Number);
                return h * 60 + m;
            };

            const entrada = converteParaMinutos(pts[0].hora_formatada);
            const saidaAlm = converteParaMinutos(pts[1].hora_formatada);
            const voltaAlm = converteParaMinutos(pts[2].hora_formatada);
            const saidaFim = converteParaMinutos(pts[3].hora_formatada);

            const totalTrabalhado = (saidaAlm - entrada) + (saidaFim - voltaAlm);
            const jornadaPadrao = 8 * 60;

            if (totalTrabalhado > jornadaPadrao) {
                let extrasRestantes = totalTrabalhado - jornadaPadrao;
                const limiteNoite = 18 * 60;

                if (saidaFim > limiteNoite) {
                    const excedenteNoite = saidaFim - limiteNoite;
                    extraNoturnaCalculada = Math.min(excedenteNoite, extrasRestantes);
                    extrasRestantes -= extraNoturnaCalculada;
                }
                extraDiurnaCalculada = extrasRestantes;
            }
        }

        return {
            entrada: pts[0] ? pts[0].hora_formatada : '---',
            saidaAlmoço: pts[1] ? pts[1].hora_formatada : '---',
            voltaAlmoço: pts[2] ? pts[2].hora_formatada : '---',
            saidaFinal: pts[3] ? pts[3].hora_formatada : '---',
            totalPausa: dadosDoDia.minutosPausa > 0 ? `${dadosDoDia.minutosPausa} min` : '---',
            emSaida: dadosDoDia.emergenciaSaida,
            emRetorno: dadosDoDia.emergenciaRetorno,
            emDuracao: dadosDoDia.emergenciaDuracao,
            justificativa: dadosDoDia.justificativa,
            extraDiurnaMinutos: extraDiurnaCalculada + dadosDoDia.extraManualDiurna,
            extraNoturnaMinutos: extraNoturnaCalculada + dadosDoDia.extraManualNoturna,
            minutosEmergenciaAcumuladoDia: dadosDoDia.emergenciaMinutosTotais,
            minutosPausaPurosDia: dadosDoDia.minutosPausa,
            temAtraso: dadosDoDia.temAtraso
        };
    };

    const formatarMinutosTotais = (minutos: number) => {
        if (minutos === 0) return "00h 00m";
        const hrs = Math.floor(minutos / 60);
        const mnts = minutos % 60;
        return `${hrs}h ${mnts.toString().padStart(2, '0')}m`;
    };

    const funcionariosFiltrados = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        if (!termo) return funcionarios;
        return funcionarios.filter(func => {
            const nomeCompleto = `${func.nome} ${func.sobrenome}`.toLowerCase();
            return nomeCompleto.includes(termo) || String(func.id).includes(termo);
        });
    }, [funcionarios, pesquisa]);

    return (
        <main className="min-h-screen bg-black text-white p-4 font-sans print:bg-white print:text-black print:p-0 w-full">
            <header className="max-w-[1400px] mx-auto mb-6 bg-slate-900/40 p-5 rounded-[25px] border border-white/5 print:hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-1 block hover:opacity-70 transition-all">← Dashboard</Link>
                        <h1 className="text-2xl font-black uppercase italic text-white leading-none">Fechamento <span className="text-orange-500">Mensal</span></h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou ID..."
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
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </header>

            <section className="max-w-[1400px] print:max-w-[820px] mx-auto flex flex-col gap-8 print:gap-0 w-full">
                {carregando ? (
                    <div className="text-center py-20 animate-pulse font-black uppercase text-slate-800 tracking-[5px] print:hidden">Sincronizando Banco de Dados Supabase...</div>
                ) : (
                    funcionariosFiltrados.map((func) => {
                        let acumuladoDiurna = 0;
                        let acumuladoNoturna = 0;
                        let acumuladoEmergencia = 0;
                        let acumuladoPausas = 0;

                        return (
                            <div key={func.id} className="bg-white text-black p-4 sm:p-6 print:p-4 mb-6 border border-slate-200 rounded-[24px] print:border-slate-300 print:break-inside-avoid print:page-break-after-always shadow-md w-full">

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-3 mb-4 text-xs w-full">
                                    <div className="space-y-1">
                                        <h2 className="text-base print:text-sm font-black uppercase tracking-tight text-black leading-none">GR AUTOPECAS LTDA</h2>
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-700 font-mono">CNPJ: 51.415.349/0001-25</p>
                                        <p className="text-[9px] print:text-[8px] text-slate-500 leading-tight">Rua Coronel Vicente Ramos, Nº1552 — Arapiraca - AL</p>
                                    </div>
                                    <div className="text-left sm:text-right space-y-1">
                                        <p className="text-[9px] print:text-[8px] font-black uppercase text-slate-400 tracking-wider leading-none">Colaborador</p>
                                        <h3 className="text-base print:text-sm font-black uppercase italic text-black leading-none">{func.nome} {func.sobrenome}</h3>
                                        <p className="text-[10px] print:text-[9px] font-bold text-orange-600 uppercase tracking-wide leading-none">{func.cargo} • ID: {func.id}</p>
                                        <p className="text-xs print:text-[10px] font-black uppercase tracking-wider text-slate-800">
                                            Período: 16/{String(mesSelecionado === 1 ? 12 : mesSelecionado - 1).padStart(2, '0')} a 15/{String(mesSelecionado).padStart(2, '0')}/{anoSelecionado}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-left text-xs print:text-[9px] border-collapse table-auto print:table-fixed min-w-[900px] print:min-w-0">
                                        <thead>
                                        <tr className="border-b border-slate-300 text-slate-800 uppercase font-black text-[10px] print:text-[7.5px] tracking-wider bg-slate-100">
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 w-[50px] print:w-[32px] min-w-[50px] print:min-w-0">Data</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[60px] print:w-[38px] min-w-[60px] print:min-w-0">Entrada</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[60px] print:w-[38px] min-w-[60px] print:min-w-0">Sai Alm</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[60px] print:w-[38px] min-w-[60px] print:min-w-0">Vol Alm</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[60px] print:w-[38px] min-w-[60px] print:min-w-0">Sai Fim</th>

                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[65px] print:w-[42px] min-w-[65px] print:min-w-0 text-red-600 bg-red-500/5 font-black border-l border-slate-200">S. Emerg</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[65px] print:w-[42px] min-w-[65px] print:min-w-0 text-red-600 bg-red-500/5 font-black">V. Emerg</th>
                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[60px] print:w-[38px] min-w-[60px] print:min-w-0 text-red-700 bg-red-500/10 font-black border-r border-slate-200">Tempo</th>

                                            <th className="py-2 px-3 print:py-1 print:px-1.5 text-left w-[220px] print:w-[120px] min-w-[200px] print:min-w-0 text-red-700 bg-red-500/5 font-black">Motivo Emergência</th>

                                            <th className="py-2 px-2 print:py-1 print:px-0.5 text-center w-[70px] print:w-[42px] min-w-[70px] print:min-w-0 text-orange-600 border-l border-slate-200">Tot Pausa</th>
                                            <th className="py-2 px-2 print:py-1 print:px-1 text-right min-w-[150px] print:min-w-0 border-l border-dashed border-slate-300">Assinatura / Ajustes</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {diasDoCiclo.map((itemDia, idx) => {
                                            const jornada = obterDadosComExtrasDoDia(func.id, itemDia);

                                            acumuladoDiurna += jornada.extraDiurnaMinutos;
                                            acumuladoNoturna += jornada.extraNoturnaMinutos;
                                            acumuladoEmergencia += jornada.minutosEmergenciaAcumuladoDia;
                                            acumuladoPausas += jornada.minutosPausaPurosDia;

                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`border-b border-slate-100 transition-colors text-xs print:text-[9px] ${
                                                        jornada.temAtraso
                                                            ? 'bg-red-50/70 border-l-4 border-l-red-500 font-medium hover:bg-red-100/60 print:bg-slate-100 print:border-l-0'
                                                            : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <td className={`py-2 px-2 print:py-0.5 print:px-0.5 font-mono font-black ${jornada.temAtraso ? 'text-red-700 print:text-black print:font-black' : 'text-black'}`}>
                                                        {itemDia.label}
                                                    </td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center text-slate-700">{jornada.entrada}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center text-slate-600">{jornada.saidaAlmoço}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center text-slate-600">{jornada.voltaAlmoço}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center text-slate-700">{jornada.saidaFinal}</td>

                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center font-black text-red-600 bg-red-500/[0.03] border-l border-slate-100">{jornada.emSaida}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center font-black text-red-600 bg-red-500/[0.03]">{jornada.emRetorno}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center font-black text-red-700 bg-red-500/[0.07] border-r border-slate-100">{jornada.emDuracao}</td>

                                                    <td className="py-2 px-3 print:py-0.5 print:px-1.5 text-left text-xs print:text-[7px] font-black text-red-700 bg-red-500/[0.03] italic whitespace-normal break-words print:truncate" title={jornada.justificativa}>
                                                        {jornada.justificativa || '---'}
                                                    </td>

                                                    <td className="py-2 px-2 print:py-0.5 print:px-0.5 font-mono text-center font-black text-orange-600 bg-orange-500/[0.02] border-l border-slate-100">{jornada.totalPausa}</td>
                                                    <td className="py-2 px-2 print:py-0.5 print:px-1 border-l border-dashed border-slate-200"></td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2 bg-slate-50 p-4 print:p-2.5 rounded-xl border border-slate-200/80">

                                    <div className="text-center border-b lg:border-b-0 lg:border-r border-slate-200/80 pb-2 lg:pb-0 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs print:text-[9px]">☀️</span>
                                            <p className="text-[10px] print:text-[7.5px] font-black text-slate-500 uppercase tracking-wider leading-none">Total Extra Diurna</p>
                                        </div>
                                        <p className="text-sm print:text-[11px] font-mono font-black text-emerald-600 mt-1.5 print:mt-1">
                                            {formatarMinutosTotais(acumuladoDiurna)}
                                        </p>
                                    </div>

                                    <div className="text-center border-b lg:border-b-0 lg:border-r border-slate-200/80 pb-2 lg:pb-0 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs print:text-[9px]">🌙</span>
                                            <p className="text-[10px] print:text-[7.5px] font-black text-blue-800 print:text-blue-900 uppercase tracking-wider leading-none">Total Extra Noturna</p>
                                        </div>
                                        <p className="text-sm print:text-[11px] font-mono font-black text-blue-700 print:text-blue-900 mt-1.5 print:mt-1">
                                            {formatarMinutosTotais(acumuladoNoturna)}
                                        </p>
                                    </div>

                                    <div className="text-center border-b lg:border-b-0 lg:border-r border-slate-200/80 pb-2 lg:pb-0 pt-2 lg:pt-0 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs print:text-[9px]">☕</span>
                                            <p className="text-[10px] print:text-[7.5px] font-black text-orange-600 uppercase tracking-wider leading-none">Total de Pausas</p>
                                        </div>
                                        <p className="text-sm print:text-[11px] font-mono font-black text-orange-400 mt-1.5 print:mt-1">
                                            {formatarMinutosTotais(acumuladoPausas)}
                                        </p>
                                    </div>

                                    <div className="text-center pt-2 lg:pt-0 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs print:text-[9px]">🚨</span>
                                            <p className="text-[10px] print:text-[7.5px] font-black text-red-600 uppercase tracking-wider leading-none">Total Tempo Fora</p>
                                        </div>
                                        <p className="text-sm print:text-[11px] font-mono font-black text-red-600 mt-1.5 print:mt-1">
                                            {formatarMinutosTotais(acumuladoEmergencia)}
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-8 px-1">
                                    <p className="text-[11px] print:text-[7.5px] text-slate-900 print:text-slate-600 font-bold leading-relaxed tracking-wide text-justify whitespace-normal break-words max-w-3xl">
                                        Declaro, para os devidos fins de fechamento e apuração contábil, estar plenamente ciente das marcações de ponto, intervalos mecânicos e registros de saídas extras descritos nesta folha. Confirmo que todas as ausências, faltas e/ou atrasos ocorridos ao longo deste ciclo de competência foram devidamente justificados perante a gerência, expressando minha total concordância com os saldos apurados e registros armazenados.
                                    </p>
                                </div>

                                <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-12 pt-4 border-t border-slate-300">
                                    <div className="w-full sm:w-64 print:w-52 text-center">
                                        <div className="border-b border-black w-full h-5 mb-2"></div>
                                        <p className="text-[10px] print:text-[7.5px] font-black uppercase tracking-wider text-black">Responsável GR Autopeças</p>
                                    </div>
                                    <div className="w-full sm:w-64 print:w-52 text-center">
                                        <div className="border-b border-black w-full h-5 mb-2"></div>
                                        <p className="text-[10px] print:text-[7.5px] font-black uppercase tracking-wider text-black">Assinatura do Colaborador</p>
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </section>

            <style jsx global>{`
                @media print {
                    html, body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { background: white !important; padding: 0 !important; }
                    header { display: none !important; }
                    @page { size: A4 portrait; margin: 8mm 6mm 8mm 6mm; }

                    th, td, div {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </main>
    );
}

export default function RelatorioPage() { return <Suspense fallback={null}><ConteudoRelatorio /></Suspense>; }