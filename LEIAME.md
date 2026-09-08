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
- **🔀 Embaralhar** — reorganiza só as peças restantes, sempre gerando uma mesa com solução.
- **🔍 Zoom** — 1x → 1,4x → 1,9x → 2,5x. Com zoom, arraste para mover o tabuleiro.
- **⚙️ Menu** — tamanho (36/72/144/180 peças), desenho das peças (frutas e bichos,
  natureza, números, clássico chinês) e ajustes.

A partida é salva sozinha: pode fechar e voltar depois que continua de onde parou.

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

Ver as opções no arquivo `INSTALAR.md`.
