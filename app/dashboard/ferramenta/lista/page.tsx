"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ferramenta {
    id: string;
    nome: string;
    status: 'disponivel' | 'em_uso' | 'manutencao';
    dataCadastro: string;
}

export default function ListaFerramentasAdmin() {
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [nomeNova, setNomeNova] = useState('');
    const [statusNovo, setStatusNovo] = useState<'disponivel' | 'em_uso'>('disponivel');

    // Puxa a URL da Vercel
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    // BUSCA OS DADOS DA VPS
    const carregarFerramentas = async () => {
        if (!baseUrl) return;
        setCarregando(true);
        try {
            const response = await fetch(`${baseUrl}/ferramentas`, { cache: 'no-store' });
            if (response.ok) {
                const dados = await response.json();
                setFerramentas(dados);
            }
        } catch (error) {
            console.error("Erro ao buscar ferramentas:", error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        if (baseUrl) carregarFerramentas();
    }, [baseUrl]);

    // CADASTRAR NOVA FERRAMENTA NA VPS
    const handleCadastrar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomeNova || !baseUrl) return;

        try {
            const response = await fetch(`${baseUrl}/ferramentas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeNova, status: statusNovo })
            });

            if (response.ok) {
                setNomeNova('');
                carregarFerramentas(); // Recarrega a lista
            }
        } catch (error) {
            alert("Erro ao salvar na VPS");
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">

            <header className="max-w-6xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <Link href="/dashboard/ferramenta" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Gestão de Ativos</Link>
                    <h1 className="text-4xl font-black uppercase italic leading-none text-white">Inventário de <span className="text-orange-500">Ferramental</span></h1>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO */}
                <aside className="lg:col-span-1">
                    <form onSubmit={handleCadastrar} className="bg-slate-900/50 border border-white/5 p-8 rounded-[40px] sticky top-8">
                        <h2 className="text-sm font-black uppercase italic mb-6 tracking-widest text-white"> </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-2"> </label>
                                <input
                                    type="text"
                                    value={nomeNova}
                                    onChange={(e) => setNomeNova(e.target.value)}
                                    placeholder=" "
                                    className="w-full bg-black border border-white/5 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-sm mt-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-2"> </label>
                                <select
                                    value={statusNovo}
                                    onChange={(e) => setStatusNovo(e.target.value as any)}
                                    className="w-full bg-black border border-white/5 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-sm mt-2 appearance-none text-white cursor-pointer"
                                >
                                    <option value="disponivel"> </option>
                                    <option value="em_uso"> </option>
                                </select>
                            </div>

                        </div>
                    </form>
                </aside>

                {/* COLUNA DIREITA: TABELA DE LISTAGEM */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900/30 border border-white/5 rounded-[45px] overflow-hidden backdrop-blur-sm shadow-2xl">
                        <table className="w-full text-left border-collapse text-white">
                            <thead>
                            <tr className="bg-white/5">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500 border-none">Ferramenta</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500 text-center border-none">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500 text-right border-none">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {carregando ? (
                                <tr><td colSpan={3} className="p-20 text-center font-black uppercase text-slate-700 animate-pulse tracking-[8px]">Sincronizando Inventário...</td></tr>
                            ) : ferramentas.length > 0 ? ferramentas.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6 border-none">
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase italic text-lg text-white leading-tight">{item.nome}</span>
                                            <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">UID: {item.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center border-none">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                item.status === 'disponivel'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            }`}>
                                                {item.status === 'disponivel' ? 'No Estoque' : 'Em Uso'}
                                            </span>
                                    </td>
                                    <td className="p-6 text-right border-none">
                                        <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <Link href="/dashboard/ferramenta/etiquetas" className="bg-white/10 hover:bg-white hover:text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg">Etiqueta</Link>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="p-20 text-center font-black uppercase text-slate-600 tracking-[5px]">Nenhum item no inventário</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}