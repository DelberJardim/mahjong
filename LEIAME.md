# 🀄 Mahjong da Mamãe

Mahjong Solitaire em português, feito para ser fácil de jogar no celular —
peças grandes, dica, desfazer ilimitado e **tabuleiro sempre com solução**.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O jogo inteiro. Sozinho já funciona: dois cliques e joga. |
| `manifest.json` | Faz o Android tratar a página como aplicativo (ícone, tela cheia). |
| `sw.js` | Guarda o jogo no aparelho para funcionar **sem internet**. |
| `icon-192.png`, `icon-512.png` | Ícone do app. |
| `OFL-Mahjong-Symbols.txt` | Licença da pequena fonte chinesa embutida no jogo. |

`manifest.json`, `sw.js` e os ícones só entram em ação quando a página é
publicada num endereço `https://`. Abrindo o `index.html` direto do aparelho,
o jogo funciona igual — só não vira um ícone na tela inicial.

## Como se joga

1. Toque em **duas peças iguais** para removê-las.
2. Só valem peças **livres**: sem nada em cima e com o lado **esquerdo ou direito** desocupado.
3. Peças bloqueadas aparecem escurecidas.
4. Ganha quem limpar a mesa.

## Botões

- **💡 Dica** — mostra um par. A dica procura um par que ainda leve à vitória,
  não apenas um par qualquer.
- **↶ Desfazer** — ilimitado, volta jogada por jogada.
- **🔀 Embaralhar** — pede confirmação e reorganiza só as peças restantes, sempre gerando uma mesa com solução.
- **🔍 Zoom** — 1x → 1,4x → 1,9x → 2,5x. Com zoom, arraste para mover o tabuleiro.
- **⚙️ Menu** — tamanho (36/72/144/180 peças), desenho das peças (frutas e bichos,
  natureza, números, clássico chinês) e ajustes.
- **↻ Atualizar**, dentro do Menu — busca a versão mais recente pela internet e
  reabre o jogo mantendo a partida salva. Se o download falhar, a partida e a
  versão offline anterior ficam disponíveis para tentar novamente.

A partida é salva sozinha: pode fechar e voltar depois que continua de onde parou.

## Peças clássicas

O catálogo tem **42 desenhos**: círculos 1–9, bambus 1–9, caracteres 1–9,
quatro ventos, três dragões, quatro flores e quatro estações. Os caracteres
usam uma fonte chinesa embutida de aproximadamente 7 KB; não dependem de
fontes instaladas nem de downloads. O `index.html` continua funcionando sozinho.

Cada tabuleiro clássico inclui as sete categorias. Os desenhos escolhidos variam
entre partidas, mantendo os tamanhos de 36/72/144/180 peças e a regra de combinar
**duas faces iguais**. Há no máximo 36 faces distintas em uma partida, para que
a troca entre os quatro temas preserve exatamente as combinações existentes.
O catálogo de 42 desenhos é usado para seleção; a distribuição mantém o sistema
de pares do jogo. Partidas antigas continuam válidas, inclusive as flores F1 (梅)
e F2 (竹).

## Verificar e gerar a versão final

O jogo não precisa de compilação para ser aberto. Para executar a validação e
gerar uma pasta de publicação `dist/`, use Node.js 20 ou superior:

```sh
npm install
npx playwright install chromium
npm test
npm run build
```

Também é possível usar `pnpm` nos mesmos comandos. Para testar com um Edge já
instalado, defina `MAHJONG_BROWSER_CHANNEL=msedge` antes de executar os testes
(no PowerShell: `$env:MAHJONG_BROWSER_CHANNEL = 'msedge'`).

Os testes conferem as 42 faces clássicas e as 108 faces dos demais temas,
os 16 conjuntos de tema/tamanho, cores e fonte no desktop e celular, troca de
tema sem alterar pares, seleção, remoção, desfazer, dica, embaralhamento, zoom,
restauração de partidas antigas, arquivos locais, atualização do cache e PWA
offline. Também conferem cancelar e confirmar embaralhamento nos dois botões,
atualizar pelo Menu, preservar a partida na atualização e tratar falta de rede
ou falha de download. Capturas de tela são salvas em `test-results/` para conferência visual.

## A garantia de "nunca ficar sem saída"

O tabuleiro **não** é embaralhado e torcido para dar certo. Ele é montado ao contrário:

1. Começa com todas as posições ocupadas por peças ainda "em branco".
2. O programa escolhe duas posições **livres** pelas regras do jogo e as remove,
   anotando o par. Repete até esvaziar a mesa.
3. Essa sequência de remoções é, por construção, **uma solução válida**.
4. Só então cada par anotado recebe o mesmo desenho.

Ou seja: existe pelo menos um caminho até o fim, sempre. O mesmo procedimento roda
no **Embaralhar**, então mesmo depois de o jogador se enroscar, a mesa volta a ter solução.

O jogador ainda pode escolher um caminho que trave (faz parte da graça do Mahjong) —
para isso existem o **Desfazer** ilimitado e o **Embaralhar**, e o jogo avisa na hora
em que não sobra nenhum par.

### Como isso foi conferido

- Layouts checados: nenhuma peça sobreposta, nenhuma peça flutuando sem apoio,
  quantidade sempre par (36 / 72 / 144 / 180).
- **Fácil:** 60 tabuleiros gerados e resolvidos por um solucionador exato — 60/60.
- **Médio:** 40 tabuleiros — 40/40 resolvidos; nenhum provado insolúvel.
- **Clássico (tartaruga, 144):** 35 tabuleiros — 35/35 resolvidos.
- **Grande (180):** 15 tabuleiros — 15/15 resolvidos.
- Partida inteira jogada automaticamente seguindo só a **Dica**: terminou em 0 peças.
- Embaralhar: confere que nenhuma peça se perde, que toda contagem continua par
  e que a mesa resultante tem solução.

## Instalar no celular

Ver as opções no arquivo `INSTALAR.md`. Há também um
[APK assinado para Android 7 ou superior](https://delberjardim.github.io/mahjong/downloads/mahjong-mamae.apk).
O APK usa o jogo publicado; a primeira abertura precisa de internet. Código
Android e instruções de build ficam em `android/`.
