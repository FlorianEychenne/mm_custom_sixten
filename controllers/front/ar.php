<?php
/**
 * mm_custom_sixten : « Voir chez moi » depuis un ordinateur (Mathieu, 2026-11-13).
 *
 * La création n'est pas enregistrée pendant la personnalisation : pour l'ouvrir en réalité augmentée sur un téléphone, la
 * vue 3D de l'ordinateur envoie ici l'image de l'impression (celle qu'elle pose sur le tapis 3D), avec la taille du tapis
 * et ses titres. Le serveur la garde 48 heures sous un identifiant aléatoire et renvoie l'adresse que montre le QR code.
 * Sur le téléphone, cette adresse ouvre une page qui affiche la même vue 3D, avec le bouton « Voir chez moi ».
 *
 *   POST action=share, token (jeton du visiteur de mm_custom), image (data URL JPEG, PNG ou WEBP), length, width (cm),
 *        title, subtitle, inkBlur  ->  JSON { url } (403 jeton, 400 image ou taille refusée)
 *   GET  k=<identifiant>             ->  la page du téléphone
 *   GET  k=<identifiant>&img=1       ->  l'image (JPEG)
 *
 * L'image est décodée puis réencodée en JPEG par GD : rien d'autre que des pixels n'est gardé ni servi. Dossier
 * var/mm_custom_sixten_ar/ du site (hors des dossiers servis), 48 h, 300 partages au plus.
 */
class Mm_custom_sixtenArModuleFrontController extends ModuleFrontController
{
    const TTL = 172800;          // 48 h
    const MAX_SHARES = 300;
    const MAX_BYTES = 6291456;  // image décodée : 6 Mo
    const MAX_SIDE = 4096;

    public function postProcess()
    {
        if (Tools::getValue('action') === 'share') {
            $this->share();
        }

        $key = (string) Tools::getValue('k');

        if (!preg_match('/^[a-f0-9]{32}$/', $key) || !is_file($this->dir() . $key . '.jpg')
            || filemtime($this->dir() . $key . '.jpg') < time() - self::TTL) {
            if ($key !== '' && Tools::getValue('img')) {
                http_response_code(404);
                exit;
            }

            $this->errors[] = $this->module->l('This link has expired. Open the 3D view on your computer again to get a new code.', 'ar');

            return;
        }

        if (Tools::getValue('img')) {
            header('Content-Type: image/jpeg');
            header('Content-Length: ' . filesize($this->dir() . $key . '.jpg'));
            header('Cache-Control: private, max-age=3600');
            header('X-Content-Type-Options: nosniff');
            readfile($this->dir() . $key . '.jpg');
            exit;
        }
    }

    public function initContent()
    {
        parent::initContent();

        $key = (string) Tools::getValue('k');
        $meta = [];

        if (!$this->errors && preg_match('/^[a-f0-9]{32}$/', $key)) {
            $meta = json_decode((string) @file_get_contents($this->dir() . $key . '.json'), true) ?: [];
        }

        $ar = $this->errors ? null : [
                'image' => $this->context->link->getModuleLink($this->module->name, 'ar', ['k' => $key, 'img' => 1]),
                'felt' => __PS_BASE_URI__ . 'modules/' . $this->module->name . '/views/img/felt.webp',
                'viewer' => __PS_BASE_URI__ . 'modules/' . $this->module->name . '/views/js/viewer3d.js?v=' . (int) @filemtime(_PS_MODULE_DIR_ . $this->module->name . '/views/js/viewer3d.js'),
                'length' => (int) ($meta['length'] ?? 0),
                'width' => (int) ($meta['width'] ?? 0),
                'title' => (string) ($meta['title'] ?? ''),
                'subtitle' => (string) ($meta['subtitle'] ?? ''),
                'inkBlur' => (float) ($meta['inkBlur'] ?? 1.2),
                'translations' => $this->module->jsTranslations(),
        ];

        $this->context->smarty->assign([
            'mmcs_ar' => $ar,
            'mmcs_ar_json' => $ar ? json_encode($ar, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) : '',
        ]);

        $this->setTemplate('module:mm_custom_sixten/views/templates/front/ar.tpl');
    }

    public function setMedia()
    {
        parent::setMedia();

        if ($this->context->shop->theme_name !== mm_custom_sixten::CHARTER_THEME) {
            $this->registerStylesheet('mm_custom_sixten-charter', 'modules/' . $this->module->name . '/views/css/charter.css', ['media' => 'all', 'priority' => 199]);
        }

        $this->registerStylesheet('mm_custom_sixten-site', 'modules/' . $this->module->name . '/views/css/site.css', ['media' => 'all', 'priority' => 200]);
    }

    public function getTemplateVarPage()
    {
        $page = parent::getTemplateVarPage();
        $page['meta']['robots'] = 'noindex';
        $page['meta']['title'] = $this->module->l('Your mat at home', 'ar');

        return $page;
    }

    private function dir()
    {
        return _PS_ROOT_DIR_ . '/var/mm_custom_sixten_ar/';
    }

    private function reply($status, array $body)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        header('Cache-Control: no-store');
        exit(json_encode($body));
    }

    private function share()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->reply(405, ['error' => 'method']);
        }

        // The visitor's token of mm_custom (cookie), as for its own AJAX calls; its classes come with the module
        Module::getInstanceByName('mm_custom');

        if (!class_exists('MmCustomSecurity') || !MmCustomSecurity::isValidToken(Tools::getValue('token'))) {
            $this->reply(403, ['error' => 'token']);
        }

        $length = (int) Tools::getValue('length');
        $width = (int) Tools::getValue('width');

        if ($length < 10 || $length > 1000 || $width < 10 || $width > 1000) {
            $this->reply(400, ['error' => 'size']);
        }

        $data = (string) Tools::getValue('image');

        if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $data, $m)) {
            $this->reply(400, ['error' => 'image']);
        }

        $binary = base64_decode(substr($data, strlen($m[0])), true);
        unset($data);

        if ($binary === false || strlen($binary) > self::MAX_BYTES) {
            $this->reply(400, ['error' => 'image']);
        }

        $info = @getimagesizefromstring($binary);

        if (!$info || $info[0] < 64 || $info[1] < 32 || $info[0] > self::MAX_SIDE || $info[1] > self::MAX_SIDE
            || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            $this->reply(400, ['error' => 'image']);
        }

        $image = @imagecreatefromstring($binary);
        unset($binary);

        if (!$image) {
            $this->reply(400, ['error' => 'image']);
        }

        $dir = $this->dir();

        if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
            $this->reply(500, ['error' => 'storage']);
        }

        if (!is_file($dir . 'index.php')) {
            @file_put_contents($dir . 'index.php', "<?php\nheader('Location: ../');\nexit;\n");
            @file_put_contents($dir . '.htaccess', "Require all denied\n");
        }

        $this->purge($dir);

        $key = bin2hex(random_bytes(16));
        $clean = function ($value) { return Tools::substr(trim(strip_tags((string) $value)), 0, 120); };

        if (!imagejpeg($image, $dir . $key . '.jpg', 88)) {
            $this->reply(500, ['error' => 'storage']);
        }

        imagedestroy($image);
        file_put_contents($dir . $key . '.json', json_encode([
            'length' => $length,
            'width' => $width,
            'title' => $clean(Tools::getValue('title')),
            'subtitle' => $clean(Tools::getValue('subtitle')),
            'inkBlur' => max(0, min(20, (float) Tools::getValue('inkBlur'))),
        ]));

        $this->reply(200, ['url' => $this->context->link->getModuleLink($this->module->name, 'ar', ['k' => $key])]);
    }

    // Shares older than 48 h go; beyond MAX_SHARES the oldest go too
    private function purge($dir)
    {
        $files = glob($dir . '*.jpg') ?: [];
        $limit = time() - self::TTL;
        $keep = [];

        foreach ($files as $file) {
            if (filemtime($file) < $limit) {
                @unlink($file);
                @unlink(substr($file, 0, -4) . '.json');
            } else {
                $keep[$file] = filemtime($file);
            }
        }

        if (count($keep) >= self::MAX_SHARES) {
            asort($keep);

            foreach (array_slice(array_keys($keep), 0, count($keep) - self::MAX_SHARES + 1) as $file) {
                @unlink($file);
                @unlink(substr($file, 0, -4) . '.json');
            }
        }
    }
}
