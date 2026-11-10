// Tests de bout en bout du configurateur Sixten (compagnon actif), sur les outils de mm_custom/tests/e2e/lib.mjs.
//   node modules/mm_custom_sixten/tests/e2e/run.mjs            vérifie (code 1 s'il y a un échec)
//   node modules/mm_custom_sixten/tests/e2e/run.mjs --update   enregistre les captures comme nouvelles références
// Variables : celles de mm_custom (MMC_E2E_PLAYWRIGHT, MMC_E2E_MYCNF, MMC_E2E_DIR, MMC_E2E_PNGJS), voir son README.
// Le produit de test (tapis Ducati 95x240 Classic) doit être rangé sous la catégorie racine réglée dans le module.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = await import(path.join(here, '../../../mm_custom/tests/e2e/lib.mjs'));
const { launch, openConfigurator, makePng, sql, BASE } = lib;

const MAT = '/fr/module/mm_custom/customModule?sku=SIXCUST-DUC-95x240-Classic';
const update = process.argv.includes('--update');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const work = process.env.MMC_E2E_DIR || '/tmp';
const outDir = path.join(work, 'out-sixten');
const visualDir = path.join(work, 'visual-golden-sixten'); // hors dépôt : les captures dépendent des polices et des données du dev
const MAX_DIFF_RATIO = 0.0005;
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(visualDir, { recursive: true });

let PNG = null;
async function pixelDiff(a, b) {
  PNG = PNG || (await import(process.env.MMC_E2E_PNGJS || 'pngjs')).PNG;
  const x = PNG.sync.read(a); const y = PNG.sync.read(b);
  if (x.width !== y.width || x.height !== y.height) return Infinity;
  let n = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) > 8 || Math.abs(x.data[i + 1] - y.data[i + 1]) > 8 || Math.abs(x.data[i + 2] - y.data[i + 2]) > 8) n++;
  }
  return n / (x.width * x.height);
}

let failures = 0;
const report = (name, ok, info) => {
  console.log(`${ok ? 'ok    ' : 'ECHEC '} ${name}${info !== undefined ? ' : ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`);
  if (!ok) failures++;
};
const expect = (name, actual, test) => report(name, typeof test === 'function' ? !!test(actual) : actual === test, actual);

async function shot(page, key) {
  await page.mouse.move(1, 1);
  await page.waitForTimeout(500);
  const png = await page.screenshot();
  fs.writeFileSync(path.join(outDir, key + '.png'), png);
  const ref = path.join(visualDir, key + '.png');

  if (update || !fs.existsSync(ref)) {
    fs.writeFileSync(ref, png);
    console.log(`ref    ${key}`);

    return;
  }

  const ratio = await pixelDiff(png, fs.readFileSync(ref));
  report('capture ' + key, ratio <= MAX_DIFF_RATIO, `${(ratio * 100).toFixed(4)} % de pixels différents`);
}

const zoneText = (page, i) => page.evaluate((n) => MmCustom.zones.all('text')[n].element.textContent, i);

const scenarios = {
  // Captures : en-tête, rail, panneau de chaque outil, repères, designs ; tablette et téléphone
  visual: async () => {
    for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['tablet', { width: 820, height: 1180 }], ['phone', { width: 390, height: 844 }]]) {
      const { browser, page, logs } = await launch({ viewport });

      try {
        await openConfigurator(page, MAT);
        await page.waitForTimeout(800);
        await shot(page, `${device}-home`);
        await page.click('.sx-steps button[data-tool="colors"]');
        await shot(page, `${device}-colors`);
        await page.click('.sx-steps button[data-tool="text"]');
        await page.locator('.sx-rows--text .sx-row').nth(2).click();
        await shot(page, `${device}-text-row`);

        if (device === 'desktop') {
          await page.click('.sx-steps button[data-tool="logo"]');
          await page.locator('.sx-rows--logo .sx-row').first().click();
          await page.click('.sx-toggle--hots');
          await shot(page, `${device}-logo-markers`);
          await page.click('.sx-design-btn');
          await page.waitForTimeout(1500);
          await shot(page, `${device}-designs`);
        }

        report(`${device} : console sans erreur`, !logs.length, logs.slice(0, 3));
      } catch (e) {
        report(`${device} : captures`, false, e.message.split('\n')[0]);
        await page.screenshot({ path: path.join(outDir, `${device}-erreur.png`) }).catch(() => {});
      } finally {
        await browser.close();
      }
    }
  },

  // Parcours : texte, police, taille, masquer, couleurs, roue, logos, image, story, rotation, zoom, confirmations, panier
  flow: async () => {
    const { browser, page, logs } = await launch({});

    try {
      await openConfigurator(page, MAT);
      await page.waitForTimeout(800);
      expect('panneau fermé à l\'ouverture', await page.evaluate(() => document.body.classList.contains('sx-dock-open')), false);

      // Texte
      await page.click('.sx-steps button[data-tool="text"]');
      expect('panneau ouvert par le rail', await page.evaluate(() => document.body.classList.contains('sx-dock-open')), true);
      await page.locator('.sx-rows--text .sx-row').nth(2).click();
      expect('éditeur sous la ligne choisie', await page.evaluate(() => document.querySelector('.sx-rows--text .sx-row.on').nextElementSibling.classList.contains('sx-editor')), true);
      await page.locator('.sx-editor--text textarea').fill('ROSSI');
      await page.waitForTimeout(200);
      expect('texte écrit', await zoneText(page, 2), 'ROSSI');
      expect('titre de la ligne', await page.locator('.sx-rows--text .sx-row.on .sx-row__title').textContent(), 'ROSSI');
      await page.click('.sx-fontmenu__btn');
      await page.locator('.sx-fontlist li').first().click();
      expect('police choisie', await page.evaluate(() => getComputedStyle(MmCustom.zones.all('text')[2].element).fontFamily), (v) => /Anton/.test(v));
      const size0 = await page.evaluate(() => MmCustom.texts.size(MmCustom.zones.all('text')[2].element));
      await page.locator('.sx-size button').last().click();
      expect('taille du texte +10 %', await page.evaluate(() => MmCustom.texts.size(MmCustom.zones.all('text')[2].element)), (v) => v > size0);
      await page.locator('.sx-editor--text .leave-empty').click();
      expect('texte caché', await page.evaluate(() => MmCustom.texts.isHidden(MmCustom.zones.all('text')[2].element)), true);
      expect('œil barré sur la ligne', await page.locator('.sx-rows--text .sx-row.on').evaluate((r) => r.classList.contains('is-hidden')), true);
      await page.locator('.sx-editor--text .leave-empty').click();
      expect('texte remontré', await page.evaluate(() => MmCustom.texts.isHidden(MmCustom.zones.all('text')[2].element)), false);

      // Couleurs (« Suivant » passe aux logos, puis le rail revient aux couleurs)
      await page.click('.sx-dock__next');
      expect('Suivant : outil suivant', await page.locator('.sx-dock__eye').textContent(), 'Logos');
      await page.click('.sx-steps button[data-tool="colors"]');
      await page.locator('.sx-rows--colors .sx-row').nth(1).click();
      await page.locator('.sx-editor--colors .mm-wheel-hex').fill('#12ab34');
      await page.locator('.sx-editor--colors .mm-wheel-hex').press('Tab');
      expect('couleur par le code', await page.evaluate(() => MmCustom.colors.toHex(MmCustom.colors.read(MmCustom.zones.all('color')[1].element))), '#12ab34');
      await page.locator('.sx-editor--colors .mm-wheel-swatch').click();
      await page.waitForSelector('.mmc-color-pop.is-open .IroColorPicker', { timeout: 15000 });
      expect('roue au premier plan', await page.evaluate(() => { const p = document.querySelector('.mmc-color-pop.is-open'); const r = p.getBoundingClientRect(); return p.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }), true);
      await page.keyboard.press('Escape');

      // Logo de la bibliothèque dans L1 : la ligne garde sa place et prend le nom du logo
      await page.click('.sx-steps button[data-tool="logo"]');
      await page.locator('.sx-rows--logo .sx-row').first().click();
      await page.click('.sx-lib-btn');
      await page.fill('.mmc-lib__search', 'yamaha');
      await page.waitForTimeout(300);
      await page.locator('#modal-logos-library .mmc-lib__item:not([hidden]) img').first().click();
      await page.waitForFunction(() => MmCustom.logos.placed().length === 1, null, { timeout: 20000 });
      await page.waitForTimeout(300);
      expect('ligne L1 à sa place', await page.locator('.sx-rows--logo .sx-row').first().evaluate((r) => r.querySelector('.sx-row__badge').textContent + ' ' + r.querySelector('.sx-row__title').textContent), (v) => /^L1 Yamaha/i.test(v));
      expect('vignette « Votre logo »', await page.locator('.sx-logo--current .sx-meta b').textContent(), (v) => /Yamaha/i.test(v));
      const x0 = await page.evaluate(() => MmCustom.geometry.boundsOf(MmCustom.logos.frame(MmCustom.logos.placed()[0])).x);
      await page.evaluate(() => { const i = document.querySelector('.sx-logo-pos input'); i.value = 100; i.dispatchEvent(new Event('input', { bubbles: true })) });
      expect('décalage gauche / droite', await page.evaluate((x) => Math.round(MmCustom.geometry.boundsOf(MmCustom.logos.frame(MmCustom.logos.placed()[0])).x - x), x0), 100);
      expect('décalage en cm', await page.locator('.sx-logo-pos__val').textContent(), '+ 4 cm');
      await page.evaluate(() => { const i = document.querySelector('#sx-logo-size'); i.value = Number(i.value) + 300; i.dispatchEvent(new Event('input', { bubbles: true })) });
      await page.waitForTimeout(200);
      expect('alerte de dépassement', await page.isVisible('.sx-logo-hint'), true);
      await page.click('.sx-logo-hint');
      await page.waitForTimeout(200);
      expect('logo ramené dans son emplacement', await page.evaluate(() => MmCustom.logos.overflows(MmCustom.logos.placed()[0])), false);
      await page.click('.sx-remove');
      expect('logo retiré', await page.evaluate(() => MmCustom.logos.placed().length), 0);

      // Import par la zone de dépôt
      await page.locator('.sx-rows--logo .sx-row').nth(1).click();
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('.sx-drop')]);
      await chooser.setFiles({ name: 'mon-logo.png', mimeType: 'image/png', buffer: makePng(80, 40, [0, 90, 200, 255]) });
      await page.waitForFunction(() => MmCustom.logos.placed().length === 1, null, { timeout: 20000 });
      await page.waitForTimeout(300);
      expect('logo importé', await page.locator('.sx-rows--logo .sx-row').nth(1).locator('.sx-row__title').textContent(), 'mon logo');

      // Image du design, story Instagram
      const [image] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.sx-shot:not(.sx-shot--story)')]);
      expect('image du design', image.suggestedFilename(), (v) => /design\.png$/.test(v));
      const [story] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.sx-shot--story')]);
      expect('story Instagram', story.suggestedFilename(), (v) => /-story\.png$/.test(v));
      await story.saveAs(path.join(outDir, 'story.png'));
      PNG = PNG || (await import(process.env.MMC_E2E_PNGJS || 'pngjs')).PNG;
      const storyPng = PNG.sync.read(fs.readFileSync(path.join(outDir, 'story.png')));
      expect('story 1080 × 1920', storyPng.width + 'x' + storyPng.height, '1080x1920');

      // Scène : quart de tour, zoom, ⤢
      await page.click('.sx-toggle--rot');
      expect('quart de tour', await page.evaluate(() => MmCustom.stage.state().rotation), 90);
      await page.click('.sx-toggle--rot');
      await page.locator('.sx-zoom .mmc-zoom__in').click();
      expect('zoom +', await page.evaluate(() => MmCustom.stage.state().zoom), (v) => v > 1);
      await page.click('.sx-zoom__fit');
      expect('⤢ : retour à 100 %', await page.evaluate(() => MmCustom.stage.state().zoom), 1);

      // Création modifiée : confirmation avant un autre design, et avant de quitter
      await page.click('.sx-design-btn');
      await page.waitForTimeout(800);
      await page.locator('.mmc-designs__item:not(.is-current)').first().click();
      expect('confirmation de changement de design', await page.isVisible('.sx-switch.is-open'), true);
      expect('fenêtre des designs refermée', await page.isVisible('.mmc-designs.is-open'), false);
      await page.click('.sx-switch__stay');
      await page.click('.sx-config-close');
      expect('confirmation de sortie', await page.isVisible('.mmc-exit.is-open'), true);
      await page.click('.mmc-exit__stay');

      // Panier
      await Promise.all([page.waitForURL(/panier|cart/, { timeout: 60000 }), page.click('#add-to-cart')]);
      report('ajout au panier', true, page.url().replace(BASE, ''));
      report('console sans erreur', !logs.length, logs.slice(0, 3));
    } catch (e) {
      report('parcours', false, e.message.split('\n')[0]);
      await page.screenshot({ path: path.join(outDir, 'flow-erreur.png') }).catch(() => {});
    } finally {
      await browser.close();
    }
  },
};

// Le compagnon doit être actif sur le produit de test (ne pas lancer pendant la suite de mm_custom, qui les neutralise)
{
  const { browser, page } = await launch({});
  const companion = await openConfigurator(page, MAT).then(() => page.evaluate(() => (window.MmCustom && MmCustom.config.companion) || null)).catch((e) => 'erreur : ' + e.message.split('\n')[0]);
  await browser.close();
  if (companion !== 'mm_custom_sixten') {
    console.log(`ARRÊT  le compagnon actif sur ${MAT} est « ${companion} » et non mm_custom_sixten : vérifier MM_CUSTOM_SIXTEN_ROOT_CATEGORY (une suite de mm_custom interrompue a pu la laisser à 2147483647).`);
    process.exit(2);
  }
}

const ids = () => ({ cd: sql('SELECT IFNULL(MAX(id_cart_data),0) FROM ps_mm_custom_cart_data'), g: sql('SELECT IFNULL(MAX(id_guest),0) FROM ps_guest'), c: sql('SELECT IFNULL(MAX(id_connections),0) FROM ps_connections'), ca: sql('SELECT IFNULL(MAX(id_cart),0) FROM ps_cart') });
const before = ids();

try {
  for (const name of Object.keys(scenarios).filter((n) => !only.length || only.includes(n))) {
    console.log(`--- ${name}`);
    await scenarios[name]();
  }
} finally {
  // Nettoyage des données créées par les essais (paniers, invités, connexions)
  sql(`DELETE FROM ps_mm_custom_cart_data WHERE id_cart_data > ${before.cd}; DELETE FROM ps_cart_product WHERE id_cart > ${before.ca}; DELETE FROM ps_cart WHERE id_cart > ${before.ca}; DELETE FROM ps_connections_source WHERE id_connections > ${before.c}; DELETE FROM ps_connections WHERE id_connections > ${before.c}; DELETE FROM ps_guest WHERE id_guest > ${before.g};`);
}

console.log(failures ? `\n${failures} échec(s). Sorties dans ${outDir}` : '\nTout est bon.');
process.exit(failures ? 1 : 0);
