<?php
// Dynamic ZIP packaging endpoint.
// Generates a fresh archive of the CMMS project when requested, avoiding the need
// to keep binary ZIP files in the repository.

if (php_sapi_name() === 'cli') {
    fwrite(STDERR, "This endpoint should be served via PHP's built-in server.\n");
    exit(1);
}

if (!class_exists('ZipArchive')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'امکان ایجاد فایل ZIP وجود ندارد. افزونه ZipArchive در سرور فعال نیست.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rootPath = realpath(__DIR__ . '/..');
if ($rootPath === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'مسیر ریشه پروژه یافت نشد.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$pathsToInclude = [
    'backend',
    'frontend',
    'README.md',
    'QUICKSTART.md',
    'DELIVERY_SUMMARY.md',
    'DOWNLOAD_LINKS.md',
    'PROJECT_SUMMARY.md',
    'VERIFICATION_REPORT.md',
    'GITHUB_SETUP.md',
    'PUSH_TO_GITHUB.md',
    'start-backend.sh',
    'start-backend.bat',
    'start-frontend.sh',
    'start-frontend.bat',
    '.gitignore',
    'uploads/.gitkeep',
];

$zipFile = tempnam(sys_get_temp_dir(), 'cmms_');
if ($zipFile === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'امکان ایجاد فایل موقت برای ZIP وجود ندارد.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$zipFileWithExtension = $zipFile . '.zip';
if (!@rename($zipFile, $zipFileWithExtension)) {
    $zipFileWithExtension = $zipFile;
}

$zip = new ZipArchive();
if ($zip->open($zipFileWithExtension, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    @unlink($zipFileWithExtension);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'امکان باز کردن فایل ZIP موقت وجود ندارد.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$skipNames = ['.git', 'node_modules', 'vendor'];

foreach ($pathsToInclude as $relativePath) {
    $absolutePath = $rootPath . DIRECTORY_SEPARATOR . $relativePath;
    if (!file_exists($absolutePath)) {
        continue;
    }

    if (is_dir($absolutePath)) {
        addDirectoryToZip($zip, $absolutePath, $relativePath, $skipNames);
    } else {
        $zip->addFile($absolutePath, $relativePath);
    }
}

$zip->close();

$zipSize = filesize($zipFileWithExtension);
if ($zipSize === false) {
    @unlink($zipFileWithExtension);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'امکان تعیین اندازه فایل ZIP وجود ندارد.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="CMMS-Mine-Maintenance-System.zip"');
header('Content-Length: ' . $zipSize);
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$chunkSize = 1024 * 1024;
$handle = fopen($zipFileWithExtension, 'rb');
if ($handle === false) {
    @unlink($zipFileWithExtension);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => 'امکان خواندن فایل ZIP وجود ندارد.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

while (!feof($handle)) {
    echo fread($handle, $chunkSize);
    @ob_flush();
    flush();
}

fclose($handle);
@unlink($zipFileWithExtension);
exit;

function addDirectoryToZip(ZipArchive $zip, string $directoryPath, string $baseName, array $skipNames): void
{
    $zip->addEmptyDir($baseName);

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(
            $directoryPath,
            FilesystemIterator::SKIP_DOTS | FilesystemIterator::FOLLOW_SYMLINKS
        ),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $fileInfo) {
        $subPath = $iterator->getSubPathName();
        if ($subPath === '') {
            continue;
        }

        $segments = explode('/', str_replace('\\', '/', $subPath));
        foreach ($segments as $segment) {
            if (in_array($segment, $skipNames, true)) {
                continue 2;
            }
        }

        $localName = $baseName . '/' . str_replace('\\', '/', $subPath);

        if ($fileInfo->isDir()) {
            $zip->addEmptyDir($localName);
        } elseif ($fileInfo->isFile()) {
            $zip->addFile($fileInfo->getPathname(), $localName);
        }
    }
}
