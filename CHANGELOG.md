# Historique des modifications — mm_custom_sixten

Une entrée par commit, la plus récente en haut.

---

## 11/11/2026

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
