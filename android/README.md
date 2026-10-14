# APK do Mahjong da Mamãe

Aplicativo Android mínimo que abre a mesma versão HTTPS do jogo:
`https://delberjardim.github.io/mahjong/index.html?app=android`.
Usa o Android System WebView com JavaScript, armazenamento local e o service
worker do jogo para atualizações pelo menu e disponibilidade offline depois
da primeira abertura online. O código web e suas regras não são duplicados.

- Pacote: `io.github.delberjardim.mahjong`.
- Versão Android: `1.0.0`, código `1`.
- Mínimo: Android 7 / API 24; alvo e compilação: Android 16 / API 36.
- Permissão: acesso à internet.
- Ícone: o `icon-512.png` existente do projeto.
- Navegação interna limitada ao HTTPS de `delberjardim.github.io/mahjong/`.
- Sem acesso a arquivos locais, interfaces JavaScript nativas ou conteúdo HTTP misto.
- Respeita as barras do sistema e os recortes da tela.
- Botão Voltar fecha primeiro os diálogos Menu, Ajuda ou Embaralhar.
- Ao ir para segundo plano, dispara o salvamento já existente na página.

## Build no Windows

Necessário: Android SDK Build Tools 36.0.0, plataforma android-36 e JDK com
`java`, `javac`, `jar` e `keytool` (o JBR do Android Studio funciona).
O script compila Java/recursos, gera DEX, alinha o APK, assina e verifica o pacote.

```powershell
.\android\build.ps1 `
  -SdkPath "C:\caminho\Android\Sdk" `
  -JavaPath "C:\caminho\Android Studio\jbr" `
  -SigningDirectory "C:\pasta-privada\assinatura-mahjong" `
  -OutputApk "C:\saida\mahjong-mamae.apk"
```

Somente na primeira geração, use `-InitializeSigningKey` para criar a chave e
a senha protegida por Windows DPAPI. A chave fica em `mahjong-release.p12` e
a senha em `password.dpapi`, dentro da pasta privada indicada. A senha não é
impressa nem enviada ao GitHub. Para atualizações instaláveis sobre esta versão,
preserve a mesma chave e aumente `android:versionCode` no manifesto. A senha DPAPI
é vinculada ao usuário Windows que a criou; chave e senha precisam ser preservadas
para as próximas versões. Nenhum desses arquivos deve entrar no repositório.

O APK distribuído fica em `downloads/mahjong-mamae.apk`. Seu SHA-256 público
está em `downloads/mahjong-mamae.apk.sha256`.

## Verificações da versão 1.0.0

- Compilação com a API 36 e bytecode compatível com o Android mínimo.
- `zipalign -c 4`: aprovado.
- `apksigner verify --verbose`: aprovado, assinatura APK v2 e v3.
- Manifesto, pacote, ícone, atividade de inicialização e permissão conferidos
  com `aapt2 dump badging`.
- RSA de 3072 bits; certificado SHA-256:
  `809ec723389827cc80f34ee3a410334be4e65acfc5d12a197c6de48c258b556c`.
- O jogo web já passou nos 17 testes da versão publicada.

Não há imagem de emulador nem aparelho Android disponível neste ambiente.
A instalação e a execução do APK não foram testadas em Android; o build,
conteúdo e assinatura foram verificados. O jogo precisa de internet na primeira
abertura para preparar seus arquivos offline.
