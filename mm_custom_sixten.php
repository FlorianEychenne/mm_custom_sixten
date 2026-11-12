<?php
/**
 * mm_custom_sixten : module compagnon de mm_custom pour la marque Sixten.
 *
 * mm_custom porte le configurateur (moteur window.MmCustom, composants, squelette neutre) ; ce module apporte la mise en
 * page et l'interface de new.sixten (en-tête, rail Couleurs / Textes / Logos, une ligne par zone avec son éditeur, boutons
 * de scène, story Instagram), ses réglages (glisser sur tout le tapis, encre, semelle de 2 cm) et son CSS (non « layered » :
 * il passe devant la couche mmc.base de mm_custom).
 * La charte (couleurs, polices) est celle du thème enfant « sixten » ; une charte de repli est chargée quand le thème actif
 * n'est pas celui-là (site de dev sous Hummingbird).
 *
 * Contrat avec mm_custom : modules/mm_custom/docs/refonte-3.0/conception.md § 2 et § 7.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class Mm_custom_sixten extends Module
{
    const ROOT_CATEGORY = 'MM_CUSTOM_SIXTEN_ROOT_CATEGORY';
    const LEAD_TIME = 'MM_CUSTOM_SIXTEN_LEAD_TIME';
    const CHARTER_THEME = 'sixten'; // the child theme that carries the Sixten charter

    public function __construct()
    {
        $this->name = 'mm_custom_sixten';
        $this->tab = 'front_office_features';
        $this->version = '1.0.1';
        $this->author = 'Mediamart';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = ['min' => '9.0.0', 'max' => _PS_VERSION_];
        $this->dependencies = ['mm_custom'];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('mm_custom: Sixten layout');
        $this->description = $this->l('Companion module of mm_custom: layout and interface of the Sixten configurator.');
    }

    public function install()
    {
        return parent::install()
            && $this->registerHook('actionMmCustomRegisterCompanion')
            && $this->registerHook('actionMmCustomAssets')
            && Configuration::updateValue(self::ROOT_CATEGORY, 0);
    }

    public function uninstall()
    {
        Configuration::deleteByName(self::ROOT_CATEGORY);
        Configuration::deleteByName(self::LEAD_TIME);

        return parent::uninstall();
    }

    /**
     * Fiche du compagnon (lue par MmCustomCompanionResolver). root_category 0 : tous les produits (site Sixten) ; sur le
     * site de dev, la catégorie racine « Sixten ».
     */
    public function hookActionMmCustomRegisterCompanion($params)
    {
        return [
            'module' => $this->name,
            'site' => 'sixten',
            'root_category' => (int) Configuration::get(self::ROOT_CATEGORY),
            'template' => 'module:mm_custom_sixten/views/templates/front/configurator.tpl',
            'neutral_ui' => false, // its own interface (views/js/layout.js), built on the MmCustom API
        ];
    }

    /**
     * Fichiers du compagnon, chargés seulement quand il est actif sur la page du configurateur.
     */
    public function hookActionMmCustomAssets($params)
    {
        $controller = $params['controller'] ?? $this->context->controller;

        // The configurator stylesheet of the Sixten theme (themes/sixten/assets/css/mm-custom-theme.css, interface of the
        // 2.x module, loaded by mm_custom when it exists): its 3.0 version is this module's site.css
        $controller->unregisterStylesheet('mm_custom-vars');

        // Charter of the brand: from the child theme on the Sixten site, from this module elsewhere (dev site)
        if ($this->context->shop->theme_name !== self::CHARTER_THEME) {
            $controller->registerStylesheet(
                'mm_custom_sixten-charter',
                'modules/' . $this->name . '/views/css/charter.css',
                ['media' => 'all', 'priority' => 199]
            );
        }

        $controller->registerStylesheet(
            'mm_custom_sixten-site',
            'modules/' . $this->name . '/views/css/site.css',
            ['media' => 'all', 'priority' => 200]
        );

        $controller->registerJavascript(
            'mm_custom_sixten-layout',
            'modules/' . $this->name . '/views/js/layout.js',
            ['position' => 'bottom', 'priority' => 200]
        );

        // Lead time under the price, written by the template (views/templates/front/configurator.tpl)
        $this->context->smarty->assign('mmcs_lead_time', $this->leadTime());

        Media::addJsDef([
            'mm_custom_sixten' => [
                'img' => __PS_BASE_URI__ . 'modules/' . $this->name . '/views/img/',
                // Vue 3D : module ES chargé au clic (layout.js) ; la date du fichier évite un cache périmé
                'viewer3d' => __PS_BASE_URI__ . 'modules/' . $this->name . '/views/js/viewer3d.js?v=' . (int) @filemtime(__DIR__ . '/views/js/viewer3d.js'),
                'translations' => $this->jsTranslations(),
            ],
        ]);
    }

    /** Délai de fabrication affiché sous le prix (réglage par langue, sinon le texte par défaut traduit). */
    public function leadTime()
    {
        $value = (string) Configuration::get(self::LEAD_TIME, (int) $this->context->language->id);

        return $value !== '' ? $value : $this->l('Made to order: 3 weeks');
    }

    private function jsTranslations()
    {
        return [
            'colors' => $this->l('Colors'),
            'texts' => $this->l('Texts'),
            'logos' => $this->l('Logos'),
            'close' => $this->l('Close'),
            'templateLogo' => $this->l('Template logo'),
            'templateLogoHint' => $this->l('Replace it: library or file'),
            'freeSlot' => $this->l('Free slot'),
            'freeSlotHint' => $this->l('Add a logo: library or file'),
            'hidden' => $this->l('hidden'),
            'show' => $this->l('Show'),
            'hide' => $this->l('Hide'),
            'markers' => $this->l('Show the markers'),
            'markersHide' => $this->l('Hide the markers'),
            'storyEyebrow' => $this->l('Motorsport Customization'),
            'busy' => $this->l('Creating the image…'),
            'failed' => $this->l('The image could not be created.'),
            'rotate' => $this->l('Turn the mat a quarter turn'),
            'black' => $this->l('Black'),
            'white' => $this->l('White'),
            'emptyText' => $this->l('Empty text'),
            'placed' => $this->l('Logo in place'),
            'fromLibrary' => $this->l('From the library'),
            'imported' => $this->l('Imported'),
            'dropLogo' => $this->l('Drop your logo here'),
            'dropNew' => $this->l('Drop a new logo'),
            'palette' => $this->l('Palette'),
            'colorWheel' => $this->l('Colour wheel'),
            'colorCode' => $this->l('Colour code'),
            'font' => $this->l('Font'),
            'yourText' => $this->l('Your text'),
            'view3d' => $this->l('See the mat in 3D'),
            'view3dLoading' => $this->l('Preparing the 3D view…'),
            'view3dFailed' => $this->l('The 3D view is not available on this device.'),
            'view3dTitle' => $this->l('3D view'),
            'view3dHint' => $this->l('Drag to turn · Scroll or pinch to zoom'),
            'view3dRotate' => $this->l('Turn automatically'),
            'view3dReset' => $this->l('Reset the view'),
            'view3dTop' => $this->l('Top view'),
            'view3dShot' => $this->l('Download this view'),
            'printNote' => $this->l('Custom printed colors may vary slightly from those shown on screen, depending on your display and the printing process.'),
            'switchTitle' => $this->l('Change option?'),
            'switchText' => $this->l('Your current design will be replaced: each size and design has its own template.'),
            'switchGo' => $this->l('Change and start over'),
            'keepEditing' => $this->l('Keep editing'),
            'fit' => $this->l('Fit'),
            'designTitle' => $this->l('Choose your design'),
            'designsAvailable' => $this->l('%d available in %s'),
            'logoNotPlaced' => $this->l('The logo could not be placed. Choose a logo slot on the mat, then try again.'),
            'designNote' => $this->l('Previews in the original colours. If you have already changed the mat, you will be asked to confirm before switching.'),
        ];
    }

    /* ------------------------------------------------------------------ configuration */

    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submitMmCustomSixten')) {
            Configuration::updateValue(self::ROOT_CATEGORY, max(0, (int) Tools::getValue(self::ROOT_CATEGORY)));

            $lead = [];

            foreach (Language::getLanguages(false) as $language) {
                $lead[(int) $language['id_lang']] = trim((string) Tools::getValue(self::LEAD_TIME . '_' . (int) $language['id_lang']));
            }

            Configuration::updateValue(self::LEAD_TIME, $lead);
            $output .= $this->displayConfirmation($this->l('Settings updated.'));
        }

        return $output . $this->renderForm();
    }

    private function renderForm()
    {
        $helper = new HelperForm();
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        $helper->submit_action = 'submitMmCustomSixten';
        $helper->default_form_language = (int) $this->context->language->id;
        $helper->languages = $this->context->controller->getLanguages();

        $lead = [];

        foreach (Language::getLanguages(false) as $language) {
            $lead[(int) $language['id_lang']] = (string) Configuration::get(self::LEAD_TIME, (int) $language['id_lang']);
        }

        $helper->fields_value = [
            self::ROOT_CATEGORY => (int) Configuration::get(self::ROOT_CATEGORY),
            self::LEAD_TIME => $lead,
        ];

        return $helper->generateForm([[
            'form' => [
                'legend' => ['title' => $this->l('Settings'), 'icon' => 'icon-cogs'],
                'input' => [
                    [
                        'type' => 'text',
                        'name' => self::ROOT_CATEGORY,
                        'label' => $this->l('Root category of the brand'),
                        'desc' => $this->l('0 on the Sixten site (every product). On a site with several brands: id of the Sixten root category.'),
                        'class' => 'fixed-width-sm',
                    ],
                    [
                        'type' => 'text',
                        'name' => self::LEAD_TIME,
                        'lang' => true,
                        'label' => $this->l('Lead time shown under the price'),
                        'desc' => $this->l('Empty: "Made to order: 3 weeks", translated.'),
                    ],
                ],
                'submit' => ['title' => $this->l('Save')],
            ],
        ]]);
    }
}
