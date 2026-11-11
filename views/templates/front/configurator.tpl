{extends file='page.tpl'}

{block name="page_content"}

{* Configurateur Sixten (mm_custom_sixten) : balisage de new.sixten (thème sixten v0.18.72, interface 0.15), sur les
   composants de mm_custom. En-tête noir (S, nom, menus Taille / Design, prix, panier, sauvegarder, fermer) ; rail
   Couleurs / Textes / Logos et panneau d'outils à gauche ; tapis sur la scène, zoom, rotation, repères, images.
   Les lignes (une par zone), le rail, les menus d'options et les repères sont construits par views/js/layout.js depuis
   l'API window.MmCustom ; les éditeurs ci-dessous sont déplacés sous la ligne choisie. *}

<div class="module-page mmc-configurator mmc-site-sixten">

{include file='module:mm_custom/views/templates/front/configurator/components/vars.tpl'}
{include file='module:mm_custom/views/templates/front/configurator/components/fonts.tpl'}
{include file='module:mm_custom/views/templates/front/configurator/components/loading.tpl'}

<div class="module-top-bar">
    <a class="sx-config-logo" href="{$urls.base_url}" aria-label="Sixten"><span class="sx-config-logo__s" aria-hidden="true"></span></a>

    <div class="module-title">
        <h1>{$title}</h1>
        {if $product_attributes}
            <p class="module-attributes">
                {foreach $product_attributes as $attribute}
                    <span class="module-attribute">{$attribute.name}</span>
                {/foreach}
            </p>
        {/if}
    </div>

    <div class="sx-actions">
        <div class="module-footer">
            <div class="add-to-shopping-cart">
                {if $customer['id_default_group'] == 4}
                    <p class="price">{$price} {if $language.iso_code === 'fr'}HT{/if}</p>
                {else}
                    <p class="price">{$price}</p>
                {/if}
                <small class="sx-lead">{$mmcs_lead_time|default:''}</small>
                {* A plain button: the design is sent by MmCustom.cart.add() (AJAX), never by a form *}
                <button type="button" class="mm-btn-cart add-to-cart" id="add-to-cart">{l s='Add to cart' mod='mm_custom_sixten'}</button>
            </div>
        </div>
        <button type="button" class="mm-btn save-custom" data-product-id="{$product_id}" data-category="{$product_category_id}" data-product-attribute="{$product_attribute_id}" >{if $is_resuming_custom}{l s='Save changes' mod='mm_custom_sixten'}{else}{l s='Save' mod='mm_custom_sixten'}{/if}</button>
        <a class="sx-config-close no-prefetch" href="{$urls.base_url}" aria-label="{l s='Close' mod='mm_custom_sixten'}">&times;</a>
    </div>
</div>

<div class="module-container">

    {* Panneau d'outils : fermé au départ, ouvert par le rail ou par un clic sur le tapis *}
    <div class="info" id="sx-dock">
        <div class="sx-dock__head">
            <p class="sx-dock__eye"></p>
            <button type="button" class="sx-dock__next">{l s='Next' mod='mm_custom_sixten'} <span aria-hidden="true">›</span></button>
            <button type="button" class="sx-dock__close" aria-label="{l s='Close' mod='mm_custom_sixten'}"><span aria-hidden="true">&times;</span></button>
        </div>

        <div class="tools">

            {* COULEURS *}
            <div class="colors-design" data-sx-kind="colors" hidden>
                <div class="sx-rows sx-rows--colors"></div>
                <div class="sx-editor sx-editor--colors">
                    {include file="module:mm_custom/views/templates/front/_colors-sections.tpl" colorClass="colors-color" wheelId="wheel-elements"}
                </div>
            </div>

            {* TEXTES *}
            <div class="text-design" data-sx-kind="text" hidden>
                <div class="sx-rows sx-rows--text"></div>
                <div class="sx-editor sx-editor--text">
                    <div class="inputTextDesign" data-mmc-fonts='{$mm_font_families|json_encode|escape:"html":"UTF-8"}'>
                        {* champ, barre (alignement, police, taille) : views/js/layout.js, sur ui/text-editor.js de mm_custom *}
                        <div class="sx-text-foot">
                            <div class="leave-empty-text">
                                <p id="sx-hide-text-label">{l s='Hide the text' mod='mm_custom_sixten'}</p>
                                <label class="leave-empty"><input type="checkbox" id="sx-hide-text" aria-labelledby="sx-hide-text-label"><span class="leave-empty-slider"></span></label>
                            </div>
                        </div>
                    </div>
                    <div class="font-colors">
                        <label class="mm-tools-title">{l s='Colour choice' mod='mm_custom_sixten'}</label>
                        {include file="module:mm_custom/views/templates/front/_colors-sections.tpl" colorClass="font-color" wheelId="wheel-texts"}
                    </div>
                </div>
            </div>

            {* LOGOS *}
            <div class="logos-choice" data-sx-kind="logo" hidden>
                <div class="sx-rows sx-rows--logo"></div>
                <div class="sx-editor sx-editor--logo">
                    <div class="sx-logo sx-logo--current">
                        <p class="mm-tools-title">{l s='Your logo' mod='mm_custom_sixten'}</p>
                        <div class="sx-current">
                            <div class="sx-thumb sx-thumb--empty">{l s='No logo' mod='mm_custom_sixten'}</div>
                            <div class="sx-meta">
                                <b>{l s='Nothing placed yet' mod='mm_custom_sixten'}</b>
                                <small>{l s='Import a file or pick one from the library.' mod='mm_custom_sixten'}</small>
                                <button type="button" class="sx-remove" hidden>{l s='Remove' mod='mm_custom_sixten'}</button>
                            </div>
                        </div>
                        <div class="sx-logo-sliders">
                            <div class="sx-logo-size">
                                <div class="logo-design hide">
                                    <label class="mm-tools-title" for="sx-logo-size">{l s='Logo size' mod='mm_custom_sixten'}</label>
                                    <input type="range" class="slider-logo-size" id="sx-logo-size" min="-100" max="600" value="0" step="1">
                                </div>
                                <div class="sx-logo-size__empty">
                                    <span class="mm-tools-title">{l s='Logo size' mod='mm_custom_sixten'}</span>
                                    <input type="range" disabled aria-hidden="true" tabindex="-1">
                                </div>
                            </div>
                            <div class="sx-logo-pos">
                                <div class="sx-logo-pos__row">
                                    <span class="mm-tools-title" id="sx-logo-pos-label">{l s='Left / right offset' mod='mm_custom_sixten'}</span>
                                    <span class="sx-logo-pos__val">0</span>
                                </div>
                                <input type="range" min="-500" max="500" step="5" value="0" disabled aria-labelledby="sx-logo-pos-label">
                            </div>
                        </div>
                        <div class="sx-logo-foot">
                            <div class="leave-empty-logo">
                                <p id="sx-hide-logo-label">{l s='Hide the logo' mod='mm_custom_sixten'}</p>
                                <label class="leave-empty"><input type="checkbox" id="sx-hide-logo" aria-labelledby="sx-hide-logo-label"><span class="leave-empty-slider"></span></label>
                            </div>
                            <button type="button" class="sx-logo-hint" hidden>{l s='Logo larger than its slot: fit it back' mod='mm_custom_sixten'}</button>
                        </div>
                    </div>
                    <div class="sx-logo sx-logo--library">
                        <p class="mm-tools-title">{l s='Logo library' mod='mm_custom_sixten'}</p>
                        <button type="button" class="sx-lib-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>{l s='Open the library' mod='mm_custom_sixten'}{if $logos|count} · +{$logos|count}{/if}</button>
                        <p class="sx-logo__hint">{l s='Partners and brands logos, ready to use.' mod='mm_custom_sixten'}</p>
                    </div>
                    <div class="sx-logo sx-logo--import">
                        <p class="mm-tools-title">{l s='Import a logo' mod='mm_custom_sixten'}</p>
                        <div class="sx-drop" tabindex="0" role="button" aria-label="{l s='Import a logo' mod='mm_custom_sixten'}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                            <strong>{l s='Drop your logo here' mod='mm_custom_sixten'}</strong>
                            <span>{l s='or' mod='mm_custom_sixten'} <u>{l s='browse your files' mod='mm_custom_sixten'}</u></span>
                        </div>
                        <p class="sx-logo__hint">{l s='PNG, JPG, SVG or WEBP · plain background removed automatically.' mod='mm_custom_sixten'}</p>
                    </div>
                </div>
            </div>

        </div>
    </div>

    {* Scène : le tapis (composant stage de mm_custom), zoom et rotation, repères, images *}
    <div class="sx-viewport">
        <div class="sx-rot">
            {include file='module:mm_custom/views/templates/front/configurator/components/stage.tpl'}
        </div>
        <div class="sx-zoomwrap"></div>
        <div class="sx-stage-hint">
            <button type="button" class="sx-toggle sx-toggle--hots" aria-pressed="false" title="{l s='Show the markers' mod='mm_custom_sixten'}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/></svg>
                <span>{l s='Show the markers' mod='mm_custom_sixten'}</span>
            </button>
            <button type="button" class="sx-shot" title="{l s='Download an image of the design' mod='mm_custom_sixten'}" aria-label="{l s='Download an image of the design' mod='mm_custom_sixten'}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
            </button>
            <button type="button" class="sx-shot sx-shot--story" title="{l s='Download an Instagram story (1080 × 1920)' mod='mm_custom_sixten'}" aria-label="{l s='Download an Instagram story (1080 × 1920)' mod='mm_custom_sixten'}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"/></svg>
            </button>
        </div>
    </div>

    {* Rail Couleurs / Textes / Logos : un bouton par sorte de zone présente sur le gabarit (layout.js) *}
    <nav class="sx-steps" aria-label="{l s='Steps' mod='mm_custom_sixten'}"></nav>
</div>

{include file='module:mm_custom/views/templates/front/configurator/components/modals.tpl'}

</div>
{/block}
