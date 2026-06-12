"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CadastroVeiculoPage() {
    const [temPlaca, setTemPlaca] = useState(true);
    const [placa, setPlaca] = useState('');
    const [chassis, setChassis] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [modelo, setModelo] = useState('');
    const [ano, setAno] = useState('');
    const [kmLitro, setKmLitro] = useState('');
    const [kmAtual, setKmAtual] = useState('');

    // Armazena o arquivo selecionado
    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);

    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setArquivoFoto(e.target.files[0]);
        }
    };

    // ALGORITMO NATIVO DE COMPRESSÃO DE IMAGENS VIA CANVAS
    const compactarImagem = (arquivo: File, larguraMaxima = 1200, qualidade = 0.7): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(arquivo);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Redimensiona proporcionalmente se passar do limite máximo
                    if (width > larguraMaxima) {
                        height = Math.round((height * larguraMaxima) / width);
                        width = larguraMaxima;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error("Não foi possível obter o contexto do Canvas"));
                    }

                    // Desenha a imagem redimensionada no canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Exporta como blob em formato JPEG aplicando a qualidade (0.7 = 70%)
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Falha na conversão do Canvas para Blob"));
                        }
                    }, 'image/jpeg', qualidade);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setStatusFeed({ tipo: '', texto: '' });

        try {
            // Validações estruturais básicas
            if (temPlaca && !placa.trim()) {
                throw new Error("A placa é obrigatória para veículos rodoviários.");
            }
            if (!fabricante.trim() || !modelo.trim() || !ano.trim()) {
                throw new Error("Fabricante, Modelo e Ano são campos obrigatórios.");
            }

            let urlFinalDaFoto = null;

            // 1. SE HOUVER ARQUIVO, COMPACTA ANTES DE FAZER O UPLOAD
            if (arquivoFoto) {
                setStatusFeed({ tipo: 'info', texto: '⚡ Otimizando e compactando imagem do veículo...' });

                // Executa a compressão (Sempre sairá como .jpg leve)
                const blobCompactado = await compactarImagem(arquivoFoto, 1200, 0.7);

                // Nome único do arquivo
                const nomeArquivo = `fotos/${Date.now()}_veiculo.jpg`;

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('veiculos')
                    .upload(nomeArquivo, blobCompactado, {
                        contentType: 'image/jpeg',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw new Error(`Falha no upload da foto: ${uploadError.message}`);
                }

                // Captura a URL pública direta do arquivo otimizado
                if (uploadData) {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from('veiculos')
                        .getPublicUrl(nomeArquivo);

                    urlFinalDaFoto = publicUrlData.publicUrl;
                }
            }

            // 2. MONTA O PAYLOAD COM A URL DA FOTO RESOLVIDA
            const payload = {
                tem_placa: temPlaca,
                placa: temPlaca ? placa.trim().toUpperCase() : null,
                chassis: chassis.trim() || null,
                fabricante: fabricante.trim().toUpperCase(),
                modelo: modelo.trim().toUpperCase(),
                ano: parseInt(ano),
                km_litro: kmLitro ? parseFloat(kmLitro) : null,
                km_atual: kmAtual ? parseInt(kmAtual) : null,
                foto_url: urlFinalDaFoto
            };

            const { error: insertError } = await supabase
                .from('veiculos')
                .insert([payload]);

            if (insertError) throw insertError;

            setStatusFeed({
                tipo: 'sucesso',
                texto: `🚚 ${payload.fabricante} ${payload.modelo} cadastrado com foto otimizada no bucket!`
            });

            // Reseta o formulário
            setTemPlaca(true);
            setPlaca('');
            setChassis('');
            setFabricante('');
            setModelo('');
            setAno('');
            setKmLitro('');
            setKmAtual('');
            setArquivoFoto(null);

            // Limpa o input de arquivo na interface
            const fileInput = document.getElementById('input-foto') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            console.error(err);
            setStatusFeed({
                tipo: 'erro',
                texto: err.message || 'Falha ao registrar ficha do veículo.'
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#11141a] text-[#f1f3f7] p-4 sm:p-6 md:p-10 font-sans overflow-hidden antialiased flex flex-col justify-between w-full">

            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.01]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center max-w-[1400px] mx-auto">

                <div className="w-full max-w-2xl mb-4 text-left px-2">
                    <Link href="/dashboard/frota" className="text-blue-400 font-bold text-[10px] uppercase tracking-[3px] hover:opacity-80 transition-all">
                        ← Menu de Frotas
                    </Link>
                </div>

                {/* FORM CONTAINER */}
                <div className="w-full max-w-2xl relative bg-[#1a1f29]/95 border border-white/[0.06] rounded-[36px] p-8 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute top-0 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="mb-8">
                        <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <span>🚚</span> Cadastro de <span className="text-blue-400">Novo Veículo</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                            Insira as especificações técnicas com compressão automática de imagem integrada
                        </p>
                    </div>

                    {statusFeed.texto && (
                        <div className={`mb-6 p-4 rounded-xl border text-[10px] font-black uppercase tracking-wide text-center leading-relaxed ${
                            statusFeed.tipo === 'sucesso'
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                : statusFeed.tipo === 'info'
                                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-400 animate-pulse'
                                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            {statusFeed.texto}
                        </div>
                    )}

                    <form onSubmit={handleCadastro} className="space-y-6">

                        {/* TOGGLE: EMPLACADO OU NÃO */}
                        <div className="bg-[#222936] p-4 rounded-xl border border-white/[0.02] flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wide">O veículo possui Placa?</p>
                                <p className="text-[10px] text-slate-400">Desmarque caso seja um trator, empilhadeira ou maquinário pesado.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={temPlaca}
                                onChange={(e) => {
                                    setTemPlaca(e.target.checked);
                                    if(!e.target.checked) setPlaca('');
                                }}
                                className="w-5 h-5 rounded border-white/[0.08] bg-black text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* ROW 1: PLACA E CHASSIS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Placa Identificadora</label>
                                <input
                                    type="text"
                                    placeholder={temPlaca ? "EX: BRA2E19" : "SEM PLACA ATIVO"}
                                    value={placa}
                                    onChange={e => setPlaca(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono tracking-wider uppercase placeholder-slate-700 disabled:opacity-30 transition-all"
                                    disabled={!temPlaca || enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Número do Chassis (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Digite o código do chassis..."
                                    value={chassis}
                                    onChange={e => setChassis(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono tracking-wider uppercase placeholder-slate-700 transition-all"
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ROW 2: FABRICANTE E MODELO */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Montadora / Fabricante</label>
                                <input
                                    type="text"
                                    placeholder="EX: VOLKSWAGEN, XCMG"
                                    value={fabricante}
                                    onChange={e => setFabricante(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase transition-all placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Modelo do Veículo</label>
                                <input
                                    type="text"
                                    placeholder="EX: CONSTELLATION 24.280 V-TRONIC"
                                    value={modelo}
                                    onChange={e => setModelo(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-bold uppercase transition-all placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* ROW 3: ANO, KM/L e KM ATUAL */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Ano de Fabricação</label>
                                <input
                                    type="number"
                                    placeholder="EX: 2024"
                                    value={ano}
                                    onChange={e => setAno(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono transition-all placeholder-slate-700"
                                    required
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Consumo Médio (KM/L - Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="EX: 3.5"
                                    value={kmLitro}
                                    onChange={e => setKmLitro(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono transition-all placeholder-slate-700"
                                    disabled={enviando}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Odômetro / KM Atual (Opcional)</label>
                                <input
                                    type="number"
                                    placeholder="EX: 45200"
                                    value={kmAtual}
                                    onChange={e => setKmAtual(e.target.value)}
                                    className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-white text-xs font-mono transition-all placeholder-slate-700"
                                    disabled={enviando}
                                />
                            </div>
                        </div>

                        {/* SELECIONAR FOTO DA GALERIA INTEGRADO */}
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">Foto do Veículo (Será compactada automaticamente)</label>
                            <input
                                id="input-foto"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full bg-black/50 border border-white/[0.06] focus:border-blue-500/50 px-4 py-3 rounded-xl outline-none text-slate-400 text-xs transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer"
                                disabled={enviando}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[3px] text-black transition-all active:scale-[0.99] disabled:opacity-40 overflow-hidden relative group mt-2"
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {enviando ? "Processando e Salvando..." : "Cadastrar Veículo na Frota (Enter)"}
                        </button>
                    </form>
                </div>

            </div>

            <footer className="w-full border-t border-white/[0.02] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-[3px] gap-4 text-center sm:text-left max-w-[1400px] mx-auto px-2">
                <div>GR Autopeças & Distribuição</div>
                <div className="font-mono text-slate-600">Fleet Control Unit v1.0</div>
            </footer>
        </main>
    );
}