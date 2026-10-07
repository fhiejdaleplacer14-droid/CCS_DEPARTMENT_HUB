<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class ListCache
{
    public const TTL_SECONDS = 30;

    public static function remember(string $resource, array $parts, callable $callback): mixed
    {
        return Cache::remember(self::key($resource, $parts), self::TTL_SECONDS, $callback);
    }

    public static function bump(string $resource): void
    {
        Cache::forever(self::versionKey($resource), self::version($resource) + 1);
    }

    private static function key(string $resource, array $parts): string
    {
        ksort($parts);

        return sprintf(
            '%s.v%d.%s',
            $resource,
            self::version($resource),
            md5(json_encode($parts)),
        );
    }

    private static function version(string $resource): int
    {
        return (int) Cache::get(self::versionKey($resource), 1);
    }

    private static function versionKey(string $resource): string
    {
        return "listcache.version.{$resource}";
    }
}
