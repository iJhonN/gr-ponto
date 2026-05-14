import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

// --- MÉTODO GET: BUSCA TODOS OS PONTOS PARA OS RELATÓRIOS ---
export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db();

        const pontos = await db.collection("pontos")
            .find({})
            .sort({ data: -1 })
            .toArray();

        return NextResponse.json(pontos, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        console.error("Erro GET Pontos:", error);
        return NextResponse.json({ error: "Erro ao buscar pontos" }, { status: 500 });
    }
}

// --- MÉTODO POST: REGISTRA PONTO AUTOMÁTICO OU MANUAL ---
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { funcionarioId, modo, tipoManual, minutosAjuste, dataManual, observacaoManual } = body;

        const client = await clientPromise;
        const db = client.db();

        // Busca nome do funcionário
        const funcionario = await db.collection("funcionarios").findOne({ id: String(funcionarioId) });
        const nomeExibicao = funcionario ? `${funcionario.nome} ${funcionario.sobrenome}` : `ID: ${funcionarioId}`;

        let novoPonto;

        // --- LÓGICA PARA LANÇAMENTO MANUAL (PAUSAS / EXTRAS POR FORA) ---
        if (modo === 'manual') {
            novoPonto = {
                funcionarioId: String(funcionarioId),
                nome: nomeExibicao,
                data: new Date(dataManual), // Usa a data selecionada no calendário do Admin
                horaFormatada: "--:--",     // Lançamento manual não tem hora exata de batida
                tipo: tipoManual,           // 'pausa' ou 'extra'
                observacao: observacaoManual || "Ajuste Manual Administrativo",
                minutosAjuste: Number(minutosAjuste), // Campo essencial para o cálculo final
                status: 'validado',
                origem: 'admin'
            };
        }

        // --- LÓGICA PARA REGISTRO AUTOMÁTICO (BIPE DO FUNCIONÁRIO) ---
        else {
            const dataAgora = new Date();
            const dataBrasilia = new Date(dataAgora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

            const hora = dataBrasilia.getHours();
            const minuto = dataBrasilia.getMinutes();
            const totalMinutos = hora * 60 + minuto;

            const H8 = 8 * 60;   const H12 = 12 * 60;
            const H14 = 14 * 60;  const H18 = 18 * 60;
            const TOL = 5;

            let tipo = 'normal';
            let observacao = 'Jornada Normal';

            if (totalMinutos < (H8 - TOL)) {
                tipo = 'extra';
                observacao = 'Hora Extra (Entrada Antecipada)';
            } else if (totalMinutos > (H12 + TOL) && totalMinutos < (H14 - TOL)) {
                tipo = 'extra';
                observacao = 'Hora Extra (Intervalo Reduzido)';
            } else if (totalMinutos > (H18 + TOL)) {
                tipo = 'extra';
                observacao = 'Hora Extra (Saída Tardia)';
            } else if (totalMinutos > (H8 + TOL) && totalMinutos < (H12 - TOL)) {
                tipo = 'alerta';
                observacao = totalMinutos < (H8 + 30) ? 'Atraso na Entrada' : 'Saída Antecipada (Almoço)';
            } else if (totalMinutos > (H14 + TOL) && totalMinutos < (H18 - TOL)) {
                tipo = 'alerta';
                observacao = totalMinutos < (H14 + 30) ? 'Atraso (Volta Almoço)' : 'Saída Antecipada (Final)';
            }

            novoPonto = {
                funcionarioId: String(funcionarioId),
                nome: nomeExibicao,
                data: dataBrasilia,
                horaFormatada: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
                tipo,
                observacao,
                status: 'validado',
                origem: 'totem'
            };
        }

        await db.collection("pontos").insertOne(novoPonto);

        return NextResponse.json({ message: "Registro salvo com sucesso!" }, {
            status: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error("Erro POST Ponto:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}