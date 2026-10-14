# Correção de peças invisíveis

Base inspecionada: commit `7fd8cfb` de `DelberJardim/mahjong`.

## Defeito reproduzido

As funções `bigChar` e `stackChars` interpolavam nomes de fontes com aspas duplas
em um atributo `style` também delimitado por aspas duplas. O navegador encerrava
o atributo em `font-family:` e interpretava o restante como atributos inválidos.

Em `bigChar`, isso descartava também a cor e o tamanho. WE/WS/WW/WN, DR/DG e
F1/F2 herdavam `rgb(243, 246, 242)` sobre a face clara `#fbf7ea` e pareciam vazias.
DW, círculos e bambus eram SVGs e apareciam normalmente. C1–C9 tinham cores
nos elementos filhos, mas o estilo de fonte do contêiner também era inválido.

O catálogo original tinha 36 faces: 27 de naipes, 4 ventos, 3 dragões e apenas
2 flores. F3/F4 e S1/S2/S3/S4 não existiam. Nos tabuleiros menores, a seleção
usava somente o começo do catálogo, deixando categorias inteiras fora do jogo.

## Correção

- Estilos de fontes e dimensões passam a classes CSS, sem interpolar aspas.
- Fonte WOFF2 com os 24 caracteres necessários embutida no HTML (7.140 bytes).
  Origem: Noto Sans CJK TC Bold, licenciada sob SIL OFL 1.1; licença e atribuição
  incluídas no HTML e em `OFL-Mahjong-Symbols.txt`.
- Catálogo clássico completo de 42 faces e seleção equilibrada entre categorias.
  Mantém até 36 faces distintas por partida e pares exatos, preservando a troca
  para os temas de 36 faces. Os tamanhos e as regras de geometria continuam iguais.
- Identificadores F1/F2, chave de salvamento e significado dos desenhos mantidos.
- Mapeamento clássico aceita apenas códigos válidos, incluindo F1–F4 e S1–S4.
- Cache do PWA atualizado para v2; limpeza limitada aos caches do Mahjong.

## Validação

`node --test --test-concurrency=1 tests/*.test.cjs`: **11 testes aprovados**,
com Playwright 1.62.1 e Microsoft Edge em modo headless no Windows.

- 150 faces verificadas: 42 clássicas + 36 frutas/bichos + 36 natureza + 36 números.
- Clássico conferido a 1280×900 e 390×844, com e sem escurecimento de bloqueio.
- Os 16 conjuntos de tema/tamanho mantêm contagens, pares, limites do tabuleiro e jogadas.
- Troca entre todos os temas mantém equivalência de cada par das 144 posições.
- Seleção por clique real, remoção, desfazer, dica, embaralhamento e zoom conferidos.
- Salvamento antigo restaurado com os mesmos códigos, desenhos e tempo acumulado.
- HTML standalone e PWA funcionam offline, com fonte disponível.
- Atualização simulada de service worker v1 para v2 confirmada; caches alheios preservados.
- JavaScript, UTF-8, manifesto, dimensões dos ícones e caminhos de assets conferidos.
- Build estático com seis arquivos, idênticos às fontes, gerado em `dist/`.

As capturas de todas as faces foram inspecionadas visualmente. A validação móvel
usa dimensões de celular em navegador desktop; não foi executada em um aparelho
Android ou iPhone físico.
