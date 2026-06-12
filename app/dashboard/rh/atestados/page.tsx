"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Funcionario {
    id: string; // Mantido como string/varchar para casar com seu banco
    nome: string;
    sobrenome: string;
    cargo: string;
}

interface Atestado {
    id: string;
    funcionario_id: string;
    data_emissao: string;
    data_inicio: string;
    data_fim: string;
    quantidade_dias: number;
    cid: string | null;
    justificativa: string;
    url_documento: string | null;
    funcionarios: {
        nome: string;
        sobrenome: string;
        cargo: string;
    } | null;
}

export default function ControleAtestadosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [atestados, setAtestados] = useState<Atestado[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    // Estados do Formulário
    const [funcionarioId, setFuncionarioId] = useState('');
    const [dataEmissao, setDataEmissao] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [cid, setCid] = useState('');
    const [justificativa, setJustificativa] = useState('');
    const [arquivo, setArquivo] = useState<File | null>(null);

    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function carregarDados() {
        setCarregando(true);
        try {
            const [resFunc, resAtestados] = await Promise.all([
                supabase.from('funcionarios').select('id, nome, sobrenome, cargo').order('nome'),
                supabase.from('atestados_medicos').select('*, funcionarios(nome, sobrenome, cargo)').order('criado_em', { ascending: false })
            ]);

            if (resFunc.data) setFuncionarios(resFunc.data);
            if (resAtestados.data) setAtestados(resAtestados.data as unknown as Atestado[]);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    const handleCadastrarAtestado = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!funcionarioId || !dataEmissao || !dataInicio || !dataFim || !justificativa.trim()) {
            setStatusFeed({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            const inicio = new Date(dataInicio);
            const fim = new Date(dataFim);
            const diferencaTempo = fim.getTime() - inicio.getTime();
            const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24)) + 1;

            if (diferencaDias <= 0) {
                throw new Error("A data de término não pode ser anterior à data de início.");
            }

            let urlDocumento = null;

            if (arquivo) {
                const extensao = arquivo.name.split('.').pop();
                const nomeArquivo = `${funcionarioId}-${Date.now()}.${extensao}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('atestados')
                    .upload(nomeArquivo, arquivo);

                if (uploadError) throw uploadError;
                if (uploadData) urlDocumento = uploadData.path;
            }

            const { error: insertError } = await supabase
                .from('atestados_medicos')
                .insert([{
                    funcionario_id: funcionarioId,
                    data_emissao: dataEmissao,
                    data_inicio: dataInicio,
                    data_fim: dataFim,
                    quantidade_dias: diferencaDias,
                    cid: cid.trim().toUpperCase() || null,
                    justificativa: justificativa.trim(),
                    url_documento: urlDocumento
                }]);

            if (insertError) throw insertError;

            setStatusFeed({ tipo: 'sucesso', texto: 'Atestado médico registrado e anexado com sucesso!' });

            // Reset do formulário
            setFuncionarioId('');
            setDataEmissao('');
            setDataInicio('');
            setDataFim('');
            setCid('');
            setJustificativa('');
            setArquivo(null);

            carregarDados();

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Falha ao processar operação.' });
        } finally {
            setEnviando(false);
        }
    };

    const visualizarDocumento = async (path: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('atestados')
                .createSignedUrl(path, 60);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (err) {
            console.error("Erro ao gerar link de visualização:", err);
            alert("Não foi possível acessar o arquivo de forma segura.");
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* BACKGROUND LINES */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/[0.03] rounded-full blur-[130px]" />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col gap-8">

                {/* HEADER */}
                <header className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/[0.04] pb-6 px-2">
                    <div>
                        <Link href="/dashboard" className="text-orange-500 font-black text-[9px] uppercase tracking-[4px] mb-1.5 block hover:opacity-70 transition-all">
                            ← Painel Principal
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Atestados Médicos</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 font-bold">
                            Módulo de Gestão de RH • GR Autopeças
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full px-2">

                    {/* FORM CARD */}
                    <div className="relative bg-[#09090b]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl overflow-hidden lg:col-span-1">
                        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

                        <h2 className="text-sm font-black uppercase tracking-[2px] text-slate-300 mb-6 flex items-center gap-2">
                            <span>🩺</span> Novo Afastamento
                        </h2>

                        {statusFeed.texto && (
                            <div className={`mb-4 p-3.5 rounded-xl border text-[10px] font-black uppercase tracking-wide ${
                                statusFeed.tipo === 'sucesso' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                                {statusFeed.texto}
                            </div>
                        )}

                        <form onSubmit={handleCadastrarAtestado} className="space-y-4">

                            <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Colaborador</label>
                                <select
                                    value={funcionarioId}
                                    onChange={e => setFuncionarioId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
                                    required
                                >
                                    <option value="" className="bg-[#09090b]">Selecionar Funcionário...</option>
                                    {funcionarios.map(f => (
                                        <option key={f.id} value={f.id} className="bg-[#09090b]">
                                            {f.nome} {f.sobrenome} (ID: {f.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Emissão</label>
                                    <input
                                        type="date"
                                        value={dataEmissao}
                                        onChange={e => setDataEmissao(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-2.5 rounded-xl outline-none text-white text-xs font-medium uppercase"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">CID (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: M54.5"
                                        value={cid}
                                        onChange={e => setCid(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-2.5 rounded-xl outline-none text-orange-400 text-xs font-mono uppercase placeholder-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Data Início</label>
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={e => setDataInicio(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-2.5 rounded-xl outline-none text-white text-xs font-medium uppercase"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Data Fim</label>
                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={e => setDataFim(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-2.5 rounded-xl outline-none text-white text-xs font-medium uppercase"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Justificativa / Motivo</label>
                                <textarea
                                    placeholder="Informe o motivo ou observações do afastamento..."
                                    value={justificativa}
                                    onChange={e => setJustificativa(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/[0.05] focus:border-orange-500/40 px-3 py-2.5 rounded-xl outline-none text-white text-xs font-medium transition-all placeholder-slate-700 resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase tracking-[2px] text-slate-500">Anexo (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf"
                                    onChange={e => setArquivo(e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-widest file:bg-white/[0.03] file:text-slate-200 file:border-white/[0.08] hover:file:bg-white/[0.06] text-xs font-bold cursor-pointer bg-black/20 border border-white/[0.03] p-1.5 rounded-xl"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                className="w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[2px] text-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group mt-2"
                                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {enviando ? "Processando Upload..." : "Salvar Atestado"}
                            </button>
                        </form>
                    </div>

                    {/* TABLE CARD */}
                    <div className="relative bg-[#09090b]/80 border border-white/[0.06] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl overflow-hidden lg:col-span-2 min-h-[400px]">
                        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

                        <h2 className="text-sm font-black uppercase tracking-[2px] text-slate-300 mb-6">
                            📋 Histórico de Registros
                        </h2>

                        {carregando ? (
                            <div className="text-center py-24 text-[9px] uppercase font-black text-slate-500 tracking-[4px] animate-pulse">
                                Buscando registros no cluster...
                            </div>
                        ) : atestados.length === 0 ? (
                            <div className="py-24 text-center">
                                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Nenhum atestado médico registrado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                    <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-wider text-[8px] font-black pb-3">
                                        <th className="pb-3 pl-2">Funcionário</th>
                                        <th className="pb-3 text-center">Período</th>
                                        <th className="pb-3 text-center">Dias</th>
                                        <th className="pb-3 text-center">CID</th>
                                        <th className="pb-3">Justificativa</th>
                                        <th className="pb-3 text-right pr-2">Documento</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.015]">
                                    {atestados.map(a => (
                                        <tr key={a.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="py-4 pl-2">
                                                <p className="font-black text-slate-200 uppercase tracking-tight">
                                                    {a.funcionarios ? `${a.funcionarios.nome} ${a.funcionarios.sobrenome}` : 'Desconhecido'}
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ID: {a.funcionario_id}</span>
                                            </td>
                                            <td className="py-4 text-center font-mono text-[11px] text-slate-400">
                                                {new Date(a.data_inicio).toLocaleDateString('pt-BR')} <span className="text-slate-600 font-sans text-xs">➔</span> {new Date(a.data_fim).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="py-4 text-center font-black text-orange-400 font-mono text-xs">
                                                {a.quantidade_dias}d
                                            </td>
                                            <td className="py-4 text-center font-mono font-bold text-amber-500 uppercase tracking-wide">
                                                {a.cid || '---'}
                                            </td>
                                            <td className="py-4 text-slate-300 font-medium max-w-[200px] truncate uppercase text-[10px] tracking-wide" title={a.justificativa}>
                                                {a.justificativa}
                                            </td>
                                            <td className="py-4 text-right pr-2">
                                                {a.url_documento ? (
                                                    <button
                                                        onClick={() => visualizarDocumento(a.url_documento!)}
                                                        className="text-[9px] font-black uppercase tracking-widest bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:text-orange-400 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
                                                    >
                                                        👁️ Ver Anexo
                                                    </button>
                                                ) : (
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mr-2">Sem Arquivo</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-700 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left px-2">
                <div>GR Autopeças & Serviços</div>
                <div className="font-mono text-slate-800">Módulo RH v2.5</div>
            </footer>
        </main>
    );
}