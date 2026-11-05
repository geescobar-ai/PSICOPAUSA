# =============================================================================
#  PSICOPAUSA - Servidor Local Seguro
#  Solo lectura · Solo localhost · Solo archivos del proyecto
#  Puerto 3000 · Uso exclusivo para pruebas locales
# =============================================================================

# --- CONFIGURACIÓN ---
$port = 3000

# GetFullPath resuelve la ruta absoluta real sin .. ni . en su interior.
# TrimEnd garantiza que $root nunca termine en separador (lo agregamos
# explícitamente en $rootWithSep para la comparación de límite).
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar
)

# SEGURIDAD: se agrega el separador al final de la raíz para la comparación.
# Así "C:\Users\Geraldine\Desktop\Proyecto" no coincide como prefijo de
# "C:\Users\Geraldine\Desktop\ProyectoMalicioso\archivo.html".
$rootWithSep = $root + [System.IO.Path]::DirectorySeparatorChar

# --- EXTENSIONES PERMITIDAS (lista blanca estricta) ---
# Solo estos tipos pueden ser servidos. .ps1, .bat, .cmd, .env, etc.
# están automáticamente bloqueados por no aparecer aquí.
$allowedExtensions = @(
    '.html', '.css', '.js', '.json',
    '.png',  '.jpg', '.jpeg', '.svg', '.webp', '.ico',
    '.mp3',  '.wav', '.ogg', '.m4a'
)

# --- CARPETAS INTERNAS BLOQUEADAS ---
# Aunque el archivo tenga extensión permitida, si está dentro de alguna de
# estas carpetas la solicitud devuelve 403.
$blockedFolders = @('.git', '.env', 'node_modules', '__pycache__')

# --- MAPA DE TIPOS MIME ---
$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.json'  = 'application/json; charset=utf-8'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.svg'   = 'image/svg+xml'
    '.webp'  = 'image/webp'
    '.ico'   = 'image/x-icon'
    '.mp3'   = 'audio/mpeg'
    '.wav'   = 'audio/wav'
    '.ogg'   = 'audio/ogg'
    '.m4a'   = 'audio/mp4'
}

# --- FUNCIÓN: Enviar respuesta de error ---
# El bloque finally garantiza que la conexión siempre se cierra,
# incluso si ocurre un error al escribir la respuesta.
function Send-Error {
    param(
        [System.Net.HttpListenerResponse]$resp,
        [int]$code,
        [string]$message
    )
    try {
        $resp.StatusCode      = $code
        $resp.ContentType     = 'text/plain; charset=utf-8'
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { }
    finally {
        try { $resp.OutputStream.Close() } catch { }
    }
}

# --- INICIAR SERVIDOR ---
$listener = New-Object System.Net.HttpListener

# SEGURIDAD: solo localhost y 127.0.0.1. Nunca 0.0.0.0 ni la IP de red local,
# por lo que ningún otro dispositivo de la red puede acceder.
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Error "No se pudo iniciar el servidor en el puerto ${port}: $_"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PSICOPAUSA - Servidor local iniciado      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  URL:    http://localhost:$port            " -ForegroundColor Green
Write-Host "  Raiz:   $root                            " -ForegroundColor Gray
Write-Host "  Acceso: solo este computador (localhost)  " -ForegroundColor Gray
Write-Host "  Para detener: presiona Ctrl+C             " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- BUCLE PRINCIPAL ---
try {
    while ($listener.IsListening) {

        # Espera la siguiente petición del navegador.
        $context = $null
        try {
            $context = $listener.GetContext()
        } catch [System.Net.HttpListenerException] {
            # El listener fue detenido (Ctrl+C) → salir del bucle limpiamente.
            break
        }

        $request  = $context.Request
        $response = $context.Response

        # -------------------------------------------------------------------
        # PROTECCIÓN 1: Solo métodos GET y HEAD
        # POST, PUT, DELETE y cualquier otro verbo devuelven 405.
        # -------------------------------------------------------------------
        $method = $request.HttpMethod.ToUpper()
        if ($method -ne 'GET' -and $method -ne 'HEAD') {
            Write-Host "  [405] Metodo no permitido: $method  $($request.Url.LocalPath)" -ForegroundColor Red
            Send-Error $response 405 "405 Method Not Allowed - Solo se aceptan GET y HEAD."
            continue
        }

        # -------------------------------------------------------------------
        # PROTECCIÓN 2: Decodificación y saneamiento de la ruta URL
        #
        # Pasos:
        #   a) Decodificar %XX (p.ej. %2F → /) para deshacer codificación URL.
        #   b) Descartar todo lo que venga después de '?' (query string).
        #   c) Eliminar barras y puntos iniciales para obtener una ruta relativa.
        #   d) Rechazar explícitamente rutas que contengan una letra de unidad
        #      de disco (C:, D:, …) → rutas absolutas de Windows disfrazadas.
        #   e) Reemplazar barras de URL por el separador del SO.
        # -------------------------------------------------------------------

        # a) Decodificar la URL completa (%2e%2e%2f → ../ etc.)
        $rawUrl = [Uri]::UnescapeDataString($request.Url.LocalPath)

        # b) Eliminar query string si llegara en LocalPath (caso raro pero posible)
        $qIdx = $rawUrl.IndexOf('?')
        if ($qIdx -ge 0) { $rawUrl = $rawUrl.Substring(0, $qIdx) }

        # c) Eliminar barras iniciales y convertir a ruta relativa
        $relativePath = $rawUrl.TrimStart('/', '\', ' ')

        # Si la ruta queda vacía o es solo "/" se sirve index.html
        if ([string]::IsNullOrWhiteSpace($relativePath)) {
            $relativePath = 'index.html'
        }

        # d) Rechazar rutas absolutas o con letra de unidad (C:, D:, \\, etc.)
        #    Patrón: una letra seguida de dos puntos, o rutas UNC con \\
        if ($relativePath -match '^[A-Za-z]:' -or $relativePath.StartsWith('\\')) {
            Write-Host "  [403] Ruta absoluta rechazada: $relativePath" -ForegroundColor Red
            Send-Error $response 403 "403 Forbidden - Rutas absolutas no permitidas."
            continue
        }

        # e) Normalizar separadores al estilo del SO (\ en Windows)
        $sep          = [System.IO.Path]::DirectorySeparatorChar
        $relativePath = $relativePath.Replace('/', $sep).Replace('\', $sep)

        # -------------------------------------------------------------------
        # PROTECCIÓN 3: Verificar límite real de la carpeta raíz
        #
        # Path.Combine($root, relativePath) construye la ruta candidata.
        # GetFullPath la resuelve a su forma canónica, eliminando ..\ y ./
        # de forma que "app\..\..\..\Windows" se convierte en "C:\Windows".
        #
        # La comparación usa $rootWithSep (con separador al final) para que
        # "C:\...\Proyecto\" NO sea prefijo de "C:\...\ProyectoMalicioso\".
        # Se usa OrdinalIgnoreCase para ser insensible a mayúsculas en Windows.
        # -------------------------------------------------------------------
        $candidatePath = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine($root, $relativePath)
        )

        # El archivo index.html en la raíz queda como exactamente $root\index.html,
        # que sí empieza por $rootWithSep → pasa la validación.
        $isInsideRoot = $candidatePath.StartsWith(
            $rootWithSep,
            [System.StringComparison]::OrdinalIgnoreCase
        )

        if (-not $isInsideRoot) {
            Write-Host "  [403] Ruta fuera del proyecto bloqueada: $candidatePath" -ForegroundColor Red
            Send-Error $response 403 "403 Forbidden - Acceso fuera de la carpeta del proyecto no permitido."
            continue
        }

        # -------------------------------------------------------------------
        # PROTECCIÓN 4: Bloquear carpetas internas sensibles
        # Se revisa cada segmento de la ruta relativa ya normalizada.
        # -------------------------------------------------------------------
        $segments = $relativePath.Split($sep, [System.StringSplitOptions]::RemoveEmptyEntries)
        $blockedSegment = $false
        foreach ($seg in $segments) {
            if ($blockedFolders -contains $seg.ToLower()) {
                $blockedSegment = $true
                break
            }
        }
        if ($blockedSegment) {
            Write-Host "  [403] Carpeta interna bloqueada en: $relativePath" -ForegroundColor Red
            Send-Error $response 403 "403 Forbidden - Acceso a carpeta interna no permitido."
            continue
        }

        # -------------------------------------------------------------------
        # PROTECCIÓN 5: Solo extensiones de la lista blanca
        # -------------------------------------------------------------------
        $ext = [System.IO.Path]::GetExtension($candidatePath).ToLower()
        if ($allowedExtensions -notcontains $ext) {
            Write-Host "  [403] Extension no permitida: $ext  ($relativePath)" -ForegroundColor Red
            Send-Error $response 403 "403 Forbidden - Tipo de archivo no permitido: $ext"
            continue
        }

        # -------------------------------------------------------------------
        # PROTECCIÓN 6: El archivo debe existir y ser un fichero (no carpeta)
        # -------------------------------------------------------------------
        if (-not (Test-Path $candidatePath -PathType Leaf)) {
            Write-Host "  [404] No encontrado: $relativePath" -ForegroundColor DarkYellow
            Send-Error $response 404 "404 Not Found - Archivo no encontrado: $relativePath"
            continue
        }

        # -------------------------------------------------------------------
        # SERVIR EL ARCHIVO
        # Todas las protecciones superadas → se lee y se envía el archivo.
        # -------------------------------------------------------------------
        try {
            $bytes = [System.IO.File]::ReadAllBytes($candidatePath)
            $mime  = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }

            $response.StatusCode      = 200
            $response.ContentType     = $mime
            $response.ContentLength64 = $bytes.Length

            # Para HEAD solo se envían las cabeceras HTTP, sin cuerpo.
            if ($method -eq 'GET') {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }

            Write-Host "  [200] $method $relativePath" -ForegroundColor Green

        } catch {
            Write-Host "  [500] Error al leer: $relativePath - $_" -ForegroundColor Red
            Send-Error $response 500 "500 Internal Server Error - No se pudo leer el archivo."
            continue
        } finally {
            try { $response.OutputStream.Close() } catch { }
        }

    } # fin while
}
finally {
    # --- APAGADO LIMPIO ---
    # El bloque finally se ejecuta siempre, incluso si el usuario
    # presiona Ctrl+C, garantizando que el puerto 3000 quede libre.
    Write-Host ""
    Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
    try { $listener.Stop()  } catch { }
    try { $listener.Close() } catch { }
    Write-Host "Servidor detenido correctamente. Ningun proceso quedo activo." -ForegroundColor Green
}
