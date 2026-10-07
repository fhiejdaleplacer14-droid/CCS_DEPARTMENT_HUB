<?php

namespace App\Services;

use Illuminate\Support\Str;
use Throwable;
use ZipArchive;

class DocumentTextExtractor
{
    private const MAX_CHARS = 20000;

    private const MIN_USABLE_CHARS = 200;

    public function extract(string $absolutePath, string $extension): ?string
    {
        $text = match (strtolower($extension)) {
            'txt' => $this->fromPlainText($absolutePath),
            'docx' => $this->fromOpenXml($absolutePath, ['word/document.xml']),
            'pptx' => $this->fromOpenXml($absolutePath, ['ppt/slides/slide']),
            'doc', 'ppt' => $this->fromLegacyBinary($absolutePath),
            default => null,
        };

        if ($text === null) {
            return null;
        }

        $text = $this->tidy($text);

        return Str::length($text) >= self::MIN_USABLE_CHARS ? $text : null;
    }

    private function fromPlainText(string $path): ?string
    {
        $contents = @file_get_contents($path, length: self::MAX_CHARS * 2);

        return $contents === false ? null : $contents;
    }

    /**
     *
     * @param  array<int, string>  $entryPrefixes
     */
    private function fromOpenXml(string $path, array $entryPrefixes): ?string
    {
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            return null;
        }

        try {
            $parts = [];

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);

                if ($name === false) {
                    continue;
                }

                foreach ($entryPrefixes as $prefix) {
                    if (str_starts_with($name, $prefix)) {
                        $xml = $zip->getFromIndex($i);

                        if ($xml !== false) {
                            $parts[] = $this->xmlToText($xml);
                        }

                        break;
                    }
                }
            }

            return $parts === [] ? null : implode("\n", $parts);
        } catch (Throwable) {
            return null;
        } finally {
            $zip->close();
        }
    }

    private function xmlToText(string $xml): string
    {
        $xml = preg_replace('/<\/w:p>|<\/a:p>|<w:br\s*\/>|<a:br\s*\/>/', "\n", $xml) ?? $xml;

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function fromLegacyBinary(string $path): ?string
    {
        $contents = @file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        preg_match_all('/[\x20-\x7E\r\n\t]{6,}/', $contents, $matches);

        return $matches[0] === [] ? null : implode(' ', $matches[0]);
    }

    private function tidy(string $text): string
    {
        if (! mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        }

        $text = preg_replace('/[ \t]+/', ' ', $text) ?? $text;
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return Str::limit(trim($text), self::MAX_CHARS, '');
    }
}
