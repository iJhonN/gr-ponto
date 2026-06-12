import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let response = NextResponse.next({ request });

    // 1. Instancia o Supabase adequado para ambientes de Edge/Middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );

    // 2. Recupera a sessão do usuário logado de forma segura
    const { data: { user } } = await supabase.auth.getUser();

    // Se o usuário tentar acessar qualquer painel interno sem estar logado, joga pro login
    if (!user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 3. Busca o cargo do usuário diretamente na tabela do banco
    const { data: perfil } = await supabase
        .from('usuarios_painel')
        .select('cargo')
        .eq('id', user.id)
        .maybeSingle();

    const cargo = perfil?.cargo?.toUpperCase() || 'MECANICO';

    // ─── MATRIZ DE SEGURANÇA REQUISITADA PELO JHON ───

    // Regra do RH e Cadastro de Usuários (Apenas Admin e Gerente)
    if (pathname.startsWith('/dashboard/rh') || pathname.startsWith('/dashboard/rh/cadastrousuario')) {
        const autorizados = ['ADMIN', 'GERENTE'];
        if (!autorizados.includes(cargo)) {
            return NextResponse.redirect(new URL('/dashboard?erro=privilegio', request.url));
        }
    }

    // Regra do Fechamento Contábil e Funcionários (Apenas Admin e Gerente)
    if (pathname.startsWith('/dashboard/fechamento') || pathname.startsWith('/dashboard/funcionarios')) {
        const autorizados = ['ADMIN', 'GERENTE'];
        if (!autorizados.includes(cargo)) {
            return NextResponse.redirect(new URL('/dashboard?erro=privilegio', request.url));
        }
    }

    // Regra de Frotas, Combustível, Rotas e Médias (Admin, Gerente e Gestor de Frotas)
    if (pathname.startsWith('/dashboard/frota')) {
        const autorizados = ['ADMIN', 'GERENTE', 'GESTORDEFROTAS'];
        if (!autorizados.includes(cargo)) {
            return NextResponse.redirect(new URL('/dashboard?erro=privilegio', request.url));
        }
    }

    // Regra do Ponto Geral (Admin, Gerente e Técnico)
    if (pathname.startsWith('/dashboard/ponto')) {
        const autorizados = ['ADMIN', 'GERENTE', 'TECNICO'];
        if (!autorizados.includes(cargo)) {
            return NextResponse.redirect(new URL('/dashboard?erro=privilegio', request.url));
        }
    }

    // Nota: As rotas de ferramentas (/dashboard/ferramentas/retirada, etc) estão liberadas
    // para todos os cargos da sua lista (Admin, Gerente, Tecnico, Mecanico), então o middleware deixa passar.

    return response;
}

// Configura o filtro de quais caminhos o Next.js deve monitorar (Ignora arquivos públicos e assets)
export const config = {
    matcher: [
        '/dashboard/:path*' // Protege a rota mãe e todas as subpastas criadas dentro dela
    ],
};