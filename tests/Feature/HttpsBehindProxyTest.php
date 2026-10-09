<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

/**
 * Railway terminates TLS at its edge and forwards the request to the app over
 * plain HTTP. Without a trusted proxy Laravel generates http:// asset URLs on
 * an https:// page and the browser blocks them as mixed content -- a blank
 * page, no CSS and no JS.
 */
class HttpsBehindProxyTest extends TestCase
{
    private const PROXY_HEADERS = [
        'X-Forwarded-Proto' => 'https',
        'X-Forwarded-Host' => 'ccsdepartmenthub.up.railway.app',
        'X-Forwarded-Port' => '443',
    ];

    public function test_a_forwarded_https_request_is_treated_as_secure(): void
    {
        $this->withServerVariables(['HTTP_X_FORWARDED_PROTO' => 'https']);

        $this->get('/up')->assertOk();

        $this->assertTrue(
            request()->isSecure(),
            'The request must be seen as HTTPS, otherwise every generated URL is http://.',
        );
    }

    public function test_asset_urls_on_the_spa_shell_are_https(): void
    {
        if (! is_file(public_path('build/manifest.json'))) {
            $this->markTestSkipped('Needs built assets: run npm run build first.');
        }

        // While `npm run dev` is running Laravel links to the Vite dev server
        // instead of the built assets, which is not what production serves.
        Vite::useHotFile(storage_path('framework/testing/vite.hot'));

        $response = $this->withHeaders(self::PROXY_HEADERS)->get('/');

        $response->assertOk();

        $html = $response->getContent();

        $this->assertStringNotContainsString(
            'http://ccsdepartmenthub.up.railway.app',
            $html,
            'An insecure asset URL was rendered; the browser will block it as mixed content.',
        );

        // The page must actually use the forwarded host, so that this test
        // cannot pass merely because the host was something else.
        $this->assertStringContainsString(
            'https://ccsdepartmenthub.up.railway.app',
            $html,
            'The shell did not render asset URLs against the forwarded host at all.',
        );
    }

    public function test_generated_urls_follow_the_forwarded_scheme(): void
    {
        $this->withServerVariables([
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_HOST' => 'ccsdepartmenthub.up.railway.app',
        ]);

        $this->get('/up')->assertOk();

        $this->assertStringStartsWith('https://', url('/build/assets/app.css'));
        $this->assertStringStartsWith('https://', asset('build/assets/app.css'));
    }

    public function test_a_plain_http_request_is_left_alone(): void
    {
        // Local development must not be forced onto https.
        $this->get('/up')->assertOk();

        $this->assertFalse(request()->isSecure());
    }
}
