"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
}

export default function RegistrarAjuste() {
    const router = useRouter();
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [carregando, setCarregando] = useState(false);

    // Estados do Formulário
    const [form, setForm] = useState({
        funcionarioId: '',
        tipo: 'pausa', // 'pausa' ou 'extra'
        data: new Date().toISOString().split('T')[0],
        minutos: '15',
        observacao: ''
    });

    useEffect(() => {
        const carregarFuncionarios = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            try {
                const res = await fetch(`${baseUrl}/funcionarios`);
                if (res.ok) setFuncionarios(await res.json());
            } catch (e) { console.error(e); }
        };
        carregarFuncionarios();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);

        // Aqui simulamos o envio para a VPS
        console.log("Enviando ajuste:", form);

        // Simulação de sucesso
        setTimeout(() => {
            setCarregando(false);
            alert("Lançamento registrado com sucesso!");
            router.push('/dashboard');
        }, 1000);
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
            <header className="max-w-3xl mx-auto mb-10">
                <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-2 block hover:opacity-70 transition-all">← Voltar</Link>
                <h1 className="text-4xl font-black uppercase italic leading-none">Registrar <span className="text-orange-500">Ajuste</span></h1>
                <p className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-widest">Lançamentos manuais de tempo e pausas</p>
            </header>

            <section className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-white/5 p-8 rounded-[45px] backdrop-blur-xl shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* SELEÇÃO DE FUNCIONÁRIO */}
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Colaborador</label>
                            <select
                                required
                                value={form.funcionarioId}
                                onChange={(e) => setForm({...form, funcionarioId: e.target.value})}
                                className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-orange-500 transition-all font-bold mt-2 text-white appearance-none cursor-pointer"
                            >
                                <option value="">Selecione o funcionário...</option>
                                {funcionarios.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome} {f.sobrenome}</option>
                                ))}
                            </select>
                        </div>

                        {/* TIPO DE LANÇAMENTO */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Tipo de Registro</label>
                            <div className="flex bg-black p-1 rounded-2xl border border-white/5 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({...form, tipo: 'pausa'})}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.tipo === 'pausa' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}
                                >
                                    ☕ Pausa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({...form, tipo: 'extra'})}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.tipo === 'extra' ? 'bg-green-600 text-white' : 'text-slate-600'}`}
                                >
                                    ➕ Extra
                                </button>
                            </div>
                        </div>

                        {/* TEMPO EM MINUTOS */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Tempo (Minutos)</label>
                            <input
                                type="number"
                                required
                                value={form.minutos}
                                onChange={(e) => setForm({...form, minutos: e.target.value})}
                                className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-orange-500 transition-all font-bold mt-2 text-white"
                                placeholder="Ex: 15"
                            />
                        </div>

                        {/* DATA DO EVENTO */}
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Data</label>
                            <input
                                type="date"
                                required
                                value={form.data}
                                onChange={(e) => setForm({...form, data: e.target.value})}
                                className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-orange-500 transition-all font-bold mt-2 text-white"
                            />
                        </div>

                        {/* OBSERVAÇÃO */}
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Motivo / Observação</label>
                            <textarea
                                value={form.observacao}
                                onChange={(e) => setForm({...form, observacao: e.target.value})}
                                rows={3}
                                className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-orange-500 transition-all font-bold mt-2 text-white resize-none"
                                placeholder="Ex: Pausa para lanche ou ajuste de saída esquecida..."
                            />
                        </div>
                    </div>

                    <button
                        disabled={carregando}
                        className="w-full bg-white text-black hover:bg-orange-500 hover:text-white mt-10 py-6 rounded-3xl font-black uppercase tracking-[5px] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {carregando ? "Sincronizando..." : "Confirmar Lançamento"}
                    </button>
                </form>
            </section>
        </main>
    );
}