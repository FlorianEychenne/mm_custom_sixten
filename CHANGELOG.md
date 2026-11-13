# Historique des modifications — mm_custom_sixten

Une entrée par commit, la plus récente en haut.

---

## 13/11/2026

### Téléphone (Mathieu) : disquette centrée dans son bouton

- `views/css/site.css` : le libellé masqué de « Sauvegarder » reste un élément du bouton ; l'écart entre lui et le
  pictogramme (`gap`) décalait la disquette de 4 px vers la gauche. `gap:0` sur ce bouton. Vérifié sur une capture
  agrandie en 390 px.

### Téléphone (Mathieu) : en-tête réordonné, bouton « Panier »

- `views/css/site.css` (sous 992 px) : ligne 1 = S, nom, prix, fermer ; ligne 2 = Taille, Design, sauvegarder
  (disquette), « Panier » précédé de son pictogramme. Remplace la disposition du commit précédent (prix sur la ligne 2,
  panier en pictogramme seul). Toujours deux lignes (84 px), délai de fabrication masqué. Mise en ligne par flex.
- `views/templates/front/configurator.tpl` : le bouton panier porte un libellé long (« Ajouter au panier »,
  ordinateur et lecteurs d'écran) et un libellé court (« Panier », téléphone). Traductions : `Cart` (5 langues).
  Après déploiement : vider le fichier compilé du gabarit.
- Vérifié au navigateur en 390 × 844, 360 × 640, 820 × 1180 et 1440 × 900 (Honda 95x200 Classic) ; « Sauvegarder »
  ouvre toujours la fenêtre de connexion ; ordinateur inchangé.

### Téléphone (Mathieu) : en-tête sur deux lignes, boutons en pictogrammes

- `views/css/site.css` (sous 992 px) : l'en-tête passe de trois lignes à deux (84 px au lieu de 128 en 390 × 844).
  Ligne 1 : S, titre, sauvegarder (disquette), ajouter au panier (panier, rouge), fermer. Ligne 2 : Taille, Design
  (28 px de haut au lieu de 30), prix (16 px au lieu de 22). Le délai de fabrication n'est plus affiché. Les libellés
  « Sauvegarder » et « Ajouter au panier » restent dans la page pour les lecteurs d'écran, seuls les pictogrammes sont
  visibles. Rien ne change sur ordinateur.
- Vérifié au navigateur en 390 × 844, 360 × 640, 820 × 1180 et 1440 × 900 (Honda 95x200 Classic) : en-tête, titre
  entier, « Sauvegarder » ouvre toujours la fenêtre de connexion ; ordinateur inchangé.

### Vue 3D (Mathieu) : plus de lien « Ouvrir le lien » sous le QR code

- `views/js/viewer3d.js`, `site.css` : la fenêtre du QR code ne montre plus que le titre, le code et le texte. Chaîne
  `Open the link` retirée (`mm_custom_sixten.php`, 5 langues). Vérifié au navigateur (Honda 95x200 Classic).

### Téléphone (Mathieu) : pas de mention sur les couleurs imprimées

- `views/css/site.css` : sous 992 px, la mention « Les couleurs imprimées sur mesure peuvent légèrement varier… » n'est
  plus affichée sous la liste des couleurs. Elle reste sur ordinateur. Vérifié en 390 × 844 et 1440 × 900.

### Vue 3D (Mathieu) : bouton « quart de tour » à la place de la rotation automatique

- `views/js/viewer3d.js` : le premier bouton de la barre ne lance plus une rotation continue. Chaque clic tourne d'un
  quart de tour : en 3D la caméra tourne autour du tapis, à la même hauteur ; en vue de dessus le tapis tourne de 90°
  à l'écran. Dans les deux cas la vue est recadrée sur le tapis entier. Les animations de vue (quart de tour, vue de
  départ, vue de dessus) passent par les angles de la caméra (`orbitOf`, `fly`) : elle tourne autour du tapis au lieu
  de couper tout droit.
- `mm_custom_sixten.php`, traductions : `Turn a quarter turn` remplace `Turn automatically` (5 langues).
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic, rendu logiciel) : quatre quarts de tour en 3D,
  deux en vue de dessus (tapis couché puis debout), tapis entier à chaque fois, aucune erreur dans la console.

### Téléphone (Mathieu) : le volet défile jusqu'à la ligne choisie

- `views/js/layout.js` : sous 992 px, après une sélection (un logo, un texte ou une couleur touché sur le tapis, une
  ligne, un repère), la ligne choisie vient en haut du volet, avec son éditeur dessous (`showChosenRow()`, après le
  dessin des lignes ; défilement doux, direct si l'appareil demande moins d'animations). Avant, un logo touché ouvrait
  bien « Logos », mais sa ligne pouvait rester hors du volet (L5, L6).
- Vérifié au navigateur en 390 × 844 (Kawasaki 95x200 Classic) : L6, L3 puis L5 touchés sur le tapis, ligne L4 touchée
  dans le volet ; chaque fois la ligne est visible en haut du volet.

### Vue 3D (Mathieu) : QR code « Voir chez moi » sur ordinateur

- `views/js/viewer3d.js` : sur un ordinateur (pas de réalité augmentée, pointeur principal non tactile), le bouton
  « Voir chez moi » est affiché et ouvre une fenêtre avec un QR code et le lien. Au premier clic, `options.share()`
  envoie l'image de l'impression au serveur ; le QR code (qrcode-generator 1.4.4, jsDelivr, chargé à ce moment) porte
  l'adresse de la page du téléphone. Échap ferme d'abord le QR code. La question « ce navigateur sait-il la RA ? »
  est bornée à 3 s (certains navigateurs n'y répondent jamais, le bouton ne venait pas).
- `controllers/front/ar.php` (nouveau) : `POST action=share` (jeton du visiteur de `mm_custom`, image en data URL,
  taille du tapis, titres) décode l'image, la réencode en JPEG (GD) dans `var/mm_custom_sixten_ar/` du site et rend
  l'adresse `…/module/mm_custom_sixten/ar?k=<identifiant>` ; 48 h, 300 partages au plus, 6 Mo et 4 096 px au plus.
  `GET k=…` : la page du téléphone ; `&img=1` : l'image. Lien expiré : message.
- `views/templates/front/ar.tpl` (nouveau) : la page du téléphone ouvre la même vue 3D (`viewer3d.js`), avec
  « Voir chez moi » si le téléphone sait poser le tapis au sol.
- `views/js/layout.js` : `shareArt()` (impression en JPEG, 3 000 px de large au plus). `mm_custom_sixten.php` : adresse
  `ar`, `jsTranslations()` publique, chaînes du QR code ; traductions (5 langues) ; `site.css` : fenêtre et page.
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic) : QR code et lien sur ordinateur, page du
  téléphone en 390 × 844 avec la vue 3D, ses titres et l'image (340 Ko), lien inconnu = message d'expiration, aucune
  erreur dans la console. Pas vérifié : un vrai téléphone (lecture du QR code, pose en RA sur iPhone et Android). Sur
  les sites protégés (dev, new avant la bascule), le téléphone doit passer la protection (IP autorisée ou identifiant).

### Téléphone (Mathieu) : « Réinitialiser le design » demande confirmation

- `views/js/layout.js` : sous 992 px (mise en page téléphone), le bouton « Réinitialiser le design » ouvre d'abord une
  fenêtre « Réinitialiser le design ? » qui prévient que toutes les modifications seront effacées, avec « Réinitialiser »
  et « Continuer à modifier » (croix, Échap et clic à côté ferment aussi). Sur ordinateur, la réinitialisation reste
  immédiate (elle s'annule par « Annuler »). Fenêtre aux classes du module, comme celle du changement d'option.
- `mm_custom_sixten.php`, traductions : `Reset the design?`, le texte de la fenêtre et `Reset` (5 langues).
  `site.css` : le titre de la fenêtre laisse la place de la croix.
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic) : en 390 × 844, la fenêtre s'ouvre sans rien
  changer, « Continuer à modifier » la ferme et garde le design, « Réinitialiser » revient au départ (annulable) ; en
  1440 × 900, pas de fenêtre. Aucune erreur dans la console.

### Couleurs (Mathieu) : noir et blanc en tête de la liste « Tendances »

- `views/js/layout.js` : le noir puis le blanc sont les deux premières pastilles de la liste (outil Couleurs et couleur
  des textes), avant les couleurs de marques ; une couleur de marque noire ou blanche n'est pas affichée en double.
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic), dans les deux outils.

### Couleurs (Mathieu) : une seule liste « Tendances », avec le noir et le blanc

- `views/js/layout.js` (outil Couleurs et couleur des textes) : la liste « Marques » prend le titre « Tendances » et
  reçoit le noir (#000000) et le blanc (#FFFFFF), puis les couleurs du gabarit qui n'y sont pas déjà. L'ancienne liste
  « Tendances » du module n'est plus affichée (`hidden`). La note d'impression suit la liste. Sans couleurs de marques,
  la liste du module reste, avec les couleurs du gabarit. Le sélecteur de couleur (`mm-wheel`) ne change pas.
- `mm_custom_sixten.php`, traductions : chaîne `Trends` (Tendances, 5 langues). `site.css` : `.colors-section[hidden]`.
- Vérifié au navigateur sur dev.24fluence.com (Kawasaki 95x200 Classic) : 11 pastilles dans les deux outils, blanc
  appliqué à une zone, noir à un texte, sélecteur de couleur présent, aucune erreur dans la console.

### Téléphone (Mathieu) : volet plus haut

- `views/css/site.css` : volet ouvert, le tapis garde 40 % de l'écran (50 % depuis ce matin, 34 % avant). Sur un écran de
  390 × 844, le volet passe d'environ 220 à 302 px : le champ du texte et ses curseurs sont visibles sans défiler. Le tapis
  tourné se recale sur la scène (vue 0,94).

### Configurateur (Mathieu) : les contournements du moteur passent dans mm_custom

- `layout.js` s'appuie sur les nouvelles fonctions de mm_custom (entrée « Moteur » du 13/11/2026) au lieu de les refaire :
  - quart de tour : `ui.zoom.mount(…, { rotate: true, autoTurn: true })`, la fonction `turnOnPhones` est retirée ;
  - tailles en cm : `MmCustom.product.cmPerUnit()`, `texts.capHeight` / `setCapHeight`, `logos.width` / `setWidth`
    (mesure de la police au canvas, échelle de la matrice et recherche par la sécante retirées) ;
  - zone imprimable : `MmCustom.drag.keepInside` après un curseur du texte (calcul de la zone retiré) ;
  - poignées : `MmCustom.drag.configure({ touchHandles: false })` ; la règle de `site.css` qui les masquait sous 768 px
    est retirée (au doigt désormais, et non selon la largeur de l'écran).
- 180 lignes de moins dans `layout.js`. Mêmes résultats aux mêmes tests (1440 et 390 px), logo importé plus juste à 40 cm
  (40,03 cm au lieu de 37).

### Encre (Mathieu) : le recalcul passe dans mm_custom

- Le recalcul de l'encre après chaque modification (`MmCustom.effects.refresh()` dans `layout.js`, entrée suivante) est
  retiré : le moteur le fait lui-même désormais (`effects.js` de mm_custom, entrée du 13/11/2026), plus légèrement (zones
  seules, une fois par image, y compris pendant un glisser).

### Textes (Mathieu) : un texte agrandi ou déplacé n'est plus coupé ; curseurs bornés au tapis

- **Bug** : l'encre du moteur (`effects.js`) est un filtre par élément de premier niveau du gabarit, sa zone (tout le tapis)
  calculée une fois dans le repère de l'élément. Sur les gabarits où un texte est lui-même un élément de premier niveau
  (Honda 95x240 Classic, le « 201 »), le déplacement du texte entre dans ce repère : la zone suit le texte, et ce qui la
  dépasse (texte agrandi, déplacé plus loin) est masqué, dans tous les navigateurs. `layout.js` fait recalculer l'encre
  (`MmCustom.effects.refresh()`, 120 ms après la dernière modification) à chaque texte ou logo modifié, déplacé ou tourné.
  Mesuré : zone de -1509 à 5229 sur un tapis de 6718 avant, -10 à 6728 après.
- **Curseurs du texte bornés** : après un changement de taille ou de décalage, le texte est ramené dans la partie
  imprimable du tapis (tapis moins semelle et marge, comme pour le glisser de `drag.js`) ; trop grand, il est centré.
- **Taille en cm** : la hauteur est mesurée perpendiculairement à la ligne de base (un texte étiré ou penché par sa matrice,
  comme les numéros, n'est plus mesuré avec son échelle horizontale).
- Vérifié sur Honda 95x240 Classic à 1440 px : « 201 » déplacé à la souris puis porté à 30 cm, entièrement visible.

### Textes et scène (Mathieu) : plus d'alignement gauche / centre / droite ; icônes en colonnes sur téléphone seulement

- Textes : les boutons d'alignement ne sont plus montés (`align: false`), le texte se déplace (décalage, glisser) ; la barre
  du texte, vide, est masquée et l'espace sous le champ réduit.
- Outils de la scène : en ligne sur ordinateur, comme avant, avec la 3D à côté de la rotation et du zoom ; en colonnes
  sous 992 px seulement (à gauche repères, image, story, annuler, réinitialiser ; à droite 3D, rotation, +, 100 %, −).
- Vérifié à 1440 et 390 px : aucun bouton d'alignement, outils en ligne puis en colonnes.

### Logos (Mathieu) : plus de bloc « Votre logo » en double ; pas de repère L1, T1… sur téléphone

- Le bloc « Votre logo » (vignette, nom, origine) répétait la ligne L1… juste au-dessus : masqué (`site.css`), gardé dans le
  gabarit pour `layout.js`. Le bouton « Retirer » quitte ce bloc pour le pied de l'éditeur, sous les curseurs
  (`configurator.tpl`).
- Sous 768 px, les repères L1, T1, C1… devant les lignes ne s'affichent plus : la vignette et le nom suffisent.
- Vérifié à 1440 et 390 px avec un logo importé : bloc masqué, « Retirer » visible et fonctionnel, repères présents sur
  ordinateur seulement.

### Téléphone (Mathieu) : pas de poignées sur les logos non plus

- `views/css/site.css` : sous 768 px, les coins et la poignée de rotation sont masqués pour toute sélection, texte ou logo ;
  le cadre reste, l'élément se déplace au doigt. La classe `sx-sel-text` posée sur `body` (`layout.js`) n'a plus d'usage : retirée.
- Vérifié à 390 px (coins et rotation masqués, cadre affiché, pour un logo et un texte) et à 1440 px (poignées inchangées).

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
