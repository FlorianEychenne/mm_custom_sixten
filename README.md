# mm_custom_sixten

Module compagnon de **`mm_custom`** (3.0) pour la marque **Sixten** : mise en page et interface du configurateur de
tapis, reprises de `new.sixten-environmental.com` (thème `sixten` v0.18.72, interface 0.15), sur le moteur
`window.MmCustom` de `mm_custom`, sans clics simulés.

Référence de l'architecture (qui porte quoi entre `mm_custom`, compagnons et thèmes) : `ECOSYSTEME_MM_CUSTOM.md` dans le
dépôt `mm_custom`.

## Ce que fait le module

- **Mise en page** (`views/templates/front/configurator.tpl`, déclaré à `mm_custom` par le hook
  `actionMmCustomRegisterCompanion`) : en-tête noir (logo S, nom du tapis, menus d'options, prix et délai, panier,
  sauvegarde, ×), rail Couleurs / Textes / Logos, panneau d'outils, scène. Les composants de `mm_custom` (scène,
  fenêtres, polices…) y sont inclus.
- **Interface** (`views/js/layout.js`) : une ligne par zone avec son éditeur sous la ligne choisie, éditeurs de texte
  (police avec aperçu, taille, alignement), de couleur (roue iro.js, code hexadécimal) et de logo (bibliothèque, dépôt d'un
  fichier, taille, décalage gauche / droite, masquer, retirer, alerte de dépassement), repères, zoom et quart de tour,
  image du design, **story Instagram** (1080 × 1920), choix du design en aperçus, confirmations (changement d'option,
  sortie), ajout au panier.
- **Réglages du moteur propres à Sixten** : glisser des logos sur tout le tapis, poignées de taille et rotation, encre
  sur le feutre, semelle de 2 cm (`#333`).
- **CSS** : `views/css/site.css` (mise en page, reprise de `mm-custom-theme.css` du thème Sixten), feuille non
  « layered » qui passe devant la couche `mmc.base` de `mm_custom`. `views/css/charter.css` : charte de repli (polices
  Montserrat et Azeret Mono, rouge Sixten), chargée seulement quand le thème actif n'est pas `sixten` (site de dev sous
  Hummingbird).

## Réglages (page de configuration du module)

| Clé | Rôle |
|---|---|
| `MM_CUSTOM_SIXTEN_ROOT_CATEGORY` | `0` sur le site Sixten (actif pour tous les produits) ; sur un site à plusieurs marques, id de la catégorie racine Sixten (99 sur `dev.24fluence.com`). |
| `MM_CUSTOM_SIXTEN_LEAD_TIME` | Délai affiché sous le prix, par langue (vide : « Fabrication : 3 semaines », traduit). |

## Installation

Dépend de `mm_custom` 3.0 (hooks `actionMmCustomRegisterCompanion` et `actionMmCustomAssets`).

```bash
php bin/console prestashop:module install mm_custom_sixten
```

Puis régler la catégorie racine si le site porte plusieurs marques, et vider le cache.

## Tests de bout en bout

`tests/e2e/run.mjs` : captures (ordinateur, tablette, téléphone) comparées à des références hors dépôt, et parcours
complet (texte, couleurs, logos, image, story, scène, confirmations, panier). Mêmes variables et même mise en place que
les tests de `mm_custom` (voir `mm_custom/tests/e2e/README.md`).

```bash
node modules/mm_custom_sixten/tests/e2e/run.mjs            # vérifie
node modules/mm_custom_sixten/tests/e2e/run.mjs --update   # enregistre les captures de référence
```

Gestes au doigt (écran tactile émulé : glisser, poignées, pincer, déplacer la scène, toucher) : le test de `mm_custom`
en mode compagnon.

```bash
node modules/mm_custom/tests/e2e/touch.mjs companion phone
node modules/mm_custom/tests/e2e/touch.mjs companion tablet
```

## Polices et images

Polices `views/fonts/*.woff2` (Montserrat, Azeret Mono, licence SIL Open Font License) et logos `views/img/` copiés du
thème Sixten.
