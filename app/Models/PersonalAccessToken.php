<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    public const LAST_USED_PRECISION_MINUTES = 10;

    public static function findToken($token)
    {
        if (! static::cacheEnabled()) {
            return parent::findToken($token);
        }

        $key = static::cacheKey($token);
        $cached = Cache::get($key);

        if (is_array($cached)) {
            return static::fromCache($cached);
        }

        $found = parent::findToken($token);

        if ($found && $found->tokenable instanceof User) {
            Cache::put($key, static::toCache($found), static::cacheSeconds());
        }

        return $found;
    }

    public static function forgetCached(?string $token): void
    {
        if (filled($token)) {
            Cache::forget(static::cacheKey($token));
        }
    }

    public function save(array $options = [])
    {
        if ($this->onlyTouchesLastUsedAt() && ! $this->lastUsedIsStale()) {
            return true;
        }

        return parent::save($options);
    }

    private function onlyTouchesLastUsedAt(): bool
    {
        return $this->exists && array_keys($this->getDirty()) === ['last_used_at'];
    }

    private function lastUsedIsStale(): bool
    {
        $previous = $this->getOriginal('last_used_at');

        return $previous === null
            || $this->asDateTime($previous)->lt(now()->subMinutes(self::LAST_USED_PRECISION_MINUTES));
    }

    private static function cacheEnabled(): bool
    {
        return (bool) config('sanctum.cache_tokens', false);
    }

    private static function cacheSeconds(): int
    {
        return (int) config('sanctum.cache_seconds', 300);
    }

    private static function cacheKey(string $token): string
    {
        return 'sanctum.token.'.hash('sha256', $token);
    }

    /**
     *
     * @return array<string, mixed>
     */
    private static function toCache(self $token): array
    {
        return [
            'token' => array_merge($token->only([
                'id', 'tokenable_type', 'tokenable_id', 'name',
                'abilities', 'expires_at', 'created_at', 'updated_at',
            ]), ['last_used_at' => now()->toDateTimeString()]),
            'user' => $token->tokenable->only([
                'id', 'name', 'email', 'role', 'email_verified_at', 'created_at', 'updated_at',
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $cached
     */
    private static function fromCache(array $cached): self
    {
        $token = (new static)->newFromBuilder($cached['token']);
        $user = (new User)->newFromBuilder($cached['user']);

        $token->setRelation('tokenable', $user);

        return $token;
    }
}
