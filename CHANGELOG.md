# Historique des modifications — mm_custom_sixten

Une entrée par commit, la plus récente en haut.

---

## 12/11/2026

### Logos (Mathieu) : interrupteur « Cacher le logo » retiré, l'œil de la ligne suffit

- `views/templates/front/configurator.tpl` : le bloc « Cacher le logo » (`#sx-hide-logo`) de l'éditeur de logo est retiré ;
  `.sx-logo-foot` ne garde que l'avertissement « logo plus grand que son emplacement ». L'œil de la ligne cache et montre
  le logo (`MmCustom.logos.setVisible`, inchangé).
- `views/js/layout.js` : plus de `hideLogo` ni de `syncHides()`. `views/css/site.css` : toutes les règles `.leave-empty*`
  (l'interrupteur n'est plus utilisé nulle part dans l'interface Sixten) retirées. Chaîne `Hide the logo` retirée des 5 langues.
- Vérifié au navigateur sur new.sixten (Ducati 95x240 Racer) : éditeur de logo sans interrupteur, œil de la ligne.

### Textes (Mathieu) : interrupteur « Cacher le texte » retiré, l'œil de la ligne suffit

- `views/templates/front/configurator.tpl` : le bloc « Cacher le texte » (`#sx-hide-text`) de l'éditeur de texte est retiré ;
  `.sx-text-foot` reste, vide, comme repère d'insertion de la barre du texte. L'œil de la ligne cache et montre le texte.
- `views/js/layout.js` : plus de `hideText` (synchronisation et écouteur retirés) ; `syncHides()` ne suit plus que
  l'interrupteur du logo. `views/css/site.css` : règles `.leave-empty-text` retirées, `.sx-text-foot:empty` masqué.
- Chaîne `Hide the text` retirée des 5 langues ; `tests/e2e/run.mjs` clique l'œil de la ligne au lieu de l'interrupteur
  (suite non relancée). L'interrupteur « Cacher le logo » n'est pas touché.
- Vérifié au navigateur sur new.sixten (Ducati 95x240 Racer) : éditeur de texte sans interrupteur, œil de la ligne.

### Téléphone (Mathieu) : volet d'outils moins haut

- `views/css/site.css` (sous 992 px, volet ouvert) : le tapis garde 34 % de la hauteur de l'écran au lieu de 28 %
  (`--mm-stage-h`), le volet Couleurs / Textes / Logos est moins haut d'autant (353 px au lieu de 404 sur un écran de
  390 × 844). Le zoom et la rotation ne recouvrent plus le bas du tapis.
- Vérifié au navigateur en 390 × 844 et 360 × 640 (Honda 95x200 Racer, volet Couleurs ouvert).

### Outils du configurateur (Mathieu) : lignes repliables, œil, logo du modèle, annuler, réinitialiser, ordre des tailles

Demande `mm_custom` avec `MmCustom.history` et `MmCustom.logos.freeTransform()` (commit du même jour) : à déployer
ensemble. Sans eux, les boutons Annuler / Réinitialiser sont masqués et le logo du modèle n'a pas ses curseurs. Version
du module inchangée (1.0.1), non tagué.

- **Tailles** (`layout.js`) : le menu suit l'ordre des valeurs de l'attribut dans PrestaShop (celui que renvoie
  `MmCustomCombination::variants`) ; le tri « la plus grande d'abord » est retiré.
- **Lignes** (`layout.js`, `site.css`) : chaque ligne (couleurs, textes, logos) porte une flèche à droite. Un clic sur
  la ligne choisie replie ou déplie son éditeur ; la flèche pointe vers le bas quand il est ouvert. Une ligne est un
  `<div role="button">` (Entrée / Espace), plus un `<button>`, car elle contient maintenant un bouton.
- **Œil** : sur les lignes de texte et de logo (pas sur un emplacement libre), l'œil est un bouton qui cache ou montre
  le texte ou le logo, comme l'interrupteur « Cacher… » de l'éditeur, qui suit. Sur les logos, il remplace le mot
  « Changer » / « Ajouter » (chaînes `Change` et `Add` retirées, `Show` et `Hide` ajoutées, 5 langues).
- **Logo du modèle** : « Taille du logo » et « Décalage gauche / droite » sont proposés aussi pour un logo dessiné
  dans le gabarit (curseur de taille = son échelle : 0 = tel que dessiné, 100 = deux fois plus grand ; il suit les
  poignées), avec sa vignette dans « Votre logo ».
- **Annuler / Réinitialiser** (`configurator.tpl`, `layout.js`) : deux boutons à côté de l'image et de la story,
  grisés quand il n'y a rien à annuler. « Réinitialiser le design » revient à la création telle qu'elle a été ouverte
  et s'annule comme le reste. Après un retour en arrière, les lignes et les outils relisent le tapis.
- `tests/e2e/run.mjs` : `openRow()` n'ouvre une ligne que si elle ne l'est pas déjà (un second clic la replierait).
  Suite non relancée (environnement de Flo) : les captures de référence changent (œil, flèches, deux boutons).
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic, 1440 et 390 px) : ordre des tailles, repli des
  lignes, œil et interrupteur, taille / décalage d'un logo du modèle, annulation d'une couleur, d'un texte, d'une pose
  de logo, d'un curseur et d'un glisser, réinitialisation puis annulation, aucune erreur dans la console.

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
