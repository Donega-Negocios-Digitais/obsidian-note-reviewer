# Teste de Renderização de Callouts

## Callouts Básicos

> [!note] Nota Simples
> Este é um callout de nota simples com conteúdo.

> [!warning] Aviso Importante
> Este é um aviso que você deve prestar atenção.

> [!tip] Dica Útil
> Aqui está uma dica para melhorar seu trabalho.

> [!success] Sucesso
> Operação completada com sucesso!

## Callouts Colapsáveis

> [!info]- Callout Colapsado
> Este callout começa colapsado (note o `-` após o tipo).
> Você pode clicar para expandir.

> [!danger]+ Callout Expandido
> Este callout é colapsável mas começa expandido (note o `+`).
> Clique para colapsar.

## Callouts Sem Título

> [!question]
> Este callout não tem título customizado.
> O tipo é usado como título padrão.

> [!bug]
> Callout de bug sem título customizado.

## Callouts com Markdown

> [!example] Exemplo com Formatação
> Este callout contém **texto em negrito**, *itálico*, `código inline` e [links](https://example.com).

## Tipos Customizados

> [!custom] Tipo Customizado
> Este é um tipo customizado que não está na lista padrão.
> Deve renderizar com ícone e cor fallback.

## Callout Multilinhas

> [!note] Callout Longo
> Esta é a primeira linha do callout.
> Esta é a segunda linha.
> Esta é a terceira linha.
> Múltiplas linhas devem ser renderizadas corretamente.

## Todos os Tipos Padrão

> [!note] Note

> [!abstract] Abstract

> [!info] Info

> [!todo] Todo

> [!tip] Tip

> [!success] Success

> [!question] Question

> [!warning] Warning

> [!failure] Failure

> [!danger] Danger

> [!bug] Bug

> [!example] Example

> [!quote] Quote

## Blockquote Normal (Não é Callout)

> Este é um blockquote normal.
> Não tem a sintaxe [!tipo], então deve renderizar como blockquote tradicional.
