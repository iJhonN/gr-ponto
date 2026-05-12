"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
    dataCadastro: string;
}

export default function ListaFuncionariosAdmin() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);

    // Puxa a URL configurada no Environment da Vercel
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const carregarDados = async () => {
            if (!baseUrl) return;
            setCarregando(true);
            try {
                // Consumindo a URL dinâmica da VPS via Vercel
                const response = await fetch(`${baseUrl}/funcionarios`, { cache: 'no-store' });
                if (response.ok) {
                    const dados = await response.json();
                    setFuncionarios(dados);
                }
            } catch (error) {
                console.error("Erro ao conectar com a VPS:", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarDados();
    }, [baseUrl]);

    const filtrados = funcionarios.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.id.includes(busca)
    );

    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div>
                    <Link href="/dashboard/funcionario" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Voltar</Link>
                    <h1 className="text-4xl font-black uppercase italic text-white leading-none">Gestão de <span className="text-orange-500">Equipe</span></h1>
                </div>

                <div className="w-full md:w-96 relative group">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou ID..."
                        className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-3xl outline-none focus:border-orange-500 transition-all font-bold placeholder:text-slate-700 text-white"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                    <span className="absolute right-5 top-5 opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
                </div>
            </header>

            <section className="max-w-6xl mx-auto">
                <div className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left border-collapse text-white">
                        <thead>
                        <tr className="bg-white/5">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">ID / Código</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Colaborador</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Cargo</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {carregando ? (
                            <tr>
                                <td colSpan={4} className="p-20 text-center font-black uppercase text-slate-700 animate-pulse tracking-[10px]">Sincronizando VPS...</td>
                            </tr>
                        ) : filtrados.length > 0 ? (
                            filtrados.map((func) => (
                                <tr key={func.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                            <span className="bg-black border border-white/10 px-4 py-2 rounded-xl font-mono text-orange-500 font-bold">
                                                {func.id}
                                            </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black italic text-sm text-black">
                                                {func.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black uppercase italic leading-tight text-white">{func.nome} {func.sobrenome}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Ativo no Sistema</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 uppercase font-bold text-xs text-slate-300">
                                        {func.cargo}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href="/dashboard/funcionario/crachas" className="bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white p-3 rounded-xl transition-all text-[10px] font-black uppercase shadow-lg shadow-orange-900/10">Crachá</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-20 text-center text-slate-500 font-bold uppercase italic">Nenhum funcionário encontrado.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex justify-between items-center px-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Total: {filtrados.length} Colaboradores Cadastrados</p>
                    <div className="h-1 w-20 bg-slate-900 rounded-full"></div>
                </div>
            </section>
        </main>
    );
}