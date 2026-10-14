# Como colocar o Mahjong no celular Android

Antes de tudo, uma informação honesta: **não dá para gerar um `.apk` aqui.**
Um APK de verdade exige o Android SDK (Java + Gradle, alguns gigabytes de ferramentas),
que não está instalado nesta máquina. Mas existe um caminho que dá **exatamente o mesmo
resultado prático** — um ícone na tela inicial, abrindo em tela cheia, funcionando sem
internet, sem cara de site.

---

## Opção A — Recomendada: instalar como aplicativo (PWA)

O Android trata uma página com `manifest.json` + `sw.js` como aplicativo de verdade:
ícone próprio, tela cheia, sem barra de endereço, funcionando offline. Só precisa que os
arquivos estejam num endereço `https://`. Hospedagem grátis e permanente, uma vez só:

1. Crie uma conta em **github.com** (grátis).
2. Clique em **New repository**, dê o nome `mahjong` e marque **Public**. Create.
3. Na página do repositório: **Add file → Upload files**. Arraste os 5 arquivos desta pasta
   (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`). **Commit changes**.
4. **Settings → Pages**. Em *Source* escolha **Deploy from a branch**, branch `main`,
   pasta `/ (root)`. **Save**.
5. Espere cerca de 1 minuto e recarregue. Vai aparecer o endereço:
   `https://SEU-USUARIO.github.io/mahjong/`
6. Abra esse endereço **no Chrome do celular da sua mãe**.
7. Menu **⋮ → Instalar aplicativo** (ou *Adicionar à tela inicial*).

Pronto: ícone na tela inicial. A partir daí abre offline, e o jogo já está inteiro no aparelho.

Para atualizar o jogo depois, suba juntos o `index.html` e o `sw.js` novos no mesmo
repositório (ou todos os arquivos de `dist/`). O `sw.js` desta correção usa o cache
`mahjong-mamae-v3`, para substituir a versão anterior no aparelho. Abra o app
conectado à internet, aguarde a atualização e feche e abra novamente para usar a
versão nova. A partida salva continua disponível.

Depois de carregar esta versão, o botão **Menu → Atualizar** busca os arquivos
mais recentes e reabre o jogo, preservando a partida. É preciso estar conectado
à internet para baixar uma atualização.

---

## Opção B — Sem criar conta nenhuma

O `index.html` sozinho já é o jogo inteiro e funciona sem internet.

1. Mande o arquivo para o celular: cabo USB, ou Google Drive, ou mandando para você mesmo
   no WhatsApp/e-mail e baixando no aparelho.
2. No celular, abra o app **Arquivos**, toque no `index.html` e escolha abrir com o **Chrome**.

Funciona igual e sem internet. A única diferença: fica na lista de arquivos em vez de virar
um ícone de aplicativo.

---

## Opção C — Um `.apk` de verdade, para instalar como app da loja

Depois de fazer a **Opção A** (é pré-requisito — o PWABuilder precisa de um endereço público):

1. Abra **pwabuilder.com** e cole o endereço `https://SEU-USUARIO.github.io/mahjong/`.
2. Clique em **Package for stores → Android → Download**.
3. Copie o `.apk` gerado para o celular e toque nele para instalar.
4. O Android vai pedir para liberar **"Instalar apps de fontes desconhecidas"** para o app
   que está abrindo o arquivo (Arquivos ou Chrome). É só autorizar.

Vale lembrar: o resultado é praticamente igual ao da Opção A, com uns passos a mais.
Por isso a Opção A é a recomendada.

---

## Dicas para o celular da sua mãe

- **Tamanho:** comece no **Fácil** (36 peças). O menu tem Médio (72), Clássico (144) e Grande (180).
- **Desenho das peças:** *Frutas e bichos* é o mais fácil de distinguir. *Clássico chinês* traz
  as peças tradicionais. *Números* é ótimo para quem enxerga pouco.
- **Escurecer peças bloqueadas** deixa na cara quais peças podem ser usadas — deixe ligado.
- O jogo salva sozinho: pode fechar no meio e continuar depois.
