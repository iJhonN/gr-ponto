"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Motorista {
    id: string;
    nome_completo: string;
    cpf: string;
    categoria_cnh: string;
    vencimento_cnh: string;
    data_nascimento: string | null;
    contato: string;
    cidade: string; // Adicionado à interface de dados
    data_cadastro: string;
}

export default function ListaMotoristasPage() {
    const [motoristas, setMotoristas] = useState<Motorista[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroCidade, setFiltroCidade] = useState('TODAS'); // Estado do novo filtro por cidade

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Lista estática para alimentar o componente de filtro do cabeçalho
    const cidadesOperacao = [
        "PILAR", "ARAPIRACA", "MACEIÓ", "TAQUARANA", "FEIRA GRANDE",
        "LIMOEIRO", "BANANEIRA", "JUNQUEIRO", "COITÉ", "SÃO MIGUEL",
        "LAGOA DA CANOA"
    ];

    async function carregarMotoristas() {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from('motoristas')
                .select('*')
                .order('nome_completo', { ascending: true });

            if (error) throw error;
            if (data) setMotoristas(data as Motorista[]);
        } catch (err) {
            console.error("Erro ao consultar motoristas:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarMotoristas();
    }, []);

    // Filtros combinados (Busca textual + Filtro select por Cidade) executados no Mac Air
    const motoristasFiltrados = useMemo(() => {
        const termo = pesquisa.toLowerCase().trim();
        return motoristas.filter(m => {
            const bateTexto =
                m.nome_completo.toLowerCase().includes(termo) ||
                m.cpf.includes(termo) ||
                m.cidade.toLowerCase().includes(termo);

            const bateCidade = filtroCidade === 'TODAS' || m.cidade === filtroCidade;

            return bateTexto && bateCidade;
        });
    }, [motoristas, pesquisa, filtroCidade]);

    // Relatório analítico dinâmico baseado na CNH
    const analiseCnh = useMemo(() => {
        const hoje = new Date();
        const total = motoristas.length;
        const vencidas = motoristas.filter(m => {
            const dataVencimento = new Date(m.vencimento_cnh);
            return dataVencimento < hoje;
        }).length;

        return { total, vencidas, regulares: total - vencidas };
    }, [motoristas]);

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.01]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '45px 45px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8 max-w-[1400px] mx-auto">

                {/* CABEÇALHO COM INTEGRAÇÃO DE FILTROS */}
                <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/[0.05] pb-6 px-2">
                    <div>
                        <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] mb-1.5 block hover:opacity-80 transition-all">
                            ← Menu de Frotas
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                            Cadastro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Motoristas Parceiros</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold">
                            Controle de habilitações, contatos e distribuição regional da oficina
                        </p>
                    </div>

                    {/* BARRA DE CONTROLE CONTENDO BUSCA E SELECT DE CIDADES */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou cidade..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-blue-500/40 px-4 py-2.5 rounded-xl text-white text-xs font-bold outline-none w-full sm:w-64 uppercase transition-all placeholder-slate-700"
                        />

                        <select
                            value={filtroCidade}
                            onChange={(e) => setFiltroCidade(e.target.value)}
                            className="bg-black border border-white/[0.06] focus:border-blue-500/40 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-bold uppercase cursor-pointer outline-none transition-all"
                        >
                            <option value="TODAS">📍 Todas as Cidades</option>
                            {cidadesOperacao.map((cid, cIdx) => (
                                <option key={cIdx} value={cid} className="bg-[#1a1f29]">{cid}</option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* PLACAR DE AUDITORIA DE CNH */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Motoristas Ativos</p>
                        <p className="text-2xl font-mono font-black mt-1 text-slate-300">{analiseCnh.total}</p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Habilitações Regulares</p>
                        <p className="text-2xl font-mono font-black mt-1 text-emerald-400">{analiseCnh.regulares}</p>
                    </div>
                    <div className="bg-[#1a1f29]/60 border border-white/[0.04] p-5 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-red-500">CNH Vencida / Alerta</p>
                        <p className="text-2xl font-mono font-black mt-1 text-red-400">{analiseCnh.vencidas}</p>
                    </div>
                </div>

                {/* LISTAGEM PRINCIPAL */}
                <div className="relative bg-[#1a1f29]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl mx-2 min-h-[400px]">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                    {carregando ? (
                        <div className="text-center py-32 text-[10px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                            Buscando registros de condutores...
                        </div>
                    ) : motoristasFiltrados.length === 0 ? (
                        <div className="py-32 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum motorista localizado com os filtros aplicados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                    <th className="pb-3 pl-4">Condutor / Base</th>
                                    <th className="pb-3">Inscrição CPF</th>
                                    <th className="pb-3 text-center">Categoria</th>
                                    <th className="pb-3 text-center">Vencimento CNH</th>
                                    <th className="pb-3 text-right pr-4">Linha de Contato</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.01]">
                                {motoristasFiltrados.map(m => {
                                    const cnhVencida = new Date(m.vencimento_cnh) < new Date();
                                    return (
                                        <tr key={m.id} className="hover:bg-white/[0.01] transition-colors group">
                                            {/* COLUNA CONDUTOR + TAG DE CIDADE */}
                                            <td className="py-4 pl-4">
                                                <p className="font-black text-slate-200 uppercase tracking-tight text-xs">
                                                    {m.nome_completo}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="bg-slate-800 text-slate-400 border border-white/[0.04] rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide">
                                                        📍 {m.cidade || 'Não Informada'}
                                                    </span>
                                                    {m.data_nascimento && (
                                                        <span className="text-[8px] font-mono text-slate-500">
                                                            Nasc: {new Date(m.data_nascimento).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 font-mono text-slate-400 text-xs">
                                                {m.cpf}
                                            </td>
                                            <td className="py-4 text-center">
                                                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono font-black px-2 py-0.5 text-[10px] uppercase tracking-wider">
                                                        {m.categoria_cnh}
                                                    </span>
                                            </td>
                                            <td className="py-4 text-center font-mono text-xs">
                                                <p className={cnhVencida ? "text-red-400 font-bold" : "text-slate-300"}>
                                                    {new Date(m.vencimento_cnh).toLocaleDateString('pt-BR')}
                                                </p>
                                                {cnhVencida && (
                                                    <span className="text-[7px] text-red-500 uppercase font-black tracking-widest block">Regularizar</span>
                                                )}
                                            </td>
                                            <td className="py-4 text-right pr-4 font-mono text-xs font-bold text-slate-300">
                                                {m.contato}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* RODAPÉ */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.2</div>
            </footer>
        </main>
    );
}