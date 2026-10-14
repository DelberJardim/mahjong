[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SdkPath,
    [Parameter(Mandatory = $true)][string]$JavaPath,
    [Parameter(Mandatory = $true)][string]$SigningDirectory,
    [string]$BuildDirectory = (Join-Path $PSScriptRoot 'build'),
    [string]$OutputApk = (Join-Path $PSScriptRoot 'build\mahjong-mamae.apk'),
    [switch]$InitializeSigningKey
)
$ErrorActionPreference = 'Stop'
$taskTools = Join-Path $SdkPath 'build-tools\36.0.0'
$taskAndroidJar = Join-Path $SdkPath 'platforms\android-36\android.jar'
$taskJavaBin = Join-Path $JavaPath 'bin'
foreach ($taskFile in @('aapt2.exe','d8.bat','zipalign.exe','apksigner.bat')) {
    if (!(Test-Path -LiteralPath (Join-Path $taskTools $taskFile))) { throw "Ferramenta Android ausente: $taskFile" }
}
if (!(Test-Path -LiteralPath $taskAndroidJar)) { throw 'Plataforma Android 36 ausente.' }
foreach ($taskFile in @('java.exe','javac.exe','jar.exe','keytool.exe')) {
    if (!(Test-Path -LiteralPath (Join-Path $taskJavaBin $taskFile))) { throw "Ferramenta Java ausente: $taskFile" }
}
function Invoke-AndroidTool([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Falha ao executar $(Split-Path $Executable -Leaf): $LASTEXITCODE" }
}
$taskOldJavaHome = $env:JAVA_HOME
$taskOldPassword = $env:MAHJONG_SIGNING_PASSWORD
$taskKeyStore = Join-Path $SigningDirectory 'mahjong-release.p12'
$taskPasswordFile = Join-Path $SigningDirectory 'password.dpapi'
try {
    $env:JAVA_HOME = $JavaPath
    if (!(Test-Path -LiteralPath $taskKeyStore)) {
        if (!$InitializeSigningKey) { throw 'Chave de assinatura ausente. Informe a chave existente; inicialização exige -InitializeSigningKey.' }
        if (Test-Path -LiteralPath $taskPasswordFile) { throw 'Há uma senha de assinatura existente sem sua chave. Não será sobrescrita.' }
        New-Item -ItemType Directory -Path $SigningDirectory -Force | Out-Null
        $taskRandom = New-Object byte[] 32
        $taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
        $taskRng.GetBytes($taskRandom)
        $taskRng.Dispose()
        $taskSecurePassword = ConvertTo-SecureString ([Convert]::ToBase64String($taskRandom)) -AsPlainText -Force
        $taskSecurePassword | ConvertFrom-SecureString | Set-Content -LiteralPath $taskPasswordFile -Encoding ASCII
    } else {
        $taskSecurePassword = Get-Content -LiteralPath $taskPasswordFile -Raw | ConvertTo-SecureString
    }
    $taskPasswordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecurePassword)
    try { $env:MAHJONG_SIGNING_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPasswordPtr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPasswordPtr) }
    if (!(Test-Path -LiteralPath $taskKeyStore)) {
        Invoke-AndroidTool (Join-Path $taskJavaBin 'keytool.exe') @('-genkeypair','-alias','mahjong','-keyalg','RSA',
            '-keysize','3072','-validity','10000','-storetype','PKCS12','-keystore',$taskKeyStore,
            '-storepass:env','MAHJONG_SIGNING_PASSWORD','-keypass:env','MAHJONG_SIGNING_PASSWORD',
            '-dname','CN=Mahjong da Mamae, O=DelberJardim')
    }
    foreach ($taskSubdir in @('res\values','res\drawable','classes','dex','generated')) {
        New-Item -ItemType Directory -Path (Join-Path $BuildDirectory $taskSubdir) -Force | Out-Null
    }
    New-Item -ItemType Directory -Path (Split-Path $OutputApk -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'res\values\styles.xml') -Destination (Join-Path $BuildDirectory 'res\values\styles.xml') -Force
    Copy-Item -LiteralPath (Join-Path (Split-Path $PSScriptRoot -Parent) 'icon-512.png') -Destination (Join-Path $BuildDirectory 'res\drawable\ic_launcher.png') -Force
    $taskCompiled = Join-Path $BuildDirectory 'compiled-res.zip'
    $taskUnsigned = Join-Path $BuildDirectory 'unsigned.apk'
    $taskAligned = Join-Path $BuildDirectory 'aligned.apk'
    Invoke-AndroidTool (Join-Path $taskTools 'aapt2.exe') @('compile','--dir',(Join-Path $BuildDirectory 'res'),'-o',$taskCompiled)
    Invoke-AndroidTool (Join-Path $taskTools 'aapt2.exe') @('link','-I',$taskAndroidJar,'--manifest',
        (Join-Path $PSScriptRoot 'AndroidManifest.xml'),'-o',$taskUnsigned,'--java',(Join-Path $BuildDirectory 'generated'),$taskCompiled)
    Invoke-AndroidTool (Join-Path $taskJavaBin 'javac.exe') @('--release','8','-encoding','UTF-8','-classpath',
        $taskAndroidJar,'-d',(Join-Path $BuildDirectory 'classes'),
        (Join-Path $PSScriptRoot 'src\io\github\delberjardim\mahjong\MainActivity.java'))
    $taskClassFiles = @(Get-ChildItem -LiteralPath (Join-Path $BuildDirectory 'classes') -Filter '*.class' -Recurse | ForEach-Object { $_.FullName })
    Invoke-AndroidTool (Join-Path $taskTools 'd8.bat') (@('--lib',$taskAndroidJar,'--min-api','24','--output',
        (Join-Path $BuildDirectory 'dex')) + $taskClassFiles)
    Invoke-AndroidTool (Join-Path $taskJavaBin 'jar.exe') @('uf',$taskUnsigned,'-C',(Join-Path $BuildDirectory 'dex'),'classes.dex')
    Invoke-AndroidTool (Join-Path $taskTools 'zipalign.exe') @('-f','-p','4',$taskUnsigned,$taskAligned)
    Invoke-AndroidTool (Join-Path $taskTools 'apksigner.bat') @('sign','--ks',$taskKeyStore,'--ks-key-alias','mahjong',
        '--ks-pass','env:MAHJONG_SIGNING_PASSWORD','--key-pass','env:MAHJONG_SIGNING_PASSWORD',
        '--v4-signing-enabled','false','--out',$OutputApk,$taskAligned)
    Invoke-AndroidTool (Join-Path $taskTools 'zipalign.exe') @('-c','4',$OutputApk)
    Invoke-AndroidTool (Join-Path $taskTools 'apksigner.bat') @('verify','--verbose','--print-certs',$OutputApk)
    Invoke-AndroidTool (Join-Path $taskTools 'aapt2.exe') @('dump','badging',$OutputApk)
    Get-FileHash -LiteralPath $OutputApk -Algorithm SHA256 | Select-Object Algorithm,Hash,Path
} finally {
    $env:JAVA_HOME = $taskOldJavaHome
    $env:MAHJONG_SIGNING_PASSWORD = $taskOldPassword
}
