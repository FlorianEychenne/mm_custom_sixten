# Historique des modifications — mm_custom_sixten

Une entrée par commit, la plus récente en haut.

---

## 11/11/2026

### 1.0.1 : accordé à mm_custom 3.0 lot 5 (à déployer avec lui)

**Demande `mm_custom` 3.0 à partir du lot 5** (commit `caf6501` ou suivant) et ne marche pas avec un plus ancien ; un
`mm_custom` du lot 5 ne marche pas non plus avec `mm_custom_sixten` 1.0.0 (gabarit `notice.tpl` supprimé : erreur Smarty
sur la page du configurateur). Les deux se déploient ensemble.

- Gabarit : plus de message « ajouté au panier » ; bouton panier simple (`type="button"`), sans formulaire ni champs
  cachés : la création part par `MmCustom.cart.add()` (AJAX), un JS en panne ne fait plus partir un formulaire refusé.
- Gestes au doigt vérifiés par `mm_custom/tests/e2e/touch.mjs companion`.

### 1.0.0 : interface Sixten du configurateur sur mm_custom 3.0

Première version : la mise en page et l'interface de `new.sixten` (thème `sixten` v0.18.72, interface 0.15), sans le
bloc configurateur du `custom.js` du thème ni ses clics simulés.

- Gabarit `configurator.tpl` (balisage de new.sixten, composants de `mm_custom`), `layout.js` (rail, panneau, lignes par
  zone, éditeurs, repères, zoom, quart de tour, image, story Instagram, choix du design, confirmations, panier),
  `site.css` (reprise de `mm-custom-theme.css`, adaptée à la scène `.mmc-stage`, à la semelle `svg.mmc-flat` et aux
  composants 3.0), `charter.css` (charte de repli hors du thème Sixten).
- Réglages du moteur : glisser sur tout le tapis, poignées et rotation, encre, semelle de 2 cm.
- Page de configuration : catégorie racine de la marque, délai de fabrication par langue.
- Traductions : français, allemand, espagnol, italien, néerlandais.
- Tests de bout en bout (`tests/e2e/run.mjs`).
