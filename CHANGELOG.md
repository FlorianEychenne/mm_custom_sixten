# Historique des modifications — mm_custom_sixten

Une entrée par commit, la plus récente en haut.

---

## 13/11/2026

### Configurateur (Mathieu) : police dans le champ du texte, tailles en cm, tapis tourné et outils en colonnes sur téléphone

- **Texte, police** (`views/js/layout.js`, `site.css`) : un seul champ ; le texte s'y écrit dans sa police, le nom de la police
  et ▾ sont à sa droite. La liste des polices (chacune écrit le texte saisi, son nom à droite) se déroule sous le champ dès
  qu'on l'utilise, reste ouverte pendant la saisie, se ferme au choix, à Échap ou en cliquant ailleurs ; ↓ en fin de texte y
  entre au clavier. Elle remplace le menu séparé de la barre. Calque fixe ajouté à `body` (il passait sous le volet).
- **Texte, taille et décalage** : comme pour les logos, deux curseurs. Taille du texte = hauteur des majuscules en cm
  (mesurée par police, « Hauteur des majuscules, en cm »), avec un champ en chiffres ; décalage gauche / droite en cm, mesuré
  depuis la position du texte à sa première sélection (bord gauche, centre ou bord droit selon l'alignement). Le « − 176 + »
  du moteur n'est plus monté (`size: false`). Vérifié : 6 cm saisis = 6,00 cm de majuscules mesurées.
- **Logo, taille en chiffres** : largeur du logo en cm à côté du curseur. Logo du modèle : mise à l'échelle ; logo posé : la
  valeur du curseur est cherchée par la sécante (une image importée grandit d'autant en largeur et en hauteur, pas en
  proportion). Le chiffre affiché après saisie est la largeur dessinée.
- **Téléphone** :
  - le tapis long est tourné d'un quart de tour à l'ouverture et remplit la scène (le module bornait la vue tournée à 100 %),
    recalé quand la scène change de taille (volet ouvert ou fermé) ; le bouton « pivoter » fait de même partout ;
  - volets Couleurs / Textes / Logos moins hauts : le tapis garde 50 % de l'écran (34 % avant) ;
  - logos : boutons « Bibliothèque » puis « Importer un logo » à la place de la zone de dépôt (`configurator.tpl`) ;
  - pas de poignées sur un texte sélectionné (classe `sx-sel-text` sur `body`) : le cadre reste, le texte se déplace au doigt.
- **Outils de la scène en colonnes**, sur téléphone comme sur ordinateur : à gauche repères, image, story, annuler,
  réinitialiser ; à droite 3D, rotation et zoom (+, 100 %, −, ⤢).
- Libellés des curseurs sur leur ligne, chiffre ou valeur à droite du curseur, colonnes alignées par le bas.
- Chaînes ajoutées en 5 langues (`textSize`, `textSizeCm`, `offset`, `logoSizeCm`, « Library », « Upload a logo »).

## 12/11/2026

### Vue 3D (Mathieu) : texture de la démo 3dmat, flou d'encre, zoom arrêté à la surface

- **Texture** (`views/js/viewer3d.js`) : comme la démo, photo de feutre (`views/img/felt.webp`, nouvelle, 2400 px = 200 cm,
  700 Ko, chargée au premier clic seulement) répétée à l'échelle réelle, impression posée en « overlay » à 95 % avec un léger
  flou d'encre (2 unités du gabarit, rayon calculé par `layout.js`), relief tiré du même feutre répété. L'impression vient de
  `MmCustom.export.canvas({ texture: false })` (le design sans feutre). L'assemblage est fait par la carte graphique (shader,
  noyau gaussien 5 × 5, formules de fusion du canvas, rendu dans une texture sRGB) : quelques millisecondes et le même
  résultat dans tous les navigateurs, alors que le filtre `blur` du canvas diffère selon les navigateurs (absent des anciens
  Safari) et qu'un flou en JavaScript prenait 2 à 4 s. Pour Quick Look, la texture est relue en canvas.
- **Zoom** : le point visé est ramené sur le dessus du tapis et la caméra reste au-dessus (au plus près 30 cm) ; le
  déplacement (clic droit, deux doigts) reste dans le plan du tapis. On ne passe plus au travers.
- Vérifié au navigateur (rendu logiciel) : fond orange #FD5100 en vue de dessus à 6 % de l'image 2D, grain du feutre
  visible de près, zoom maximal arrêté sur la surface, export USDZ réussi en simulant un iPhone, aucune erreur.

### Vue 3D (Mathieu) : réalité augmentée « Voir chez moi »

Reprise de la démo `_assets/3dmat` : poser le tapis personnalisé au sol, en taille réelle, avec le téléphone.

- `views/js/viewer3d.js` : bouton « Voir chez moi » au bout des outils de la vue 3D, affiché seulement si l'appareil sait le
  faire. iPhone / iPad : AR Quick Look, sur un fichier USDZ fabriqué dans le navigateur dès l'ouverture de la vue 3D
  (exporteur USDZ de three.js chargé seulement sur ces appareils ; relief converti en carte de normales, taille réelle
  bloquée). Android (Chrome, ARCore) : WebXR « immersive-ar » avec détection du sol ; aperçu du contour, pose au toucher,
  boutons tourner (15°), déplacer, fermer. Ordinateur et téléphones sans RA : pas de bouton (la création n'est pas
  enregistrée, un QR code n'aurait rien à ouvrir). Le tapis, son ombre et la lumière forment un groupe qu'on pose.
- `mm_custom_sixten.php` : 10 chaînes (5 langues) ; `views/css/site.css` : bouton et interface de la session.
- Éclairage de la vue 3D réglé à la mesure : en vue de dessus, un fond orange #FD5100 sortait blanchi (écart de 94 sur 255 avec
  l'image 2D : réglages de la démo, pensés pour un fond sombre) ; il en est maintenant à 1 ou 2 % (exposition 0,76, lumière
  1,55, ciel 0,2, environnement 0,5, duvet 0,04 : constante `LIGHTING`). Option `view: 'top'` et `lighting` pour les essais.
- Vérifié au navigateur (sans RA réelle) : pas de bouton sur ordinateur, export USDZ réussi en simulant un iPhone (bouton
  affiché après préparation), vue 3D inchangée. Pas vérifié sur un vrai iPhone ni un vrai Android : à tester.

### Vue 3D (Mathieu) : voir le tapis personnalisé en 3D

Reprise de la démo `_assets/3dmat` de new.sixten (three.js 0.170) dans le configurateur.

- `views/js/viewer3d.js` (nouveau, module ES) : fenêtre plein écran avec le tapis en 3D (base caoutchouc de 2 mm, insert
  feutre en retrait de 2 cm qui dépasse de 4 mm, ombre au sol, éclairage d'intérieur), tourner / zoomer à la souris ou au
  doigt, rotation automatique, retour à la vue de départ, vue de dessus, téléchargement de la vue en PNG, Échap ou croix pour
  fermer (contexte WebGL et textures libérés). Texture : `MmCustom.export.canvas({ width: 4096 })`, donc le tapis tel qu'il
  est à l'écran (feutre de la taille, impression en overlay, polices et logos incorporés, bordure) ; relief tiré de la photo
  du feutre de la scène. Dimensions réelles : `MmCustom.product.sizeCm()`.
- `views/js/layout.js` : bouton « 3D » après la story, proposé si la taille est connue (4 m au plus) ; au premier clic
  seulement, `viewer3d.js` et three.js sont chargés (jsDelivr, version figée, modules `+esm`) ; message si WebGL manque.
- `mm_custom_sixten.php` : URL de `viewer3d.js` (avec la date du fichier) dans `mm_custom_sixten.viewer3d` ; 9 chaînes
  (5 langues). `views/css/site.css` : bouton et fenêtre (fond papier clair, croix et outils comme les autres fenêtres).
- Rendu à la demande : la scène n'est redessinée que quand la vue change (geste, inertie, animation), immobile elle ne consomme
  rien. Vérifié au navigateur sur new.sixten (Ducati 95x240 Racer, 1440 et 390 px, rendu logiciel) : bouton, ouverture, design
  fidèle (polices, logos, couleurs), rotation à la souris, vue de dessus, fermeture par Échap, aucune erreur ; préparer l'image
  (4096 px) et charger three.js prend environ 0,5 s. Pas vérifié sur un vrai téléphone ni avec une carte graphique.
- Rien n'est chargé tant que le bouton n'est pas utilisé. three.js vient d'un CDN : à héberger dans le module avant la
  production si on préfère ne dépendre d'aucun tiers. Pas de réalité augmentée dans ce lot (la démo en a une : à reprendre).

### Habillage (Mathieu) : typographie alignée sur le site, fenêtres normalisées, survol des boutons d'outils

Le thème Sixten n'a plus de police mono (`--sx-mono` vaut Montserrat depuis le thème 0.21.0) : les textes en `var(--mmx-caps)` gardaient
des graisses fines à côté de titres en 900. Tout est dans `views/css/site.css`, aucun gabarit ni script touché.

- **Typographie** : dans les 45 règles en `var(--mmx-caps)` / `var(--sx-mono)`, petites capitales en graisse 600 (10 px au moins,
  interlettrage de 0,14em au plus), autres valeurs en 600. Boutons (`.mm-btn`, `.mm-btn-alt`, `.mm-btn-cart`, `.sx-lib-btn`,
  `.save-custom`, `.sx-design-btn`, `.btn` des fenêtres) comme les `.btn` du site : Montserrat 800, interlettrage 0,09em. Lignes
  d'information grises (`.sx-row__meta`, `.sx-meta small`) en texte courant (graisse 500, sans interlettrage).
- **Fenêtres** (`.mm-modal`, `.mm-existing-modal`, `#modal-logo-choice-content`, `#modal-logos-library-content`,
  `.mmc-designs__dialog`) : même forme partout (fond blanc, filet noir 1,5 px, angles droits, voile noir à 60 %) ; la fenêtre des designs
  perd son coin coupé, qui rognait son filet. Même croix partout (`.save-auth-close`, `.mm-existing-close`, `.mmc-designs__close`,
  `#close-logos-library-modal`) : carré noir de 2,75rem, croix blanche, rouge au survol ; dans le coin haut droit pour la fenêtre de
  connexion, le choix de logo et « Mes créations ». Fenêtre de connexion : onglets en deux segments (actif noir, texte blanc ; plus le
  bleu de Bootstrap), champs à filet noir sans le fond bleu du remplissage automatique, lien « Mot de passe oublié ? » en petites
  capitales soulignées.
- **Survol des boutons d'outils** (zoom, taille du texte) : fond noir et signe blanc, comme les autres boutons carrés. Le fond gris
  recouvrait le filet du groupe et donnait l'impression d'un bouton qui grossit.
- Vérifié au navigateur sur new.sixten (Ducati 95x240 Racer, 1440 px) : volets Textes et Logos, zoom au survol, fenêtres de connexion
  et de choix du design. Pas vérifié : bibliothèque de logos ouverte, « Mes créations », fenêtre de sortie, téléphone.

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
