"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Funcionario {
    id: string;
    nome: string;
    sobrenome: string;
}

export default function PontoPeloSite() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [status, setStatus] = useState<{ msg: string; tipo: 'sucesso' | 'erro' | null }>({ msg: '', tipo: null });
    const [carregando, setCarregando] = useState(false);
    const [horaAtual, setHoraAtual] = useState("");

    // Referência para o campo de input invisível que o leitor vai usar
    const inputRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState("");

    // Relógio
    useEffect(() => {
        const timer = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR')), 1000);
        return () => clearInterval(timer);
    }, []);

    // Carrega funcionários
    useEffect(() => {
        const carregar = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            try {
                const res = await fetch(`${baseUrl}/funcionarios`);
                if (res.ok) setFuncionarios(await res.json());
            } catch (e) { console.error(e); }
        };
        carregar();

        // Mantém o foco no input do leitor o tempo todo
        const focusInput = () => inputRef.current?.focus();
        document.addEventListener('click', focusInput);
        focusInput();
        return () => document.removeEventListener('click', focusInput);
    }, []);

    const processarBipe = async (id: string) => {
        if (!id) return;
        setCarregando(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const funcionario = funcionarios.find(f => String(f.id) === String(id));
        const nomeParaExibir = funcionario ? `${funcionario.nome}` : `ID: ${id}`;

        try {
            const res = await fetch(`${baseUrl}/ponto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funcionarioId: id, modo: 'totem' })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus({ msg: `Olá, ${nomeParaExibir}! ${data.obs}`, tipo: 'sucesso' });
                setTimeout(() => setStatus({ msg: '', tipo: null }), 4000);
            } else {
                setStatus({ msg: "Erro ao identificar crachá.", tipo: 'erro' });
            }
        } catch (error) {
            setStatus({ msg: "Erro de conexão VPS", tipo: 'erro' });
        } finally {
            setCarregando(false);
            setBarcode(""); // Limpa para o próximo bipe
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            processarBipe(barcode);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* Input Invisível para o Leitor */}
            <input
                ref={inputRef}
                type="text"
                className="absolute opacity-0 pointer-events-none"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
            />

            <div className="w-full max-w-2xl bg-slate-900/30 border border-white/5 p-12 rounded-[60px] text-center backdrop-blur-2xl relative overflow-hidden">
                {/* Efeito de Scan na tela */}
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/20 animate-scan"></div>

                <Link href="/dashboard" className="text-orange-500 font-black text-[10px] uppercase tracking-[4px] mb-12 block hover:opacity-70">← Dashboard</Link>

                <h1 className="text-6xl font-black italic uppercase mb-2 tracking-tighter">Totem <span className="text-orange-500">Digital</span></h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[8px] mb-12">Aproxime o Crachá do Leitor</p>

                <div className="bg-black/40 rounded-[40px] py-12 mb-12 border border-white/5 shadow-inner">
                    <span className="text-7xl font-mono font-black text-orange-500 tracking-tighter leading-none block">{horaAtual || "00:00:00"}</span>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {carregando ? (
                        <div className="animate-pulse text-orange-500 font-black uppercase italic tracking-[10px] text-xl py-4">Validando...</div>
                    ) : (
                        <div className="w-20 h-20 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                            <span className="text-2xl opacity-20">📡</span>
                        </div>
                    )}

                    {status.msg && (
                        <div className={`w-full p-8 rounded-3xl font-black uppercase italic text-sm transition-all animate-bounce-short ${
                            status.tipo === 'sucesso' ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-red-600 text-white'
                        }`}>
                            {status.msg}
                        </div>
                    )}
                </div>
            </div>

            <footer className="mt-12 flex items-center gap-4 opacity-20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black uppercase tracking-[5px]">Scanner Ready: GR-API Active</p>
            </footer>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 3s linear infinite;
                }
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-short {
                    animation: bounce-short 0.5s ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
            `}</style>
        </div>
    );
}