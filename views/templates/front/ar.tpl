{extends file='page.tpl'}

{* « Voir chez moi » ouvert depuis le QR code de la vue 3D d'un ordinateur (controllers/front/ar.php) : la même vue 3D,
   avec le bouton de réalité augmentée quand le téléphone sait poser le tapis au sol. *}

{block name='page_content'}
<div class="sx3d-share">
    {if $mmcs_ar}
        <p class="sx3d-share__eyebrow">{$mmcs_ar.subtitle|escape:'html':'UTF-8'}</p>
        <h1 class="sx3d-share__title">{$mmcs_ar.title|escape:'html':'UTF-8'}</h1>
        <p class="sx3d-share__text">{l s='Your mat in 3D, in real size: tap « See it at home » and aim at the floor.' mod='mm_custom_sixten'}</p>
        <button type="button" class="sx3d-share__open" id="sx3d-share-open">{l s='See the mat in 3D' mod='mm_custom_sixten'}</button>
        <p class="sx3d-share__note" id="sx3d-share-note" hidden>{l s='The 3D view is not available on this device.' mod='mm_custom_sixten'}</p>
        <script type="application/json" id="sx3d-share-cfg">{$mmcs_ar_json nofilter}</script>
        {literal}<script type="module">
            const cfg = JSON.parse(document.getElementById('sx3d-share-cfg').textContent);
            const t = (key, fallback) => (Object.prototype.hasOwnProperty.call(cfg.translations, key) ? cfg.translations[key] : fallback);
            const button = document.getElementById('sx3d-share-open');
            const note = document.getElementById('sx3d-share-note');
            const image = new Promise((resolve, reject) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');

                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve(canvas);
                };
                img.onerror = reject;
                img.src = cfg.image;
            });
            let viewer = null;

            async function show() {
                button.disabled = true;

                try {
                    viewer = viewer || await import(cfg.viewer);

                    if (!viewer.supported()) throw new Error('webgl');

                    const art = await image;

                    button.disabled = false;
                    await viewer.open({
                        art,
                        felt: cfg.felt,
                        inkBlur: cfg.inkBlur,
                        sizeCm: { length: cfg.length, width: cfg.width },
                        title: cfg.title,
                        subtitle: cfg.subtitle,
                        fileName: 'tapis-3d',
                        t,
                    });
                } catch (error) {
                    console.error('mm_custom_sixten: 3D', error);
                    note.hidden = false;
                }

                button.disabled = false;
            }

            button.addEventListener('click', show);
            show();
        </script>{/literal}
    {else}
        <p class="sx3d-share__text">{l s='This link has expired. Open the 3D view on your computer again to get a new code.' mod='mm_custom_sixten'}</p>
    {/if}
</div>
{/block}
