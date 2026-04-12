# Vambora Penedo

Aplicacao web desenvolvida com Next.js para conectar pessoas e facilitar a mobilidade em Penedo.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React (icones)

## Requisitos

- Node.js 20+
- npm 10+

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra no navegador:

```text
http://localhost:3000
```

## Scripts disponiveis

- `npm run dev`: inicia o ambiente de desenvolvimento
- `npm run build`: gera o build de producao
- `npm run start`: inicia a aplicacao em modo producao
- `npm run lint`: executa o lint do projeto

## Estrutura principal

```text
src/
	app/
		page.tsx              # tela inicial
		login/page.tsx        # tela de login
		signup/page.tsx       # tela de cadastro
		(protected)/
			dashboard/page.tsx
		layout.tsx            # layout raiz
		globals.css           # estilos globais
	components/
		cards/RouteCards.tsx
		search/SearchBar.tsx
		navigation/TabBar.tsx
	types/
```

## Funcionalidades atuais

- Tela inicial com CTA para continuar
- Fluxo de login e cadastro
- Transicao visual entre paginas
- Layout responsivo base para mobile e desktop

## Proximos passos sugeridos

- Integrar autenticacao real (API)
- Adicionar validacao de formulario
- Criar pagina de recuperacao de senha
- Configurar pipeline de deploy

## Licenca

Defina a licenca do projeto (exemplo: MIT) antes da publicacao.
